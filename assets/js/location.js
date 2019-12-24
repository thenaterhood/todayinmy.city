function GeoLocation()
{
  this.nominatim = '//nominatim.openstreetmap.org';
  this.lastAddress = {};
  this.lastCoords = {};

  this.fromBrowser = function(callback, fallback)
  {
    this._reset();
    let self = this;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(location) {
          this.lastCoords = location;
          callback(self);
        }.bind(self)
      );
    } else {
      console.log("Browser does not support geolocation");
      if (fallback) {
        this.fromGeoIP(callback);
      }
    }
  }

  this.fromGeoIP = function(callback)
  {
    let self = this;
    console.log("GeoIP location request...");
    this._reset();
    $.getJSON("https://freegeoip.net/json/?callback=?")
    .done(function(json) {
      console.log("Got GeoIP location...");
      let transformed = {
        "coords": {
          "latitude" : json.latitude,
          "longitude": json.longitude
        }
      };
      this.lastCoords = transformed;
      callback(self);
    }.bind(self))
    .fail(function(data) {
      console.log("Getting GeoIP location failed");
    });
  }

  this.fromZipcode = function(zipcode, callback)
  {
    this._reset();
    let self = this;
    console.log("Zipcode location request...");
    $.getJSON(this.nominatim + "/search?format=json&postalcode=" + encodeURIComponent(zipcode) + "&country=US&addressdetails=1")
    .done(function(json) {
      let transformed = {
        "coords": {
          "latitude": json[0].lat,
          "longitude": json[0].lon
        }
      };
      this.lastCoords = transformed;
      this.lastAddress = this._normalizeAddress(json[0]);
      callback(self);
    }.bind(self))
    .fail(function(data) {
      console.log("Unable to get location from zipcode");
    });
  }

  /**
  * Performs a reverse lookup of a city, calling the callback with the address
  * from the latitude and longitude.
  * @param {int} latitude
  * @param {int} longitude
  * @param {Function} callback
  */
  this.reverseLookupCity = function(latitude, longitude, callback)
  {
    let self = this;
    if (this.lastAddress.hasOwnProperty('normalized_town')) {
      console.log("Skipping reverse city lookup - already have an address");
      callback(this.lastAddress);
    } else {
      console.log("Doing reverse city lookup");
      $.getJSON(
        this.nominatim + "/reverse?format=json&lat="
        + latitude + "&lon=" + longitude + "&zoom=18",
        function(json) {
          let address = self._normalizeAddress(json);
          self.lastAddress = address;
          callback(address)
        }.bind(self));
      }
    }

    this.getHumanAddress = function()
    {
      let streetAddr = "";
      if (this.lastAddress.hasOwnProperty('house_number')) {
        streetAddr += this.lastAddress.house_number + " ";
      }

      if (this.lastAddress.hasOwnProperty('road')) {
        streetAddr += this.lastAddress.road + ", ";
      }

      streetAddr += this.lastAddress.normalized_town + ", " + this.lastAddress.state + " " + this.lastAddress.postcode;
      return streetAddr;
    }

    this._reset = function()
    {
      this.lastCoords = {};
      this.lastAddress = {};
    }

    this._normalizeAddress = function(locationResponse)
    {
      var address = locationResponse.address;
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
      } else if (address.hasOwnProperty('locality')) {
        let town = address.locality;
      } else {
        // Well, sucks that we got here. Gotta parse the
        // town out of the display name
        var displayName = locationResponse.display_name;
        let displayNameIndex = displayName.indexOf(",");
        if (displayNameIndex != -1) {
          town = displayName.substring(0, displayNameIndex);
        }
      }

      let index = town.indexOf(" Town");
      if (index != -1) {
        town = town.substring(0, index);
      }
      address.normalized_town = town;
      address.lat = locationResponse.lat;
      address.lon = locationResponse.lon;

      return address;
    }
  }
