//server/routes/routes.js
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var User = require('../schemas/UserSchema');

router.route('/insert')
    .post(function (req, res) {
        console.log("/insert Called");
        var user = new User();
        user.name = req.body.name;
        user.email = req.body.email;
        user.password = req.body.password;
        user.save(function (err) {
            if (err){
                console.log(err);
                res.status(401).send(err)
                return
            }
            res.status(200).send({
                statusCode:200,
                message:"Signup success!"
            });
        });
    })

router.route('/update')
    .post(function (req, res) {
        console.log("/update Called");
        const doc = {
            name : req.body.name,
            email : req.body.email,
            password : req.body.password,
        };
        console.log(doc);
        User.update({
            _id: req.body._id
        }, doc, function (err, result) {
            if (err){
                console.log(err);
                res.status(401).send(err)
                return
            }
            res.status(200).send('User successfully updated!');
        });
    });

router.get('/delete', function (req, res) {
    console.log("/delete Called");
    var id = req.body.id;
    User.find({
        _id: id
    }).remove().exec(function (err, expense) {
        if (err){
            console.log(err);
            res.status(401).send(err)
            return
        }
        res.send('User successfully deleted!');
    })
});

router.post('/login', function (req, res) {
    console.log("/login Called");

    User.find({email : req.body.email, password : req.body.password }, function (err, users) {
        if (err){
            console.log(err);
            res.status(401).send(err)
            return
        }
        if(users.length == 0){
            res.status(401).send("Not Found")
            return
        }            
        res.json(users[0]);
        });
});

router.get('/getAll', function (req, res) {
    console.log("/getAll Called");
    User.find({}, function (err, users) {
        if (err){
            console.log(err);
            res.status(401).send(err)
            return
        }            
        res.json(users);
        });    
});

module.exports = router;