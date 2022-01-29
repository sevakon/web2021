const https = require('https')
const database = require('./database')
require("dotenv").config();
const apiKey = process.env.API_KEY

function makeRequest(url, callback, errorCallback) {
    https.get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            if (resp.statusCode >= 400 && resp.statusCode < 500) {
                errorCallback(resp.statusMessage)
            } else {
                callback(data)
            }
        });
    }).on("error", (err) => {
        errorCallback(err)
    })
}

function performQuery(sql, callback, errorCallback) {
    database.query(sql, (err, data) => {
        if (err) {
            errorCallback(err)
        } else {
            console.log('Data: ' + data)
            callback(data)
        }
    })
}

function formatRequestWithCoordinates(lat, lon) {
    return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=en&units=metric`;
}

function formatRequestWithQuery(query) {
    return `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&lang=en&units=metric`
}


class CityController {

    async getCities(req, res) {
        console.log('getCities)_')
        performQuery('SELECT name FROM city',
            function (response) {
                let cities = []
                for (let i = 0; i < response.rows.length; i++) {
                    cities.push(response.rows[i]['name'])
                }
                console.log(cities)
                res.status(200).send(cities)
            }, function (error) {
                res.status(404).send(error)
            })
    }

    async appendCity(req, res) {
        const cityName = req.body.name
        console.log('appendCity() ' + cityName)
        makeRequest(formatRequestWithQuery(cityName),
            function (data) {
                let id = JSON.parse(data).id
                let city = JSON.parse(data).name

                // console.log(id)
                // console.log(city)

                performQuery('SELECT id FROM city',
                    function (ids) {
                        // console.log(ids.rows.values())
                        let values = ids.rows.values()
                        let ids_list = []
                        for (let id_item of values) {
                            ids_list.push(id_item.id)
                        }
                        // console.log(ids_list)
                        if (ids_list.includes(id)) {
                            res.status(400).json({msg: `City ${cityName} was already added`})
                        } else {
                            database.query(`INSERT INTO city (id, name) VALUES (${id}, '${city}')`)
                            res.status(200).json(JSON.parse(data))
                        }
                    }, function (error) {
                        res.status(404).json(error)
                    }
                )

            }, function (error) {
                res.status(404).send(error)
            })
    }

    async getCityWeatherByName(req, res) {
        console.log("get city")
        const cityName = req.query.q
        makeRequest(formatRequestWithQuery(cityName),
            function (data) {
                res.status(200).send(data)
            }, function (error) {
                res.status(404).send(error)
            })
    }

    async getCityWeatherByCoordinates(req, res) {
        console.log("get coord")
        const lat = req.query.lat
        const lon = req.query.lon
        makeRequest(formatRequestWithCoordinates(lat, lon),
            function (data) {
                res.status(200).send(data)
            }, function (error) {
                res.status(404).send(error)
            })
    }

    async deleteCity(req, res) {
        const cityId = req.body.id
        console.log('deleteCity() ' + cityId)
        performQuery(`DELETE FROM city WHERE id = '${cityId}'`,
            function (data) {
                res.status(200).send(data)
            }, function (error) {
                res.status(404).send(error)
            })
    }
}

module.exports = new CityController()
