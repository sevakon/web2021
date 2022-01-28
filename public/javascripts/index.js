const domain = "http://localhost:3000"

window.addEventListener("load", function () {
    refreshLocation();
    getFavoriteCities();
}, false);

function refreshLocation() {
    showHeaderLoadingView()

    let geolocation = navigator.geolocation;
    geolocation.getCurrentPosition(getCurrentLocation, locationError)
}

function getCurrentLocation(position) {
    console.log()
    getCityWeather(formatRequestWithGeoCoords(position.coords.latitude, position.coords.longitude),null, {}, function(data) {
        console.log(data)
        showLocationWeatherBlock()
        fillLocationWeatherBlock(data)
    })
}

function locationError(err) {
    getCityWeather(formatRequestWithQuery("London"), "London", {}, function(data) {
        console.log(data)
        showLocationWeatherBlock()
        fillLocationWeatherBlock(data)
    })
}

function addLocationToFavorites() {
    const inputField = document.getElementById("favorite-location-form")
    const query = inputField.value.trim()

    console.log(query)

    if (query.length === 0) {
        alert("City query could not be empty!");
        return;
    }

    addNewCity(query)
    inputField.value = ''
    // event
}



// API
function formatRequestWithGeoCoords(lat, lon) {
    return domain + `/weather/coordinates?lat=${lat}&lon=${lon}`;
}

function formatRequestWithQuery(query) {
    return domain + `/weather/city?q=${query}`;
}

function favoriteCitiesUrl() {
    return domain + '/favorites';
}

function getCityWeather(url, cityName, params, callback) {
    fetch(url, params)
        .then(handleErrors)
        .then((response) => {
            return response.json()
        })
        .then((data) => {
            let weather = parseWeather(data)
            callback(weather)
        })
        .catch(function(error) {
            if (error === 'Bad Request') {
                alert(`City was already added to the list`)
            } else if (error === 'Not Found') {
                alert('City was not found')
            } else {
                alert(error)
            }
            removeCityPlaceholder(cityName)
        })
}

function handleErrors(response) {
    if (!response.ok) {
        throw response.statusText
    }
    return response
}

function getFavoriteCities() {
    fetch(favoriteCitiesUrl())
        .then(handleErrors)
        .then((response) => {
            return response.json()
        })
        .then((cities) => {
            for (let i = 0; i < cities.length; i++) {
                addExistingCity(cities[i])
            }
        })
        .catch(function(error) {
            alert(error)
        })

}

function addExistingCity(cityName) {
    showFavoriteCityLoadingPlaceholder(cityName)

    getCityWeather(formatRequestWithQuery(cityName), cityName, {}, function(data) {
            createFavoriteCity(cityName, data)
        }
    )

}

function addNewCity(cityName) {
    showFavoriteCityLoadingPlaceholder(cityName)
    let params = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'name': cityName })
    }

    getCityWeather(favoriteCitiesUrl(), cityName, params, function(data) {
            createFavoriteCity(cityName, data)
        }
    )
}

function removeCityFromFavoriteById(cityId) {
    let params = {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'id': cityId })
    }

    fetch(favoriteCitiesUrl(), params)
        .then(handleErrors)
        .then((response) => {
            return response.json()
        })
        .then((data) => {
            console.log(data)
        })
        .catch(function(error) {
            alert(error)
        })
}

