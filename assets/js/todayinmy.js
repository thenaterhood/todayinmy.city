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

    document.getElementById(id).textContent = temperature.toPrecision(4);
    document.getElementById(id + "_unit").textContent = temp_unit;

}
/**
 * Kicks off the script to populate the page
 */
function getData()
{
    let location = new GeoLocation();
    location.fromBrowser(populatePage, true);
}

/**
 * Kicks off the script to populate the page, forcing geoip location
 */
function getDataGeoip()
{
    let location = new GeoLocation();
    location.fromGeoIP(populatePage);
}

function doZipcodeInput()
{
    $("#locateme").addClass('hidden');
    $("#zipcode_input_span").removeClass('hidden');
    $("#navbuttons").addClass('hidden');
    $("#weatherinfo").addClass('hidden');
}

function hideZipcodeInput()
{
  $("#zipcode_input_span").addClass('hidden');
  $("#navbuttons").removeClass('hidden');
  $("#weatherinfo").removeClass('hidden');
}

/**
 * Populates the page
 * @param {Object} geolocation
 *      An object containing at least longitude and latitude
 */
function populatePage(locationobj)
{
    locationobj.reverseLookupCity(
        locationobj.lastCoords.coords.latitude,
        locationobj.lastCoords.coords.longitude,
        function(address) {
            let geolocation = locationobj.lastCoords;
            $("#cityname").text(address.normalized_town);
            $("#locateme").addClass("hidden");
            populateWeather(geolocation);
            //populateMeetups(geolocation, address);
            populateWikipediaExerpt(address);
            populateNearby(address);
            $('#address').text(locationobj.getHumanAddress());
            $("#navbuttons").removeClass("hidden");
        }.bind(locationobj));
}

/**
 * Retrieves and sets the location weather on the page from
 * a city.
 * @param {Object} geoip_data
 *      An object with at least the properties "city" and "state"
 */
function populateWeather(address)
{
    let weatherInfo = $('#weatherinfo');

    $.getJSON(
        "//forecast.weather.gov/MapClick.php?FcstType=json&lat=" +
        encodeURIComponent(address.coords.latitude) +
        "&lon=" +
        encodeURIComponent(address.coords.longitude) +
        "&callback=?",
        function(weather) {
            if (weather.hasOwnProperty('currentobservation')) {
                var temperatureF = weather.currentobservation.Temp;
                $("#weatherdescription").text(
                    weather.currentobservation.Weather.toLowerCase()
                );
                $("#expectedweatherdesc").text(
                    weather.data.text[0].toLowerCase()
                );

                $("#temperature").text(temperatureF);
            } else {
                console.log("No weather information was retrieved");
                weatherInfo.text("We weren't able to load the weather :(");
            }
            weatherInfo.removeClass("hidden");
        });
}

function populateNearby(address)
{
    let boundingBox_TopLat = +address.lat - 0.02;
    let boundingBox_TopLon = +address.lon - 0.02;
    let boundingBox_BottomLat = +address.lat + 0.02;
    let boundingBox_BottomLon = +address.lon + 0.02;

    $.getJSON(
            '//www.overpass-api.de/api/interpreter?data=[out:json][timeout:25];(node["amenity"~""](' +
            boundingBox_TopLat +
            ',' + boundingBox_TopLon +
            ',' + boundingBox_BottomLat +
            ',' + boundingBox_BottomLon +
            '););out center 50;>;out skel qt;',
            function(nearby) {
                if (nearby.elements.length > 0) {
                    let html = "<ul>";
                    for (var i = 0; i < nearby.elements.length && i < 11; i++) {
                        html += "<li><img class='amenity_icon' src='//raw.githubusercontent.com/gravitystorm/openstreetmap-carto/master/symbols/amenity/" + nearby.elements[i].tags.amenity + ".svg?sanitize=true' onerror='this.parentNode.removeChild(this)' />" + (nearby.elements[i].tags.website ? "<a target='_blank' href='" + nearby.elements[i].tags.website + "'>" : "") + (nearby.elements[i].tags.name ? nearby.elements[i].tags.name : nearby.elements[i].tags.amenity) + (nearby.elements[i].tags.website ? "</a>" : "" ) + "</li>";
                    }
                    html += "</ul>";
                    $("#things_near_you").html(html);
                } else {
                    $("#things_near_you").html("<p>We couldn't find any amenities nearby :(</p>");
                }
            }
    );
}

/**
 * Calls up to meetup and requests meetups in the area, then populates
 * the page.
 * @param {Object} geoip_data
 *      Geographic location looking like {coords:{latitude = xxx, longitude = yyy}}
 */
function populateMeetups(geoip_data, address)
{
    var town = address.normalized_town;

    $.getJSON(
        "//todayinmycity-thenaterhood.rhcloud.com/endpoint/meetup?longitude=" +
        geoip_data.coords.longitude + "&latitude=" +
        geoip_data.coords.latitude + "&city=" + encodeURIComponent(town) +
        "&state=" + encodeURIComponent(address.state),
        function(meetups) {
            if (meetups.hasOwnProperty('results')) {
                var top4 = meetups.results.slice(0,8);
                document.getElementById("meetup_events").innerHTML = '';
                for (i = 0; i < top4.length; i++) {
                    var etime = new Date(top4[i].time);
                    var etime_friendly = formatTime(etime);
                    top4[i].time = etime_friendly;
                    top4[i].group_name = top4[i].group.name;
                    top4[i].group_url = "https://www.meetup.com/" + top4[i].group.urlname;
                    document.getElementById("meetup_events").innerHTML +=
                        Mustache.render('<p class="meetup_event"><a href="{{event_url}}">{{name}}</a> - at {{time}} with <a href="{{group_url}}">{{group_name}}</a></p>', top4[i]);
                }
            } else {
                document.getElementById('meetup_events').textContent = "Meetup didn't have any events for us.";
            }
        });
}

function populateWikipediaExerpt(address)
{
    let wikiTitle = address.normalized_town + ", " + address.county + ", " + address.state;
    let wikipedia = new Wikipedia();
    wikipedia.getArticleExcerpt(wikiTitle,
        function(data){
            let max_extract = 300;
            if (data.extract.length > max_extract) {
                data.extract = data.extract.substring(0, max_extract) + "\u2026";
            }
            setCityInfo(data.extract, data.url);

        }, function(data){
            console.log("Couldn't find what we wanted on Wikipedia - using a less specific search");
            wikipedia.getArticleExcerpt(
              address.normalized_town + ", " + address.state,
              function(data){
                  let max_extract = 300;
                  if (data.extract.length > max_extract) {
                      data.extract = data.extract.substring(0, max_extract) + "\u2026";
                  }
                  setCityInfo(data.extract, data.url);
              },
              function(data){
                console.log("Could not find " + address.normalized_town + " on wikipedia :(");
                setCityInfo(
                  "We couldn't find " + address.normalized_town + " on Wikipedia :(",
                  null
                )
              }
            )
        }.bind(address));
}

function setCityInfo(extract, url)
{
    $('#cityinfo').text(extract);
    if (url === null) {
      $('#cityinfo_more').html('');
    } else {
      $('#cityinfo_more').html('<a href="' + url + '">More on Wikipedia</a>')
    }
    $(document).trigger('city-info-loaded');
}
