//server/routes/routes.js
var express = require('express');
var router = express.Router();
const csv = require('csv-parser');
const fs = require('fs');
var bodyParser = require('body-parser');
var Airport = require('../schemas/AirportSchema');

let AllAirports = []
console.log("Generating airport cache:");
Airport.find({}, function (err, airports) {
    if (err) {
        console.log(err);
        res.status(401).json(err)
        return
    }
    AllAirports = airports
    console.log("Airport Cache Created: " + AllAirports.length);
});

router.route('/insertAirports')
    .post(function (req, res) {
        console.log("/insertAirports Called");
        let airports = [];
        fs.createReadStream('airports.csv')
            .pipe(csv())
            .on('data', (row) => {
                airports.push(row)
            })
            .on('end', () => {
                console.log('CSV file successfully processed');
                for (let i = 0; i < airports.length; i++) {
                    let row = airports[i];
                    var airport = new Airport();
                    airport.id = row.id;
                    airport.name = row.name;
                    airport.city = row.city;
                    airport.country = row.country;
                    airport.iata = row.iata;
                    airport.icao = row.icao;
                    airport.latitude = row.latitude;
                    airport.longitude = row.longitude;
                    airport.altitude = row.altitude;
                    airport.timezone = row.timezone;
                    airport.dst = row.dst;
                    airport.tz = row.tz;
                    airport.type = row.type;
                    airport.source = row.source;
                    airport.save(function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Added: " + row.icao);
                        }
                    });
                }
                res.status(200).json({
                    statusCode: 200,
                    message: "Airports Added!"
                });
            });
    })

router.route('/addUserWaitTime')
    .post(function (req, res) {
        console.log("/addUserWaitTime Called");
        console.log(req.body.email);
        console.log(req.body.wait);
        console.log(req.body.id);
        let waitTime = {
            email: req.body.email,
            wait: req.body.wait
        }
        Airport.findOneAndUpdate({
                _id: req.body.id
            }, {
                $push: {
                    waittimes: waitTime
                }
            },
            function (err, data) {
                if (err) {
                    console.log(err);
                    res.status(401).json(err)
                    return
                }
                res.json({
                    statusCode: 200,
                    message: "Time added!"
                });
            }
        );
    });


router.get('/getAll', function (req, res) {
    console.log("/getAll Called");
    Airport.find({}, function (err, airports) {
        if (err) {
            console.log(err);
            res.status(401).json(err)
            return
        }
        res.json(airports);
    });
});

router.post('/getOne', function (req, res) {
    console.log("/getOne Called");
    Airport.findOne({_id: req.body.id}, function (err, airports) {
        if (err) {
            console.log(err);
            res.status(401).json(err)
            return
        }
        res.json(airports);
    });
});

router.post('/search', function (req, res) {
    console.log("/search Called");
    if (!req.body.query) {
        res.status(401).json("Provide search query")
    }
    var query = new RegExp([".*", req.body.query, "$"].join(".*"), "i");
    console.log(query)
    Airport.find({
        $or: [{
                iata: {
                    "$regex": query,
                }
            },
            {
                name: {
                    "$regex": query,
                }
            }
        ]
    }, function (err, airports) {
        if (err) {
            console.log(err);
            res.status(401).json(err)
            return
        }
        let result = {
            data: airports
        }
        if (airports.length > 10) {
            result.data = airports.slice(0, 9)
        }
        res.json(result)
    });
});

router.post('/getNearest', function (req, res) {
    console.log("/search Called");
    if (!req.body.lat || !req.body.lon) {
        res.status(401).json("Provide user location")
    }
    let lat1 = parseFloat(req.body.lat)
    let lon1 = parseFloat(req.body.lon)

    let nearestAirports = []
    for (let i = 0; i < AllAirports.length; i++) {
        let lat2 = parseFloat(AllAirports[i].latitude)
        let lon2 = parseFloat(AllAirports[i].longitude)
        let d = distance(lat1, lon1, lat2, lon2, 'M');
        console.log("Distance for " + AllAirports[i].icao + ": " + d)
        if (d < 200) {
            console.log("Adding to Array" + AllAirports[i].icao)
            nearestAirports.push(AllAirports[i])
        }
    }

    let result = {
        data: nearestAirports
    }
    if (nearestAirports.length > 10) {
        result.data = nearestAirports.slice(0, 9)
    }
    res.json(result)

});

function distance(lat1, lon1, lat2, lon2, unit) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    } else {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit == "K") {
            dist = dist * 1.609344
        }
        if (unit == "N") {
            dist = dist * 0.8684
        }
        return dist;
    }
}

module.exports = router;