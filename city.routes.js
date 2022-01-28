const Router = require('express')
const router = new Router()

const cityController = require('./city.controller')

router.post('/favorites', cityController.appendCity)
router.get('/favorites', cityController.getCities)
router.delete('/favorites', cityController.deleteCity)
router.get('/weather/city', cityController.getCityWeatherByName)
router.get('/weather/coordinates', cityController.getCityWeatherByCoordinates)

module.exports = router