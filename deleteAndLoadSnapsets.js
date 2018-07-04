/*!
Copyright 2018 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/

// This script modifies the preferences data base:
// 1. Finds all the Prefs Safes of type "snapset" (prefsSafesType = "snapset"),
// 2. Finds all the GPII Keys associated with each snapset Prefs Safe
// 3. Deletes the found Prefs Safes and associated GPII Keys
// 4. Loads the latest Prefs Safes and GPII Keys from %universal/build/dbData
// 5. Loads the latest credentials, clients, and views from %universal/testData/dbData
//
// A sample command that runs this script:
// node deleteAndLoadSnapsets.js COUCHDBURL

"use strict";

var http = require('http'),
    fluid = require("../universal/node_modules/infusion");

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.dataLoader");
fluid.setLogging(fluid.logLevel.INFO)

var dbLoader = gpii.dataLoader;

debugger;
dbLoader.couchDBURL = process.argv[2];
if (gpii.dataLoader.couchDBURL === undefined) {
    fluid.log ("COUCHDB_URL environment variable must be defined");
    process.exit(1);
}
fluid.log("COUCHDB_URL: '" + dbLoader.couchDBURL + "'");
dbLoader.prefsSafesViewUrl = dbLoader.couchDBURL + "/_design/views/_view/findSnapsetPrefsSafes";
dbLoader.gpiiKeyViewUrl = dbLoader.couchDBURL + "/_design/views/_view/findGpiiKeysByPrefsSafeId";
dbLoader.docsToRemove=[];

/**
 * Find the Prefs Safes of type "snapSet", and ???
 * @param {Object} response - The response from the data base containing the
 *                            snapSet Prefs Safes as a JSON string.
 */
dbLoader.processSnapsets = function (response) {
    var snapSetsString = "";
    response.setEncoding("utf8");
    response.on("data", function (chunk) {
        snapSetsString += chunk;
    });
    response.on("end", function () {
        dbLoader.snapSets = JSON.parse(snapSetsString);
//        debugger;
        dbLoader.snapSets.rows.forEach(function (aSnapset) {
            aSnapset.value._deleted = true;
//            debugger;
            fluid.log(aSnapset.value._rev);
            dbLoader.docsToRemove.push(aSnapset.value);
        });
        dbLoader.addGpiiKeysAndBulkDelete(dbLoader.snapSets.rows, dbLoader.docsToRemove);
        fluid.log("Back from dbLoader.addGpiiKeysAndBulkDelete(), docsToRemove is: " + batchPostData);
        var batchPostData = JSON.stringify({"docs": dbLoader.docsToRemove});
    });
};

/**
 * Find the GPII key records associated with the given snapset Prefs Safes,
 * mark them for deletion, and then request that all be deleted in bulk.
 * @param {Array} snapSets      - The snapsets of interest.
 * @param {Array} docsToRemove  - Array to append the GPII key records to delete
 */
dbLoader.addGpiiKeysAndBulkDelete = function (snapSets, docsToRemove) {
    debugger;
    snapSets.forEach(function (aSnapset) {
//        fluid.log("addGpiiKeysAndBulkDelete: " + JSON.stringify(aSnapset.value, null, 2));

        var gpiiKeyId = aSnapset.value._id;
        var gpiiKeyViewUrl = dbLoader.gpiiKeyViewUrl + "?key=%22" + gpiiKeyId + "%22";
        fluid.log("addGpiiKeysAndBulkDelete: gpiiKeyViewUrl is " + gpiiKeyViewUrl);
        // This request doesn't end until after line 105 executes (too late)
        var getGpiiKeysRequest = http.request(gpiiKeyViewUrl, function (resp) {
            var respString = "";
            resp.setEncoding("utf8");
            resp.on("data", function (chunk) {
                respString += chunk;
            });
            resp.on("end", function () {
                debugger;
                fluid.log("addGpiiKeysAndBulkDelete: respString is " + respString);
                var gpiiKeyRecords = JSON.parse(respString);
                gpiiKeyRecords.rows.forEach(function (record) {
                    record.value._deleted = true;
                    docsToRemove.push(record.value);
                    fluid.log("[" + gpiiKeyId + ", " + docsToRemove.length + "] addGpiiKeysToRemove onEnd: " + JSON.stringify (docsToRemove[docsToRemove.length-1], null, 2));
                });
            });
            debugger;
            var x = 5;
        });
        getGpiiKeysRequest.on("error", function (e) {
            fluid.log("Finding snapsets GPII Keys error: " + e.message);
        });
        getGpiiKeysRequest.end();
        var x = 5;
    });
    dbLoader.doBatchDelete(docsToRemove);
};

/**
 * Delete the snapset Prefs Safes and their associated GPII Keys.
 * @param {Array} docsToRemove  - Array of records to delete.
 */
dbLoader.doBatchDelete = function (docsToRemove) {
    var batchDeleteOptions = {
        hostname: "localhost",
        port: 5984,
        path: "/gpii/_bulk_docs",
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Length": 0,          // filled in below
            "Content-Type": "application/json"
        }
    };
    var batchPostData = JSON.stringify({"docs": docsToRemove});
    batchDeleteOptions.headers["Content-Length"] = Buffer.byteLength(batchPostData);
    fluid.log("Batch Delete snapsets: " + batchPostData);
    fluid.log("Batch Delete snapsets: " + JSON.stringify(batchDeleteOptions, null, 2));
    var batchDeleteReq = http.request(batchDeleteOptions, function (res) {
        fluid.log("STATUS: " + res.statusCode);
        fluid.log("HEADERS: " + JSON.stringify(res.headers, null, 2));
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            fluid.log("BODY: " + chunk);
        });
        res.on('end', function () {
            fluid.log('Batch Delete snapsets: No more data in response.');
        });
    });
    batchDeleteReq.on('error', function (e) {
        fluid.error("Error deleting snapset Prefs Safes and their GPII Keys: " + e.message);
    });
    batchDeleteReq.write(batchPostData);
    batchDeleteReq.end();
};

debugger;
dbLoader.snapSetsRequest = http.request(dbLoader.prefsSafesViewUrl, dbLoader.processSnapsets);
dbLoader.snapSetsRequest.on("error", function (e) {
    fluid.log("Finding snapsets Prefs Safes error: " + e.message);
});
dbLoader.snapSetsRequest.end();
debugger;
var x = 5;