// Parsing
function parseWeather(data) {
    let cloudiness = capitalizeFirstLetter(data['weather'][0]['description'])
    let iconType = data['weather'][0]['icon']
    return {
        'id': data['id'],
        'city_name': data['name'],
        'icon_url': `https://openweathermap.org/img/wn/${iconType}@4x.png`,
        'temperature': (Math.round(data['main']['temp'])).toString(),
        'wind_direction': extractWindDirectionFromDegs(data['wind']['deg']),
        'wind_speed': data['wind']['speed'],
        'cloudiness': cloudiness,
        'pressure': data['main']['pressure'],
        'humidity': data['main']['humidity'],
        'lat': parseFloat(data['coord']['lat']).toFixed(2),
        'lon': parseFloat(data['coord']['lon']).toFixed(2),
    }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function extractWindDirectionFromDegs(deg) {
    if (deg > 337.5) return 'Northerly'
    if (deg > 292.5) return 'North Westerly'
    if (deg > 247.5) return 'Westerly'
    if (deg > 202.5) return 'South Westerly'
    if (deg > 157.5) return 'Southerly'
    if (deg > 122.5) return 'South Easterly'
    if (deg > 67.5) return 'Easterly'
    if (deg > 22.5) return 'North Easterly'
    return 'Northerly'
}

// JS Views Functions
function createHeaderLoadingElement() {
    const template = document.getElementById("loading-header-template");
    const docFragment = document.importNode(template.content, true);
    const div = docFragment.querySelector("div");
    div.id = "loading-view";
    return div;
}

function showHeaderLoadingView() {
    const btn = document.getElementsByClassName("refresh-btn")[0];
    btn.disabled = true;
    hideLocationWeatherBlock();
    const container = document.getElementById("main-root");
    container.insertBefore(createHeaderLoadingElement(), container.firstChild);
}

function hideHeaderLoadingView() {
    const btn = document.getElementsByClassName("refresh-btn")[0];
    btn.disabled = false;
    const loadingView = document.getElementById("loading-view");
    loadingView.remove();
}

function showLocationWeatherBlock() {
    hideHeaderLoadingView();

    const headerBlockTemplate = document.getElementById("header-city-template");
    const headerBlockFragment = document.importNode(headerBlockTemplate.content, true);
    const headerBlock = headerBlockFragment.querySelector("div");

    const headerListTemplate = document.getElementById("header-info-template");
    const headerListFragment = document.importNode(headerListTemplate.content, true);
    const headerList = headerListFragment.querySelector("div");
    headerList.id = "info-by-location";

    const container = document.getElementById("main-root");
    container.insertBefore(headerList, container.firstChild);
    container.insertBefore(headerBlock, headerList);

}

function fillLocationWeatherBlock(weather) {
    const cityName = document.getElementById("location-city-name")
    const cityIcon = document.getElementById("location-city-icon")
    const cityTemp = document.getElementById("location-temperature")

    const infoAtLoc = document.getElementById("info-by-location")

    cityName.innerHTML = weather['city_name']
    cityIcon.src = weather['icon_url']
    cityTemp.innerHTML = `${weather['temperature']}°C`

    const infoList = infoAtLoc.children[0].children

    fillInfoList(weather, infoList)
}

function fillInfoList(weather, infoList) {
    for (let i = 0; i < infoList.length; ++i) {
        const listItem = infoList[i];
        const geoField = listItem.children[0];

        if (i === 0) {
            geoField.innerHTML = `${weather['wind_speed']}m/s, ${weather['wind_direction']}`
        } else if (i === 1) {
            geoField.innerHTML = weather['cloudiness']
        } else if (i === 2) {
            geoField.innerHTML = `${weather['pressure']} hpa`
        } else if (i === 3) {
            geoField.innerHTML = `${weather['humidity']}%`
        } else if (i === 4) {
            geoField.innerHTML = `[${weather['lat']}, ${weather['lon']}]`
        }
    }

}

function hideLocationWeatherBlock() {
    const container = document.getElementById("main-root");
    if (container.children[1].id === "info-by-location") {
        container.firstChild.remove();
        container.firstChild.remove();
    }
}

const placeHolderMap = {}

function showFavoriteCityLoadingPlaceholder(city_name) {
    const favoriteList = document.getElementById("favorite-list");
    let lastListItem = favoriteList.lastChild;
    if (lastListItem == null || lastListItem.childNodes.length === 2) {
        lastListItem = document.createElement("li");
        lastListItem.classList.add("container");
        favoriteList.appendChild(lastListItem);
    }

    const placeholderTemplate = document.getElementById("loading-city-template");
    const placeholderFragment = document.importNode(placeholderTemplate.content, true);
    const placeholderDiv = placeholderFragment.querySelector("div");

    const loadingCity = placeholderDiv.getElementsByTagName("h4")[0];
    loadingCity.innerHTML = city_name;

    lastListItem.appendChild(placeholderDiv);
    placeHolderMap[city_name] = placeholderDiv;
}

function removeCityPlaceholder(cityName) {
    placeHolderMap[cityName].remove();
    placeHolderMap[cityName] = null;
}

function createFavoriteCity(origCityName, weather) {
    const favoriteCityTemplate = document.getElementById("favorite-city-template");
    const favoriteCityFragment = document.importNode(favoriteCityTemplate.content, true);
    const favoriteCityBlock = favoriteCityFragment.querySelector("div");

    console.log(placeHolderMap)

    if (origCityName !== weather['city_name']) {
        placeHolderMap[weather['city_name']] = placeHolderMap[origCityName]
    }

    const block = placeHolderMap[weather['city_name']];
    block.replaceWith(favoriteCityBlock)

    const cityHeader = favoriteCityBlock.children[0];
    const cityName = cityHeader.getElementsByTagName("h4")[0];
    cityName.innerHTML = weather['city_name'];
    const cityTemperature = cityHeader.getElementsByTagName("span")[0];
    cityTemperature.innerHTML = `${weather['temperature']}°C`;
    const cityIcon = cityHeader.getElementsByTagName("img")[0];
    cityIcon.src = weather['icon_url'];

    const btn = cityHeader.getElementsByTagName("button")[0];
    btn.addEventListener("click", function () {
        // console.log("clicked remove")
        removeCityFromFavoriteById(weather['id'])

        const liParent = btn.parentElement.parentElement.parentElement;
        btn.parentElement.parentElement.remove();
        if (liParent.children.length !== 0) {
            balanceFavoriteList(liParent);
        }
    })

    const cityList = favoriteCityBlock.children[1].children;

    fillInfoList(weather, cityList)
}

function balanceFavoriteList(container) {
    const favList = document.getElementById("favorite-list");
    if (favList.children.length === 0) {
        return;
    }

    if (favList.children[favList.children.length - 1].children.length === 1) {
        const oneElement = favList.children[favList.children.length - 1].children[0];
        oneElement.remove();
        container.append(oneElement);
        return;
    }

    container.remove();
    favList.append(container);
}