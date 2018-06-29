var http = require('http');
var querystring = require("querystring");

var baseOptions = {
    hostname: "localhost",
    port: 5984,
    method: "GET"
};

// var snapSetViewOptions = baseOptions; snapSetViewOptions.path = /gpii/_design/views/_view/findSnapsetPrefsSafes"

var snapSetsViewOptions = {
    hostname: "localhost",
    port: 5984,
    path: "/gpii/_design/views/_view/findSnapsetPrefsSafes",
    method: "GET"
};

var globalToRemoveArray = [];

var snapSetsString="";
var snapSetReq = http.request(snapSetsViewOptions, function (response) {
    response.setEncoding("utf8");
    
    response.on("data", function (chunk) {
        snapSetsString += chunk;
    });
    
    response.on("end", function () {
//        console.log(snapSetsString);
        var snapSets = JSON.parse(snapSetsString);
//        debugger;
        for (var i=0; i < snapSets.rows.length; i++) {
            var aSnapSet = snapSets.rows[i];
//            console.log("[" + aSnapSet.id + "," + aSnapSet.value._rev + "]");
        }
        globalToRemoveArray.push(snapSets.rows[0].value);
        globalToRemoveArray.push(snapSets.rows[5].value);
        globalToRemoveArray[0]._deleted = true;
//        globalToRemoveArray[1]._deletion = true;
        console.log(JSON.stringify(globalToRemoveArray[0], null, 2));
        addGpiiKeysToRemove(globalToRemoveArray);
        console.log("FOO!");
    });
});
snapSetReq.end();

getOmarOptions = {
    hostname: "localhost",
    port: 5984,
    path: "/gpii/omar",
    method: "GET"
};

var deleteString = "";
var deleteRequest = http.request(getOmarOptions, function (response) {
    console.log("STATUS: " + response.statusCode);
    response.setEncoding("utf8");
    
    response.on("data", function (chunk) {
        deleteString += chunk;
    });
    
    response.on("end", function () {
        console.log(deleteString);
    });
});
deleteRequest.end();


getGpiiKeysOptions = {
    hostname: "localhost",
    port: 5984,
    path: "/gpii/_design/views/_view/findGpiiKeysByPrefsSafeId",
    method: "GET"

};
function addGpiiKeysToRemove (anArray) {
    var gpiiKeyId = anArray[0]._id;
    console.log("addGpiiKeysToRemove:  _id is " + gpiiKeyId);
    getGpiiKeysOptions.path += ("?key=%22" + gpiiKeyId + "%22");
    console.log("addGpiiKeysToRemove:  query is " + getGpiiKeysOptions.path);
    var getGpiiKeyReq = http.request(getGpiiKeysOptions, function (resp) {
        var respString = "";
        resp.setEncoding("utf8");
        resp.on("data", function (chunk) {
            respString += chunk;
        });
        resp.on("end", function () {
            var gpiiKeyRecords = JSON.parse(respString);
            gpiiKeyRecords.rows.forEach(function (record) {
                record.value._deleted = true;
                anArray.push(record.value);
            });
            console.log("addGpiiKeysToRemove onEnd: " + JSON.stringify (anArray, null, 2));
            doBatchDelete(anArray);
        });  
    });
    getGpiiKeyReq.end();
}

batchDeleteOptions = {
    hostname: "localhost",
    port: 5984,
    path: "/gpii/_bulk_docs",
    method: "POST",
//    method: "DELETE",
    headers: {
        "Accept": "application/json",
        "Content-Length": 0,          // fill in later
        "Content-Type": "application/json"
    }
};
var batchPostData = "";
function doBatchDelete (anArray) {
    var theDocs = {};
    theDocs["docs"] = anArray;
    batchPostData = JSON.stringify(theDocs);
    batchDeleteOptions.headers["Content-Length"] = Buffer.byteLength(batchPostData);
    console.log("doBatchDelete: " + batchPostData);
    console.log("doBatchDelete: " + JSON.stringify(batchDeleteOptions, null, 2));
    var batchDeleteReq = http.request(batchDeleteOptions, function (res) {
        console.log("STATUS: " + res.statusCode);
        console.log("HEADERS: " + JSON.stringify(res.headers, null, 2));
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log("BODY: " + chunk);
        });
        res.on('end', function () {
            console.log('No more data in response.');
        });
    });
    batchDeleteReq.on('error', function (e) {
        console.error("problem with batchDeleteReq: " + e.message);
    });
    batchDeleteReq.write(batchPostData);
    batchDeleteReq.end();
}