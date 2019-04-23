var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
let User = require('../schemas/UserSchema');
let Rating = require('../schemas/RatingSchema');

var response = {
    statusCode:200,
    message:""
};

/* GET home page. */
router.post('/insert', function(req, res, next) {
    console.log("Inserting rating",req.body);
    User.find({email:req.body.userEmail},function(err, user){
        if(err){
            response.statusCode = 500;
            response.message = "Something went wrong";
            res.send(response);
        }
        if(user!=null){
            console.log(user);
            Rating.findOneAndUpdate({user:user[0]._id},{user: user[0]._id,rating:req.body.rating},{upsert:true, new: true}, function(err, rating){
                if(err){
                    throw err;
                    response.statusCode = 500;
                    response.message = "Something went wrong";
                    res.send(response);
                } else {
                    response.statusCode = 200;
                    response.message = "Rating Saved";
                    res.send(response)
                }
            });
            // var rating = Rating.find({user: user._id}, function(err, rating){
            //     if(err) {
            //         response.statusCode = 500;
            //         response.message = "Something went wrong";
            //         res.send(response);
            //     }
            //     if(rating!=null){
            //         rating.rating = req.body.rating;
            //         rating.save(function(err){
            //             if(err) {
            //                 response.statusCode = 500;
            //                 response.message = "Something went wrong";
            //                 res.send(response);
            //             } else{
            //                     response.statusCode = 200;
            //                     response.message = "Rating Saved";
            //                     res.send(response);
            //             }
            //         });
            //     } else {
            //         var newRating = new Rating({user: user, rating: req.body.rating});
            //         newRating.save(function(err){
            //             if(err) {
            //                 response.statusCode = 500;
            //                 response.message = "Something went wrong";
            //                 res.send(response);
            //             } else {
            //                 response.statusCode = 200;
            //                 response.message = "Rating Saved!";
            //                 res.send(response);
            //             }
            //         }); 
            //     }
            // });
            
        } else {
            response.statusCode = 200;
            response.message = "This user does not exist";
            res.send(response);
        }
    });
});

module.exports = router;