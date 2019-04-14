var mongoose = require('mongoose');
var Schema =  mongoose.Schema;

var UserSchema =  new Schema({
    name:{type:String, required:true, },
    email: {type:String, required:false, unique: true},
    created: {
        type: Date,
        default: Date.now
    },
    password:{type:String, required:true},
});

module.exports = mongoose.model('User',UserSchema);