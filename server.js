#!/bin/env node
var express = require('express');
var fs      = require('fs');
var cacheManager = require('cache-manager');
var request = require('request');

var memoryCache = cacheManager.caching({
        store: 'memory',
        max: 400,
        ttl: 3600
        });

var meetup_api_key = process.env.MEETUP_API_KEY;


/**
 *  Define the application.
 */
var TodayInMyCity = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating TodayInMyCity...',
                    Date(Date.now()), sig);
            process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
        'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };

        self.routes['/endpoint/forecast'] = function(req, response) {
            var FcstType = req.query.FcstType;
            var lat = req.query.lat;
            var lon = req.query.lon;
            var callback = req.query.callback;

            var url = "http://forecast.weather.gov/MapClick.php?FcstType=" + FcstType + "&lat=" + lat + "&lon=" + lon;
            request({
                    url: url,
                    json: true,
                    timeout: 3000,
                    method: "GET",
                    headers: {
                            "User-Agent": "Mozilla/5.0 NodeJS"
                    }
            }, function (error, reply, body) {
                    if (!error && reply.statusCode === 200) {
                        response.header("Access-Control-Allow-Origin", "*");
                        response.jsonp(body);
                    } else {
                        response.jsonp(callback + "({})");
                    }
            });
        }

        self.routes['/endpoint/meetup'] = function(req, response) {
            var longitude = req.query.longitude;
            var latitude = req.query.latitude;
            var city = req.query.city;
            var state = req.query.state;
            var cacheKey = 'meetup_' + city + '_' + state;

            var cachedValue = memoryCache.get(cacheKey);

            if (cachedValue) {
                console.log("Cache hit! " + cacheKey);
                response.header("Access-Control-Allow-Origin", "*");
                response.json(cachedValue);
            } else {
                var url = "https://api.meetup.com/2/open_events?and_text=False&offset=0&format=json&lon=" + longitude + "&limited_events=False&photo-host=public&page=20&radius=25.0&lat=" + latitude + "&desc=False&status=upcoming&key=" + meetup_api_key;
                request({
                    url: url,
                    json: true,
                    timeout: 3000,
                    method: "GET"
                }, function (error, reply, body) {
                    if (!error && reply.statusCode === 200) {
                        console.log("Cache miss for " + cacheKey);
                        memoryCache.set(cacheKey, body);
                        response.header("Access-Control-Allow-Origin", "*");
                        response.json(body);
                    } else {
                        response.json('{}');
                    }
                });
            }
        }
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }

        self.app.use('/js', express.static(__dirname+'/js'));
        self.app.use('/css', express.static(__dirname+'/css'));
        self.app.use('/fonts', express.static(__dirname+'/fonts'));
        self.app.use('/img', express.static(__dirname+'/img'));
        self.app.use('/assets', express.static(__dirname+'/assets'));
    };


    /**
     *  Initializes the application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                    Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new TodayInMyCity();
zapp.initialize();
zapp.start();
