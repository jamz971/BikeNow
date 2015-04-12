/**
 * Created by kemy on 10/04/15.
 */

var JCDECAUX_WEBSERVICE_URL_BASE = 'https://api.jcdecaux.com/vls/v1/stations?contract=';
var JCDECAUX_APIKEY = '&apiKey=7a250017cf6524d013a3f3aeab071dada46ebe86';

var MAPBOX_API_ACCESSTOKEN = 'pk.eyJ1Ijoia2VteTk3MSIsImEiOiJNS3UwWVgwIn0.XMwOcHaSlli4iZ8dBbfbOA';
var MAPBOX_SECRETKEY = 'kemy971.7a67c729';
var DEFAULT_MAP_ZOOM = 15;

var CITYINDEX = 0;
var CITY = [{
    city: "nantes",
    position: {lat: 47.218371, lng: -1.553621}
}, {
    city: "paris",
    position: {lat: 48.858859, lng: 2.3470599}
}, {
    city: "lyon",
    position: {}
}];
var CURRENTCITY = CITY[CITYINDEX];

var JCDECAUX_WEBSERVICE_URL = JCDECAUX_WEBSERVICE_URL_BASE + CURRENTCITY.city + JCDECAUX_APIKEY;