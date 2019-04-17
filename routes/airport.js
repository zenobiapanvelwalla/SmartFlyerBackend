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
    Airport.find({country:"United States"}, function (err, airports) {
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
        country:"United States",
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
        console.log(result)
        for (let i = 0; i< result.data.length; i++){
            var sum = 0, count = 0, latestThreeSum = 0;
            for (var index = 0; index < result.data[i].waittimes.length; index ++) {
                sum += result.data[i].waittimes[index].wait
                count += 1
                //let createdDate = AllAirports[i].waittimes[index].created
                //console.log('Saved date is ' +createdDate)
            }
            //console.log("Adding  for " +AllAirports[i].name+  " avg is " + sum/count)
            result.data[i].averageWaitTime = isNaN(sum/count) ? "0" : sum/count.toString()
        }
        res.json(result)
    });
});

function findAvgWaitTime(total, num) {
    return total + num;
}


router.post('/getNearest', function (req, res) {
    console.log("/search Called");
    if (!req.body.lat || !req.body.lon) {
        res.status(401).json("Provide user location")
    }
    let lat1 = parseFloat(req.body.lat)
    let lon1 = parseFloat(req.body.lon)

    let nearestAirports = []
    for (let i = 0; i < AllAirports.length; i++) {
        if(AllAirports[i].country == 'United States'){

        let lat2 = parseFloat(AllAirports[i].latitude)
        let lon2 = parseFloat(AllAirports[i].longitude)

        let d = distance(lat1,lon1,lat2,lon2,'M');    
        //console.log("Distance for " + AllAirports[i].icao + ": " + d )
        if(d < 150){
            var sum = 0, count = 0, latestThreeSum = 0;
            let dateNow = new Date()
            for (var index = 0; index < AllAirports[i].waittimes.length; index ++) {
                sum += AllAirports[i].waittimes[index].wait
                count += 1
                //let createdDate = AllAirports[i].waittimes[index].created
                //console.log('Saved date is ' +createdDate)
            }
            //console.log("Adding  for " +AllAirports[i].name+  " avg is " + sum/count)
            AllAirports[i].averageWaitTime = isNaN(sum/count) ? "0" : sum/count.toString()
            console.log("Adding  for " +AllAirports[i].name+  " avg is " + AllAirports[i].averageWaitTime)
            nearestAirports.push(AllAirports[i])
        }        
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

router.get('/saveAirportImage', function (req, res) {
    let count = 0;
    console.log("/saveAirportImage Called");
    for(let i = 0 ; i<AllAirports.length ; i++){
        let st1 = AllAirports[i].city
        for(let j = 0 ; j<imageResource.length ; j++){
            let st2 = imageResource[j].name            
            if((st1.includes(st2) || st2.includes(st1) || st1 == st2) && AllAirports[i].image == "" ){
                count++
                let href = imageResource[j].href+"images"
                updateImage(href,AllAirports[i]._id )
                break
            }
        }
    }
    res.json({count:count})
});
const request = require('request');

function updateImage(href, id){
    request(href, { json: true }, (err, res, body) => {
        if (err) { 
            console.log(err); 
        }else if(body.photos){
        Airport.update(
            {_id: id}, 
            {image :  body.photos[0].image.web},
              function(err, numberAffected){
                  console.log("Updated for "+ body.photos[0].image.web)  
              });
        }
        });

}
const imageResource = [
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:aarhus/images",
      "name": "Aarhus"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:adelaide/",
      "name": "Adelaide"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:albuquerque/",
      "name": "Albuquerque"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:almaty/",
      "name": "Almaty"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:amsterdam/",
      "name": "Amsterdam"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:anchorage/",
      "name": "Anchorage"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:andorra/",
      "name": "Andorra"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:ankara/",
      "name": "Ankara"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:asheville/",
      "name": "Asheville"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:asuncion/",
      "name": "Asuncion"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:athens/",
      "name": "Athens"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:atlanta/",
      "name": "Atlanta"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:auckland/",
      "name": "Auckland"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:austin/",
      "name": "Austin"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:baku/",
      "name": "Baku"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bali/",
      "name": "Bali"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:baltimore/",
      "name": "Baltimore"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bangkok/",
      "name": "Bangkok"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:barcelona/",
      "name": "Barcelona"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:beijing/",
      "name": "Beijing"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:beirut/",
      "name": "Beirut"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:belfast/",
      "name": "Belfast"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:belgrade/",
      "name": "Belgrade"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:belize-city/",
      "name": "Belize City"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bengaluru/",
      "name": "Bengaluru"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bergen/",
      "name": "Bergen"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:berlin/",
      "name": "Berlin"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bern/",
      "name": "Bern"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bilbao/",
      "name": "Bilbao"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:birmingham/",
      "name": "Birmingham"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:birmingham-al/",
      "name": "Birmingham, AL"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bogota/",
      "name": "Bogota"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:boise/",
      "name": "Boise"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bologna/",
      "name": "Bologna"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bordeaux/",
      "name": "Bordeaux"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:boston/",
      "name": "Boston"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:boulder/",
      "name": "Boulder"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bozeman/",
      "name": "Bozeman"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bratislava/",
      "name": "Bratislava"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:brighton/",
      "name": "Brighton"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:brisbane/",
      "name": "Brisbane"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bristol/",
      "name": "Bristol"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:brno/",
      "name": "Brno"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:brussels/",
      "name": "Brussels"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:bucharest/",
      "name": "Bucharest"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:budapest/",
      "name": "Budapest"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:buenos-aires/",
      "name": "Buenos Aires"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:buffalo/",
      "name": "Buffalo"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:cairo/",
      "name": "Cairo"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:calgary/",
      "name": "Calgary"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:cambridge/",
      "name": "Cambridge"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:cape-town/",
      "name": "Cape Town"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:caracas/",
      "name": "Caracas"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:cardiff/",
      "name": "Cardiff"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:casablanca/",
      "name": "Casablanca"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:charleston/",
      "name": "Charleston"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:charlotte/",
      "name": "Charlotte"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:chattanooga/",
      "name": "Chattanooga"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:chennai/",
      "name": "Chennai"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:chiang-mai/",
      "name": "Chiang Mai"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:chicago/",
      "name": "Chicago"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:chisinau/",
      "name": "Chisinau"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:christchurch/",
      "name": "Christchurch"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:cincinnati/",
      "name": "Cincinnati"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:cleveland/",
      "name": "Cleveland"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:cluj-napoca/",
      "name": "Cluj-Napoca"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:cologne/",
      "name": "Cologne"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:colorado-springs/",
      "name": "Colorado Springs"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:columbus/",
      "name": "Columbus"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:copenhagen/",
      "name": "Copenhagen"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:cork/",
      "name": "Cork"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:curitiba/",
      "name": "Curitiba"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:dallas/",
      "name": "Dallas"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:dar-es-salaam/",
      "name": "Dar es Salaam"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:delhi/",
      "name": "Delhi"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:denver/",
      "name": "Denver"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:des-moines/",
      "name": "Des Moines"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:detroit/",
      "name": "Detroit"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:doha/",
      "name": "Doha"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:dresden/",
      "name": "Dresden"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:dubai/",
      "name": "Dubai"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:dublin/",
      "name": "Dublin"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:dusseldorf/",
      "name": "Dusseldorf"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:edinburgh/",
      "name": "Edinburgh"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:edmonton/",
      "name": "Edmonton"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:eindhoven/",
      "name": "Eindhoven"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:eugene/",
      "name": "Eugene"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:florence/",
      "name": "Florence"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:florianopolis/",
      "name": "Florianopolis"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:fort-collins/",
      "name": "Fort Collins"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:frankfurt/",
      "name": "Frankfurt"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:fukuoka/",
      "name": "Fukuoka"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:gaillimh/",
      "name": "Galway"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:gdansk/",
      "name": "Gdansk"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:geneva/",
      "name": "Geneva"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:gibraltar/",
      "name": "Gibraltar"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:glasgow/",
      "name": "Glasgow"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:gothenburg/",
      "name": "Gothenburg"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:grenoble/",
      "name": "Grenoble"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:guadalajara/",
      "name": "Guadalajara"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:guatemala-city/",
      "name": "Guatemala City"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:halifax/",
      "name": "Halifax"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:hamburg/",
      "name": "Hamburg"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:hannover/",
      "name": "Hannover"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:havana/",
      "name": "Havana"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:helsinki/",
      "name": "Helsinki"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:ho-chi-minh-city/",
      "name": "Ho Chi Minh City"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:hong-kong/",
      "name": "Hong Kong"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:honolulu/",
      "name": "Honolulu"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:houston/",
      "name": "Houston"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:hyderabad/",
      "name": "Hyderabad"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:indianapolis/",
      "name": "Indianapolis"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:innsbruck/",
      "name": "Innsbruck"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:istanbul/",
      "name": "Istanbul"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:jacksonville/",
      "name": "Jacksonville"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:jakarta/",
      "name": "Jakarta"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:johannesburg/",
      "name": "Johannesburg"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:kansas-city/",
      "name": "Kansas City"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:karlsruhe/",
      "name": "Karlsruhe"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:kathmandu/",
      "name": "Kathmandu"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:kiev/",
      "name": "Kiev"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:kingston/",
      "name": "Kingston"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:knoxville/",
      "name": "Knoxville"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:krakow/",
      "name": "Krakow"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:kuala-lumpur/",
      "name": "Kuala Lumpur"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:kyoto/",
      "name": "Kyoto"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:lagos/",
      "name": "Lagos"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:la-paz/",
      "name": "La Paz"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:las-palmas-de-gran-canaria/",
      "name": "Las Palmas de Gran Canaria"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:las-vegas/",
      "name": "Las Vegas"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:lausanne/",
      "name": "Lausanne"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:leeds/",
      "name": "Leeds"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:leipzig/",
      "name": "Leipzig"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:lille/",
      "name": "Lille"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:lima/",
      "name": "Lima"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:lisbon/",
      "name": "Lisbon"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:liverpool/",
      "name": "Liverpool"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:ljubljana/",
      "name": "Ljubljana"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:london/",
      "name": "London"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:los-angeles/",
      "name": "Los Angeles"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:louisville/",
      "name": "Louisville"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:luxembourg/",
      "name": "Luxembourg"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:lviv/",
      "name": "Lviv"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:lyon/",
      "name": "Lyon"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:madison/",
      "name": "Madison"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:madrid/",
      "name": "Madrid"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:malaga/",
      "name": "Malaga"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:malmo/",
      "name": "Malmo"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:managua/",
      "name": "Managua"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:manchester/",
      "name": "Manchester"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:manila/",
      "name": "Manila"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:marseille/",
      "name": "Marseille"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:medellin/",
      "name": "Medellin"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:melbourne/",
      "name": "Melbourne"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:memphis/",
      "name": "Memphis"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:mexico-city/",
      "name": "Mexico City"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:miami/",
      "name": "Miami"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:milan/",
      "name": "Milan"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:milwaukee/",
      "name": "Milwaukee"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:minneapolis-saint-paul/",
      "name": "Minneapolis-Saint Paul"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:minsk/",
      "name": "Minsk"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:montevideo/",
      "name": "Montevideo"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:montreal/",
      "name": "Montreal"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:moscow/",
      "name": "Moscow"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:mumbai/",
      "name": "Mumbai"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:munich/",
      "name": "Munich"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:nairobi/",
      "name": "Nairobi"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:nantes/",
      "name": "Nantes"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:naples/",
      "name": "Naples"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:nashville/",
      "name": "Nashville"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:new-orleans/",
      "name": "New Orleans"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:new-york/",
      "name": "New York"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:nice/",
      "name": "Nice"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:nicosia/",
      "name": "Nicosia"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:oklahoma-city/",
      "name": "Oklahoma City"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:omaha/",
      "name": "Omaha"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:orlando/",
      "name": "Orlando"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:osaka/",
      "name": "Osaka"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:oslo/",
      "name": "Oslo"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:ottawa/",
      "name": "Ottawa"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:oulu/",
      "name": "Oulu"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:oxford/",
      "name": "Oxford"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:palo-alto/",
      "name": "Palo Alto"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:panama/",
      "name": "Panama"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:paris/",
      "name": "Paris"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:perth/",
      "name": "Perth"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:philadelphia/",
      "name": "Philadelphia"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:phnom-penh/",
      "name": "Phnom Penh"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:phoenix/",
      "name": "Phoenix"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:phuket/",
      "name": "Phuket"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:pittsburgh/",
      "name": "Pittsburgh"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:portland-me/",
      "name": "Portland, ME"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:portland-or/",
      "name": "Portland, OR"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:porto/",
      "name": "Porto"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:porto-alegre/",
      "name": "Porto Alegre"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:prague/",
      "name": "Prague"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:providence/",
      "name": "Providence"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:quebec/",
      "name": "Quebec"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:quito/",
      "name": "Quito"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:raleigh/",
      "name": "Raleigh"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:reykjavik/",
      "name": "Reykjavik"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:richmond/",
      "name": "Richmond"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:riga/",
      "name": "Riga"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:rio-de-janeiro/",
      "name": "Rio De Janeiro"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:riyadh/",
      "name": "Riyadh"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:rochester/",
      "name": "Rochester"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:rome/",
      "name": "Rome"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:rotterdam/",
      "name": "Rotterdam"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:saint-petersburg/",
      "name": "Saint Petersburg"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:salt-lake-city/",
      "name": "Salt Lake City"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:san-antonio/",
      "name": "San Antonio"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:san-diego/",
      "name": "San Diego"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:san-francisco-bay-area/",
      "name": "San Francisco Bay Area"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:san-jose/",
      "name": "San Jose"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:san-juan/",
      "name": "San Juan"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:san-luis-obispo/",
      "name": "San Luis Obispo"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:san-salvador/",
      "name": "San Salvador"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:santiago/",
      "name": "Santiago"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:santo-domingo/",
      "name": "Santo Domingo"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:sao-paulo/",
      "name": "Sao Paulo"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:sarajevo/",
      "name": "Sarajevo"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:saskatoon/",
      "name": "Saskatoon"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:seattle/",
      "name": "Seattle"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:seoul/",
      "name": "Seoul"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:seville/",
      "name": "Seville"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:shanghai/",
      "name": "Shanghai"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:singapore/",
      "name": "Singapore"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:skopje/",
      "name": "Skopje"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:sofia/",
      "name": "Sofia"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:st-louis/",
      "name": "St. Louis"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:stockholm/",
      "name": "Stockholm"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:stuttgart/",
      "name": "Stuttgart"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:sydney/",
      "name": "Sydney"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:taipei/",
      "name": "Taipei"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:tallinn/",
      "name": "Tallinn"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:tampa-bay-area/",
      "name": "Tampa Bay Area"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:tampere/",
      "name": "Tampere"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:tartu/",
      "name": "Tartu"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:tashkent/",
      "name": "Tashkent"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:tbilisi/",
      "name": "Tbilisi"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:tehran/",
      "name": "Tehran"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:tel-aviv/",
      "name": "Tel Aviv"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:the-hague/",
      "name": "The Hague"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:thessaloniki/",
      "name": "Thessaloniki"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:tokyo/",
      "name": "Tokyo"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:toronto/",
      "name": "Toronto"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:toulouse/",
      "name": "Toulouse"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:tunis/",
      "name": "Tunis"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:turin/",
      "name": "Turin"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:turku/",
      "name": "Turku"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:uppsala/",
      "name": "Uppsala"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:utrecht/",
      "name": "Utrecht"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:valencia/",
      "name": "Valencia"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:valletta/",
      "name": "Valletta"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:vancouver/",
      "name": "Vancouver"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:victoria/",
      "name": "Victoria"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:vienna/",
      "name": "Vienna"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:vilnius/",
      "name": "Vilnius"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:warsaw/",
      "name": "Warsaw"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:washington-dc/",
      "name": "Washington, D.C."
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:wellington/",
      "name": "Wellington"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:winnipeg/",
      "name": "Winnipeg"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:wroclaw/",
      "name": "Wroclaw"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:yerevan/",
      "name": "Yerevan"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:zagreb/",
      "name": "Zagreb"
    },
    {
      "href": "https://api.teleport.org/api/urban_areas/slug:zurich/",
      "name": "Zurich"
    }
  ]


module.exports = router;