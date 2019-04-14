var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
let User = require('../schemas/UserSchema');
let WaitTimes = require('../schemas/WaitTimesSchema');

var response = {
    statusCode:200,
    message:""
};

/* GET home page. */
router.post('/insert', function(req, res, next) {
    console.log("Inserting data",req.body);
    var waitTime = new WaitTimes(req.body);
    waitTime.save(function(err, wait_time){
        if(err) response.message = err;
        else {
            response.message = "Data Inserted";
        }
        res.send(response);
    });
    
});

module.exports = router;