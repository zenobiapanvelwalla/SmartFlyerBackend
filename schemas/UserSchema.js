var mongoose = require('mongoose');
var Schema =  mongoose.Schema;

var UserSchema =  new Schema({
    first_name:{type:String, required:true},
    last_name:{type:String, required:true},
    email: {type:String, required:false},
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User',UserSchema);