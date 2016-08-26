/**
 * Pads a number with preceeding 0's
 * or optionally other characters
 * @param {int} n
 *      A number
 * @param {int} width
 *      The desired width of the integer
 * @param {string} z
 *      The string to pad with (defaults to 0)
 *
 * @return {string}
 *      The padded string
 */
function pad(n, width, z)
{
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

/**
 * Formats a time into a MM:SS [AM|PM] string
 * @param {Date} t
 *      A Date instance to format a time from
 * @param {bool} use_24h
 *      Format time into a 24h time string. Default false.
 * @return {string}
 *      A formatted time string
 */
function formatTime(t, use_24h)
{
    var hours = t.getHours();
    var minutes = t.getMinutes();
    var ampm = '';

    if (!use_24h && hours > 12) {
        hours = hours - 12;
        ampm = 'PM';
    } else if (!use_24h && hours === 12) {
        ampm = 'PM';
    } else if (!use_24h && hours < 12) {
        ampm = 'AM';
    }

    return hours + ":" + pad(minutes, 2) + " " + ampm;
}

/**
 * Returns a boolean value if a date is nighttime
 * @param {Date} t
 *      A date instance
 * @return {bool}
 *      True if night (between 6PM and 6AM)
 */
function isNight(t)
{
    return (t.getHours() >= 18 || t.getHours() < 6);
}

/**
 * Returns a boolean value of whether a date is daytime
 * @param {Date} t
 *      A date instance
 * @return {bool}
 *      True if day (between 6AM and 6PM)
 */
function isDay(t)
{
    return (t.getHours() >= 6 || t.getHours < 18);
}


/**
 * Toggles the units of a temperature given an id (it is expected that
 * the temperature be in an element with the id, and the units follow it
 * in another element with an id of the same <id>_unit.
 * @param {string} id
 *  The id of the temperature
 */
function toggleTemperatureUnit(id)
{
    var temperature = document.getElementById(id).innerHTML;

    if (isNaN(temperature)) {
        console.log("Can't convert " + temperature + " temperature units");
        return;
    }

    var temp_unit = document.getElementById(id + "_unit").innerHTML;

    switch (temp_unit) {
        case "C":

            temperature = 9/5 * (temperature) + 32;
            temp_unit = "F";
            break;
        case "F":
            temperature = 5/9 * (temperature - 32);
            temp_unit = "C";
            break;
        default:
            break;
    }

    document.getElementById(id).innerHTML = temperature.toPrecision(4);
    document.getElementById(id + "_unit").innerHTML = temp_unit;

}
/**
 * Kicks off the script to populate the page
 */
function getData()
{
    getLocation(populatePage);
}

/**
 * Kicks off the script to populate the page, forcing geoip location
 */
function getDataGeoip()
{
    getGeoipLocation(populatePage);
}

/**
 * Populates the page
 * @param {Object} geolocation
 *      An object containing at least longitude and latitude
 */
function populatePage(geolocation)
{
    console.log(geolocation);
    reverseLookupCity(
            geolocation.coords.latitude,
            geolocation.coords.longitude,
            function(address) {

                document.getElementById("cityname").innerHTML =
                    address.normalized_town;
                $("#locateme").addClass("hidden");
                getWeather(geolocation);
                getMeetups(geolocation, address);
            });
}

/**
 * Gets the location of the user based on their IP address
 * @param {Function} callback
 *      A callback function. Should accept an object
 */
function getGeoipLocation(callback)
{
    $.getJSON("//freegeoip.net/json/?callback=?",
            function(json) {
                callback(transformGeoipLocation(json));
            });
}

/**
 * Transform a geoip location from telize.com into an object
 * resembling that of the object retrieved from requesting
 * location from the browser
 * @param {Object} json
 *      The geoip object to transform. Needs to have properties
 *      'latitude' and 'longitude'
 * @return {Object}
 *      Object resembling a coordinate
 */
function transformGeoipLocation(json)
{
    return {
        "coords": {
            "latitude" : json.latitude,
            "longitude": json.longitude
        }
    };
}

/**
 * Retrieves the location of the user by requesting it, and falling
 * back on Geoip if the facilities aren't available.
 *
 * @param {Function} callback
 *      A callback function
 */
function getLocation(callback)
{
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(callback);
    } else {
        getGeoipLocation(callback);
        console.log("Browser does not support geolocation");
    }
}

/**
 * Performs a reverse lookup of a city, calling the callback with the address
 * from the latitude and longitude.
 * @param {int} latitude
 * @param {int} longitude
 * @param {Function} callback
 */
function reverseLookupCity(latitude, longitude, callback)
{
    $.getJSON(
            "//nominatim.openstreetmap.org/reverse?format=json&lat="
            + latitude + "&lon=" + longitude + "&zoom=18",
            function(json) {
                address = json.address
                    var town = null;
                if (address.hasOwnProperty('city')) {
                    town = address.city;
                } else if (address.hasOwnProperty("town")) {
                    town = address.town;
                } else if (address.hasOwnProperty('suburb')) {
                    town = address.suburb;
                } else if (address.hasOwnProperty('hamlet')) {
                    town = address.hamlet;
                } else if (address.hasOwnProperty('village')) {
                    town = address.village;
                }

                address.normalized_town = town;

                callback(address)
            });
}

/**
 * Retrieves and sets the location weather on the page from
 * a city.
 * @param {Object} geoip_data
 *      An object with at least the properties "city" and "state"
 */
function getWeather(address)
{
    console.log(address);

    $.getJSON(
            "//forecast.weather.gov/MapClick.php?FcstType=json&lat=" +
            encodeURIComponent(address.coords.latitude) +
            "&lon=" +
            encodeURIComponent(address.coords.longitude) +
            "&callback=?",
            function(weather) {
                console.log(weather)
                var temperatureF = weather.currentobservation.Temp;
                document.getElementById("weatherdescription").innerHTML =
                    weather.currentobservation.Weather.toLowerCase();

                document.getElementById("temperature").innerHTML = temperatureF;

                $("#weatherinfo").removeClass("hidden");
            });

}

/**
 * Calls up to meetup and requests meetups in the area, then populates
 * the page.
 * @param {Object} geoip_data
 *      Geographic location looking like {coords:{latitude = xxx, longitude = yyy}}
 */
function getMeetups(geoip_data, address)
{
    console.log(address);
    var town = address.normalized_town;

    $.getJSON(
            "//todayinmycity-thenaterhood.rhcloud.com/endpoint/meetup?longitude=" +
            geoip_data.coords.longitude + "&latitude=" +
            geoip_data.coords.latitude + "&city=" + encodeURIComponent(town) +
            "&state=" + encodeURIComponent(address.state),
            function(meetups) {
                var top4 = meetups.results.slice(0,8);
                document.getElementById("meetup_events").innerHTML = '';
                for (i = 0; i < top4.length; i++) {
                    var etime = new Date(top4[i].time);
                    var etime_friendly = formatTime(etime);
                    top4[i].time = etime_friendly;
                    document.getElementById("meetup_events").innerHTML +=
                        Mustache.render('<p class="meetup_event"><a href="{{event_url}}">{{name}}</a> - at {{time}}</p>', top4[i]);
                }
            });
}
