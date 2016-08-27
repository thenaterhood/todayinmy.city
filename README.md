# Today In My City

TodayInMyCity is a simple web page that pulls information about
the current location you're in, currently weather and nearby
meetup events. This is written using Node, and is set up to
run on RedHat's OpenShift PaaS.

As a sidenote to anyone viewing the code, this was a "let's learn
JavaScript and Node" project so the code is in need of some work.
It will get cleaned up in time.

If you choose to run this application for yourself, please do not use
my API endpoints which are currently set up in the code.

[todayinmy.city](http://todayinmy.city)

## Running the Project

TodayInMyCity is designed so that it can be run wholly or in part via node,
and wholly or in part as a static web site. The node application will serve
the entirety of the site and provides two endpoints to mirror API responses
from meetup.com and forecast.weather.gov (which uses an invalid SSL setup).
If you prefer, you can call them directly by changing the URLs in the
todayinmy.js file. You should remove the direct URL calls to my instance, which
are thus set so I can serve the application under multiple domains.

To run the node application, simply run `node server.js`. The app should be
accessible on port 8080.

To run or generate it as a static site, simply run `jekyll serve` or
`jekyll build -d _site`.

## APIs

* forecast.weather.gov
* openstreetmap.org
* freegeoip.net (geoip API for when geolocation fails)
* meetup.com (you will need an account and an API key)

## OpenShift

The OpenShift `nodejs` cartridge documentation can be found at:

http://openshift.github.io/documentation/oo_cartridge_guide.html#nodejs

## License

TodayInMyCity is licensed under the MIT license (included as LICENSE).

Though not required by the license terms, please consider contributing,
providing feedback, or simply dropping a line to say that this software was
useful to you. Pull requests are always welcome.
