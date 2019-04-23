var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AirportSchema = new Schema({
    city: {
        type: String,
    },
    country: {
        type: String,
        required: true
    },
    iata: {
        type: String,
        required: false,
    },
    icao: {
        type: String,
        required: true
    },
    latitude: {
        type: String,
        required: true
    },
    longitude: {
        type: String,
        required: true
    },
    altitude: {
        type: String,
        required: true
    },
    timezone: {
        type: String,
        required: true
    },
    dst: {
        type: String,
        required: true
    },
    tz: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    created: {
        type: Date,
        default: Date.now
    },
    averageWaitTime:{
        type: Number,
        default: 0
    },
    avgHourlyWaitTime:{
        type: Number,
        default: 0
    },
    distance:{
        type: Number,
        default: 0
    },
    waittimes: [
        {
            email : String,
            wait : Number,
            created: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

module.exports = mongoose.model('Airport', AirportSchema);