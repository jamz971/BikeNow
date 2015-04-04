var starter = angular.module('starter', ['ionic'])

        .run(function ($ionicPlatform, $rootScope) {
            $ionicPlatform.ready(function () {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }
                //$rootScope.$apply();
            });
        })
        .controller('AppCtrl', function ($scope, $http, $ionicSideMenuDelegate, $interval) {
            
            $scope.cb.checked;
            $scope.mesStations;
            var map;
            var VELO_DISPO = "VELO_DISPO";
            var BORNES_DISPO = "BORNES_DISPO";
            var apiKey = '&apiKey=7a250017cf6524d013a3f3aeab071dada46ebe86';
            
            //Collections de stations
            $scope.stations = (function () {
                var stations = [];
                return {
                    'addStation': function (station) {
                        var key = station.number;
                        this.station[key] = station;
                    },
                    'station': function (key) {
                        return stations[key];
                    }
                };
            })();

            //Modele station
            var station = function (a) {
                var station = a, marker = {},point = {};
                
                (function(){
                    var content = (station.status == "CLOSED") ? 'HS' : (action == VELO_DISPO) ? station.available_bikes : station.available_bike_stands;
                    var classMarker = ($scope.cb.checked == true && station.banking == false && action == VELO_DISPO) ? 'count-icon-hidden' : ((content != 'HS' && content > 0) ? 'count-icon' : 'count-icon-close');
                    marker = L.marker([
                    station.position.lat,
                    station.position.lng
                ], {
                    icon: L.divIcon({
                        //Style CSS of marker
                        className: classMarker,
                        //HTML value inner marker
                        html: content,
                        // Set a markers width and height.
                        iconSize: [40, 40]
                    })
                }).addTo(map);
                })();
                
                return{
                    'number': station.number,
                    'name': function () {
                        //retourne le nom formater de la station
                    },
                    'velosDispo': station.available_bikes,
                    'bornesDispo': station.available_bike_stands,
                    'statut': station.statut,
                    'bancking': station.bancking,
                    'position': {
                        'lat': station.position.lat,
                        'lng': station.position.lng
                    },
                    'marker': function () {
                        //retourne le marker de la station
                    },
                    'point': function () {
                        //retourne le point de la station
                    },
                    'distance': function () {
                        //retourne la distance entre la position de l'utilisateur et la position de la station
                    },
                    'equal': function (o) {
                        var diff = false;
                        if (!(this.velosDispo == o.available_bikes &&
                                this.bornesDispo == o.available_bike_stands &&
                                this.statut == o.statut)) {
                            diff = true;
                        }
                        return diff;
                    },
                    'update': function (o) {
                        if (this.equal(o)) {
                            this.velosDispo = o.velosDispo;
                            this.bornesDispo = o.bornesDispo;
                            this.statut = o.statut;
                        }
                    }
                };
            };
            
            var user = {
                'position' : {
                    'lat':0,
                    'lng':0
                },
                'marker':function(){
                    
                },
                'point':function(){
                    
                }
            };
            
             //Génére les informations d'une station en HTML (contenu de la popup du'un marker)
            function infoStationContent(station, i) {
                var index = station.name.indexOf('-');
                var nameStation = station.name.substr(index + 1, station.name.length - 1);
                $scope.stations[i].name = nameStation;
                var bankingExist = (station.banking == true) ? ' <i class="icon ion-card"></i>' : '';
                var info = '<div id="popup"><h3>' + nameStation + bankingExist + '</h3>';
                info += '<div class="row">';
                info += '<div class="col">';
                info += '<canvas id="' + station.name + '" width="90" height="90"></canvas>';
                info += '</div>';
                info += '<div class="col">';
                info += '<p style="color:#ef4e3a;font-size: 23px;">' + station.available_bikes + ' Vélos</p>';
                info += '<p style="color:#838383;font-size: 23px;">' + station.available_bike_stands + ' Bornes</p>';

                if (listePointsDistances.length > 0) {
                    var distance = Math.round(listePointsDistances[i].distance);
                    //info += '<div id="distanceInfo">';
                    info += '<p style="color:#484848;font-size: 18px;"><i class="icon ion-location"></i> ' + distance + 'm</p>';
                    //info += '</div>';
                }
                info += '</div>';
                info += '</div>';
                info += '<div class="row">';
                info += '<div class="col"><button class="button button-block button-small button-outline  button-assertive ion-ios7-heart" id="favoris"> Favoris</button></div>';
                info += '<div class="col"><button class="button button-block button-small button-outline  button-dark ion-ios7-flag" ng-click=""> Itinéraire</button></div>';
                info += '</div>';
                info += '</div>';

                return info;
            }

            
            function addMarker(station, i) {
                var content = (station.status == "CLOSED") ? 'HS' : (action == VELO_DISPO) ? station.available_bikes : station.available_bike_stands;
                var classMarker = ($scope.cb.checked == true && station.banking == false && action == VELO_DISPO) ? 'count-icon-hidden' : ((content != 'HS' && content > 0) ? 'count-icon' : 'count-icon-close');
                return L.marker([
                    station.position.lat,
                    station.position.lng
                ], {
                    icon: L.divIcon({
                        //Style CSS of marker
                        className: classMarker,
                        //HTML value inner marker
                        html: content,
                        // Set a markers width and height.
                        iconSize: [40, 40]
                    })
                }).addTo(map)
                        .bindPopup(infoStationContent(station, i))
                        .addEventListener("popupopen", function () {
                            station = $scope.stations[i];
                            log("Open Popup");
                            console.log(station);
                            currentOpenPopup = station.name;

                            var data = [
                                {
                                    value: station.available_bikes,
                                    color: "#ef4e3a",
                                    highlight: "#ef4e3a",
                                    label: "Vélos"
                                },
                                {
                                    value: station.available_bike_stands,
                                    color: "#9e9e9e",
                                    highlight: "#9e9e9e",
                                    label: "Bornes"
                                }
                            ];

                            var ctx = document.getElementById(station.name).getContext("2d");
                            $scope.myChart = new Chart(ctx).Doughnut(data);

                            var btnFavoris = document.getElementById('favoris');
                            btnFavoris.addEventListener('click', $scope.addFavoris, false);

                            $scope.currentStation = station;
                        }, station)
                        .addEventListener("popupclose", function () {
                            currentOpenPopup = '';
                        });



            }
            
            //Si la géolocalisation du device est réussi
            var onSuccess = function (position) {
                log('Position Success');
                maPosition = {"lat": position.coords.latitude, "lng": position.coords.longitude};
                console.log(maPosition.lat + '|' + maPosition.lng);
                myPointPosition = L.latLng(maPosition.lat, maPosition.lng);
                map.setView([maPosition.lat, maPosition.lng], 15);
                myPositionMarker = L.marker([
                    maPosition.lat,
                    maPosition.lng
                ], {
                    icon: L.divIcon({
                        //Style CSS of marker
                        className: 'currentPos',
                        //HTML value inner marker
                        html: '',
                        // Set a markers width and height.
                        iconSize: [22, 22]
                    })
                }).addTo(map);
                getProximityStations();
            };

            //Si la géolocalisation du device échoue
            var onError = function () {
                log('Position Error');
                ;
                map.setView([47.218371, -1.553621], 15);
                initLeftPanel();
                timer = startRefresh();
            };
            
            //Initialisation de l'application
            var startApp = function () {
                log('Starting App');
                L.mapbox.accessToken = 'pk.eyJ1Ijoia2VteTk3MSIsImEiOiJNS3UwWVgwIn0.XMwOcHaSlli4iZ8dBbfbOA';
                map = L.mapbox.map('map', 'kemy971.k3ef99fc', {zoomControl: false}).setView([47.218371, -1.553621], 15);
                $http.get('https://api.jcdecaux.com/vls/v1/stations?contract=nantes' + apiKey)
                        .success(function (data) {
                            log("Make Position and Marker");
                            for (var i = 0; i < data.length; i++) {
                                $scope.stations.addStation(new station(data[i]));
                            }
                            document.getElementById('starter').style.visibility = "visible";
                            log('Get Position');
                            //navigator.geolocation.getCurrentPosition(onSuccess, onError, {maximumAge: 5000, timeout: 10000, enableHighAccuracy: true});
                        });
            };
            
            //Auto-start app
            (function () {
                $http.get("../config.json")
                        .success(function (data) {
                            $scope.cb.checked = data.stationCB;
                            $scope.mesStations = data.mesStations;
                            startApp();
                        })
                        .error(function (e) {
                            startApp();
                        });
            })();
        });
        
angular.element(document).ready(function () {
    // retrieve the DOM element that had the ng-app attribute     
    var domElement = document.getElementById('starter');
    angular.bootstrap(domElement, ["starter"]);
}); 