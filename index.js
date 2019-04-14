var express = require("express");
var app = express();
var path = require('path');
var bodyParese = require('body-parser');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//connect to mongoose
var mongoose = require('mongoose');
mongoose.connect('mongodb://smartflyer:smartflyer123@ds227146.mlab.com:27146/smartflyer', {useNewUrlParser: true, poolSize: 100 },function(err){
    if(err) throw err;
    console.log("Successfully connected to MongoDB");
});


//route handlers
var waitTimes = require('./routes/wait-times');
var user = require('./routes/user');

//routes
app.use('/insert-wait-times',waitTimes);
app.use('/user',user);

app.get("/url", (req, res, next) => {
    res.json(["Tony","Lisa","Michael","Ginger","Food"]);
});

//serve on port 3000
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
   
module.exports = app;