var mongoose = require('mongoose');
var Schema =  mongoose.Schema;

var RatingSchema =  new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    rating:{type: Number,required:true},
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Rating',RatingSchema);