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
router.get('/', function(req, res, next) {
    console.log("Inserting data");
    response.message = "Data Inserted";
    res.send(response);
});
module.exports = router;