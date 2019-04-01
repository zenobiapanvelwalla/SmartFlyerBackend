var mongoose = require('mongoose');
var Schema =  mongoose.Schema;

var WaitTimesSchema =  new Schema({
    wait_time:{type:String, required:true},
    entered_by:{type:String, required:true},
    user:{
        type:Schema.ObjectId,
        ref:'User'
    },
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WaitTimes',WaitTimesSchema);