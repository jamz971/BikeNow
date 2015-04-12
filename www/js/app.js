'use strict';

angular.module('openBike', ['ionic', 'ngCordova', 'chart.js'])

    .run(function ($ionicPlatform, $rootScope, $cordovaStatusbar) {
        $ionicPlatform.ready(function () {
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    })
    .controller('MainCtrl', function ($scope, $http, $document, $ionicSideMenuDelegate, $ionicPopup, $ionicPlatform, $cordovaGeolocation) {

        /**
         * Module de gestion des stations
         */
        var Stations;
        $scope.cb = {"checked": false};
        $scope.mesStations = [];
        $scope.pageTitle = "Prendre un Vélo";
        $scope.cacherBtnRight = false;
        $scope.cacherBtnLeft = true;
        $scope.stations = [];
        $scope.stationFavoris;
        $scope.labels = ["Velos Dispo", "Places Dispo"];
        $scope.colors = ["#9e9e9e", "#ef4e3a"];
        $scope.prendreBtn = "active";
        $scope.deposerBtn = "";
        $scope.currentOpenPopup;
        $scope.data = {
            showDelete: false,
            showReorder: true
        };

        $scope.open = true;
        $scope.inProgress;
        $scope.route = {
            station: {},
            show: false
        };

        var map;
        var VELO_DISPO = "VELO_DISPO";
        var BORNES_DISPO = "BORNES_DISPO";
        var action = VELO_DISPO;

        var timer = undefined;
        var miniMarker = false;
        var positionInterval;
        //Méthode bornes dispo
        $scope.getBorneDispo = function () {
            console.log("=====> Methode : getBorneDispo()");
            $scope.prendreBtn = "";
            $scope.deposerBtn = "active";
            console.log($scope.cb.checked);
            //map.closePopup();
            action = BORNES_DISPO;

            Stations.updateMarkerStations();
        };

        //Méthode vélos dispo
        $scope.getVeloDispo = function () {
            console.log("=====> Methode : getVeloDispo()");
            $scope.prendreBtn = "active";
            $scope.deposerBtn = "";
            console.log($scope.cb.checked);
            //map.closePopup();
            action = VELO_DISPO;
            Stations.updateMarkerStations();
        };

        $scope.onCheckedToggle = function () {
            Stations.updateMarkerStations();
        };


        $scope.toggleLeft = function () {
        };

        $scope.toggleMainPanel = function () {
            var heightSup = 296;
            var heightScreen = window.screen.height;
            var dist = heightScreen - heightSup;

            if ($scope.open) {
                //Close Panel
                $scope.open = false;
                move('#map')
                    .set('height', (232 + dist) + "px")
                    //.set('height', "89%")
                    .duration('0.1s')
                    .end(function () {
                        map.invalidateSize(true);
                        move('#cardStationProche')
                            .ease('snap')
                            .set('margin-top', (232 + dist) + "px")
                            .duration('0.3s')
                            .end();
                        move('#footer')
                            .ease('snap')
                            .set('margin-top', (173 + dist) + "px")
                            .duration('0.3s')
                            .end();
                    });
            } else {
                //Open Panel
                $scope.open = true;
                map.closePopup();
                move('#map')
                    .set('height', 232 + "px")
                    .duration('0.1s')
                    .end(function () {
                        map.invalidateSize(true);
                    });
                move('#cardStationProche')
                    .ease('snap')
                    .set('margin-top', 232 + "px")
                    .duration('0.3s')
                    .end();
                move('#footer')
                    .ease('snap')
                    .set('margin-top', 173 + "px")
                    .duration('0.3s')
                    .end();

            }
        };

        $scope.centerToPosition = function () {
            if (!geolocation.inProgress) {
                geolocation.startLocation();
            }

        };

        $scope.showStation = function (station, action) {
            $scope.route.show = true;
            $scope.route.station = station;
            map.invalidateSize(true);

            if (action) {
                $scope.toggleMainPanel();


            } else {
                map.closePopup();
                $ionicSideMenuDelegate.toggleLeft();
            }
            setTimeout(function () {
                Map.bound(station);
                Map.getDirection(station);
            }, 500);


        };

        $scope.closeDirection = function () {
            $scope.route.show = false;
            Map.hideDirection();

        };

        $scope.addFavoris = function () {
            Favoris.add();
        };

        $scope.delFavoris = function (station) {
            Favoris.del(station);
        };

        $scope.filterDistance = function(station) {
            return (station.distanceInt() <= 500);
        }

        /**
         * Module de gestion des Favoris
         */
        var Favoris = {
            add: function () {

                var station = Marker.currentOpenPopup.station;
                station.favoris = true;
                var btnFavoris = document.getElementById('favoris');
                btnFavoris.setAttribute("disabled", "");
                $ionicSideMenuDelegate.toggleLeft();
            },
            del: function (station) {
                station.favoris = false;
            }
        };

        /**
         * Station Modele
         */
        var Station = function (a) {
            var station = a, marker = {}, point = {}, nameStation = '';
            var dataArray = [];
            (function () {
                var index = station.name.indexOf('-');
                nameStation = station.name.substr(index + 1, station.name.length - 1);
            })();

            return {
                number: station.number,
                name: nameStation,
                velosDispo: station.available_bikes,
                bornesDispo: station.available_bike_stands,
                data: function () {
                    dataArray[0] = this.bornesDispo;
                    dataArray[1] = this.velosDispo;
                    return dataArray;
                },
                statut: station.status,
                banking: station.banking,
                position: {
                    lat: station.position.lat,
                    lng: station.position.lng
                },
                marker: marker,
                point: point,
                distance: function () {
                    var result;
                    if (User.position.lat != 0 && User.position.lng != 0) {
                        result = this.point.distanceTo(User.point);
                        result = Math.round(result);
                        if (result > 1000) {
                            result = result / 1000;
                            result = result + ' ';
                            result = result.slice(0, 4);
                            result = result + ' km';
                        } else {
                            result = result + ' m';
                        }


                    } else {
                        result = "Indispo";
                    }
                    return result;
                },
                distanceInt: function () {
                    var result;
                    if (User.position.lat != 0 && User.position.lng != 0) {
                        result = this.point.distanceTo(User.point);
                        result = Math.round(result);
                    } else {
                        result = "Indispo";
                    }
                    return result;
                },
                equal: function (o) {
                    var diff = false;
                    if (this.velosDispo == o.available_bikes &&
                        this.bornesDispo == o.available_bike_stands &&
                        this.statut == o.status) {
                        diff = true;
                    }
                    return diff;
                },
                update: function (o) {
                    this.velosDispo = o.available_bikes;
                    this.bornesDispo = o.available_bike_stands;
                    this.statut = o.status;
                },
                favoris: false
            };
        };

        Stations = (function () {
            var stations = $scope.stations;
            return {
                init: function (data) {
                    for (var i = 0; i < data.length; i++) {
                        var station = new Station(data[i]);
                        station.marker = Marker.createStationMarker(station);
                        station.point = Marker.createStaionPoint(station);
                        this.addStation(station);
                    }
                },
                addStation: function (station) {
                    var key = station.number;
                    stations[key] = station;
                },
                station: function (key) {
                    return stations[key];
                },
                updatePopupStations: function () {
                    for (var key in stations) {
                        var marker = stations[key].marker;
                        marker.bindPopup(Marker.infoStationContent(stations[key]));
                    }
                },
                updateMarkerStations: function () {
                    for (var key in stations) {
                        Marker.updateStationMarker(stations[key]);
                    }
                },
                refreshStationsData: function () {
                    console.log("=====> Start Update Data Stations");
                    /*
                    Rafraichir uniquement les stations se trouvant dans un rayon de 800m
                    Ne plus rafraichir les stations suivant le niveau de zoom (quand stations en petites pastilles)
                     */
                    var debut = Date.now();
                    $http.get(JCDECAUX_WEBSERVICE_URL)
                        .success(function (data) {
                            var i = -1;
                            Utils.sort(data);
                            var stationsUpdate = 0;
                            for (var key in stations) {
                                i++;
                                var station = stations[key];
                                var updateStation = data[i];
                                if (!station.equal(updateStation)) {
                                    //Utils.log("Update Station : " + station.name);
                                    //console.log(station);
                                    //console.log(updateStation);
                                    stationsUpdate += 1;
                                    station.update(updateStation);
                                    Marker.updateStationMarker(station);

                                    var popupMarker = station.marker.getPopup();
                                    popupMarker.setContent(Marker.infoStationContent(station));
                                    popupMarker.update();

                                    //Mise à jour du graphique
                                    if ($scope.currentOpenPopup.open && station.name == $scope.currentOpenPopup.name) {
                                        var dataChart = [
                                            {
                                                value: station.velosDispo,
                                                color: "#ef4e3a",
                                                highlight: "#ef4e3a",
                                                label: "Vélos"
                                            },
                                            {
                                                value: station.bornesDispo,
                                                color: "#9e9e9e",
                                                highlight: "#9e9e9e",
                                                label: "Bornes"
                                            }
                                        ];

                                        var chart = $scope.currentOpenPopup.chart;
                                        chart.destroy();
                                        var ctx = document.getElementById(station.name).getContext("2d");
                                        chart = new Chart(ctx).Doughnut(dataChart, {animateRotate: false});
                                    }
                                }
                            }
                            var fin = Date.now();
                            var temps = fin - debut;
                            Utils.log("Nombre de stations mise à jour : "+stationsUpdate);
                            Utils.log("Temps de rafraichissement : "+temps);
                            app.startRefresh();
                        })
                        .error(function(e){
                            $ionicPopup.alert({
                                title: 'Error : data error ',
                                template: e.message
                            });
                            Utils.log("Data Error");
                            app.startRefresh();
                        });

                },
                getProximityStation: function () {
                    var station, distance = null;
                    for (var key in stations) {
                        if (distance !== null) {
                            if (stations[key].distanceInt() < distance) {
                                station = stations[key];
                                distance = stations[key].distanceInt();
                            }
                        } else {
                            distance = stations[key].distanceInt();
                        }
                    }
                    return station;
                }
            };
        })();

        /**
         * User Modele
         */
        var User = {
            position: {
                lat: 0,
                lng: 0
            },
            equal: function (position) {
                if (this.position.lat == position.coords.latitude &&
                    this.position.lng == position.coords.longitude) {
                    return true;
                } else {
                    return false;
                }

            },
            marker: undefined,
            point: undefined
        };

        /**
         * Module de gestion des markers
         */
        var Marker = (function () {
            var marker;
            var currentOpenPopup = {
                name: {},
                chart: {},
                station: {},
                open: false
            };
            $scope.currentOpenPopup = currentOpenPopup;
            return {
                currentOpenPopup: currentOpenPopup,
                createMarker: function (lat, lng, option) {
                    return L.marker([lat, lng], option).addTo(map);
                },
                createUserPositionMarker: function () {
                    var option = {
                        icon: L.divIcon({
                            //Style CSS of marker
                            className: '',
                            //HTML value inner marker
                            html: '<div class="marker"><div class="dot"></div><div class="pulse"></div></div>',
                            // Set a markers width and height.
                            iconSize: [50, 50]
                        })
                    };
                    return this.createMarker(User.position.lat, User.position.lng, option);

                },
                createStationMarker: function (station) {
                    var content = (station.status == "CLOSED") ? 'HS' : (action == VELO_DISPO) ? station.velosDispo : station.bornesDispo;
                    var classMarker = ($scope.cb.checked == true && station.banking == false && action == VELO_DISPO) ? 'count-icon-hidden' : ((content != 'HS' && content > 0) ? 'count-icon' : 'count-icon-close');
                    var option = {
                        icon: L.divIcon({
                            className: classMarker,
                            html: content,
                            iconSize: [40, 40]
                        })
                    };
                    marker = this.createMarker(station.position.lat, station.position.lng, option);
                    marker.bindPopup(this.infoStationContent(station), {className: "CustomPopup"});

                    marker.addEventListener("popupopen", function () {
                        if ($scope.open) {
                            $scope.toggleMainPanel();
                        }
                        currentOpenPopup.open = true;
                        currentOpenPopup.name = station.name;
                        $scope.stationFavoris = station.favoris;
                        var data = [
                            {
                                value: station.velosDispo,
                                color: "#ef4e3a",
                                highlight: "#ef4e3a",
                                label: "Vélos"
                            },
                            {
                                value: station.bornesDispo,
                                color: "#9e9e9e",
                                highlight: "#9e9e9e",
                                label: "Bornes"
                            }
                        ];

                        var ctx = document.getElementById(station.name).getContext("2d");
                        currentOpenPopup.chart = new Chart(ctx).Doughnut(data);

                        var btnFavoris = document.getElementById('favoris');
                        if (station.favoris) {
                            btnFavoris.setAttribute("disabled", "");
                        } else {
                            btnFavoris.addEventListener('click', $scope.addFavoris, false);
                            btnFavoris.removeAttribute("disabled", "");
                        }


                        currentOpenPopup.station = station;
                        $scope.currentOpenPopup = currentOpenPopup;
                    }, station);
                    marker.addEventListener("popupclose", function () {
                        currentOpenPopup.open = false;
                        console.log("Status Popup : " + currentOpenPopup.open);
                    });
                    return marker;
                },
                createStaionPoint: function (station) {
                    return L.latLng(station.position.lat,
                        station.position.lng);
                },
                createPositionPoint: function () {
                    return L.latLng(User.position.lat,
                        User.position.lng);
                },
                infoStationContent: function (station) {
                    var bankingExist = (station.banking == true) ? ' <i class="icon ion-card"></i>' : '';

                    var info = '<div id="popup">';

                    info += '<div id="headerContentPopup" class="row">';
                    info += '<div class="col">';
                    info += '<h2>' + station.name + bankingExist + '</h2>';
                    info += '</div>';
                    info += '<div class="col-25" style="text-align: right">';
                    info += '<button class="button button-large button-clear  button-assertive ion-ios-heart" id="favoris"></button>';
                    info += '</div>';
                    info += '</div>';

                    info += '<div class="row">';
                    info += '<div class="col" style="text-align: center">';
                    info += '<canvas id="' + station.name + '" width="80" height="80"></canvas>';
                    info += '</div>';
                    info += '<div class="col">';
                    info += '<p style="color:#ef4e3a;font-size: 23px;">' + station.velosDispo + ' Vélos</p>';
                    info += '<p style="color:#838383;font-size: 23px;">' + station.bornesDispo + ' Places</p>';
                    info += '<p><span style="style="font-size: 14px;"><i class="icon ion-location"></i> ' + station.distance() + '</span></p>'
                    info += '</div>';
                    info += '</div>';

                    info += '</div>';

                    return info;
                },
                updateStationMarker: function (station) {
                    var marker = station.marker;
                    var content = (station.status == "CLOSED") ? 'HS' : (action == VELO_DISPO) ? station.velosDispo : station.bornesDispo;
                    var classMarker = ($scope.cb.checked == true && station.banking == false && action == VELO_DISPO) ? 'count-icon-hidden' : ((content != 'HS' && content > 0) ? ((miniMarker) ? 'mini-count-icon' : 'count-icon') : ((miniMarker) ? 'mini-count-icon-close' : 'count-icon-close'));

                    if (miniMarker) {
                        marker.setIcon(L.divIcon({
                                //Style CSS of marker
                                className: classMarker,
                                iconSize: [15, 15]
                            })
                        );
                    } else {
                        marker.setIcon(L.divIcon({
                                //Style CSS of marker
                                className: classMarker,
                                html: content,
                                iconSize: [40, 40]

                            })
                        );
                    }

                }
            };
        })();

        /**
         * Module de gestion des etats de l'application
         * Démarrage de l'application,
         * Pause (passage de l'application en background),
         * Reprise (Retour sur l'application)
         * Masquer l'application en cours de chargement
         * Affichage de l'application chargé
         *
         * @type {{startRefresh: Function, stopRefresh: Function, resumeRefresh: Function}}
         */
        var app = {
            stop : false,
            startRefresh: function () {
                //Utils.log("Start Refresh methode");
                if(!this.stop){
                    setTimeout(Stations.refreshStationsData, 30000);
                }
            },
            stopRefresh: function () {
                Utils.log("Stop Application");
                this.stop = true;
                //clearInterval(timer);
            },
            resumeRefresh: function () {
                Utils.log("Resume Application");
                geolocation.startLocation();
                this.stop = false;
                app.startRefresh();
            }
        };

        $ionicPlatform.on('pause', app.stopRefresh);
        $ionicPlatform.on('resume', app.resumeRefresh);

        var watchPosition;
        var timeoutWatchPosition = null;

        /**
         * Module Géolocalisation et routing
         * @type {{inProgress: (boolean|*), stopLocation: Function, onSuccess: Function, onError: Function, startLocation: Function}}
         */
        var geolocation = {
            inProgress: $scope.inProgress,
            stopLocation: function (success) {
                Utils.log("Stop Location");
                if (success) {
                    console.log(User.position.lat + '|' + User.position.lng);
                    if (!$scope.open) {
                        $scope.toggleMainPanel();
                    }
                    var station = Stations.getProximityStation();
                    setTimeout(function () {
                        Map.bound(station);
                    }, 800);

                } else {
                    Map.center(CURRENTCITY.position.lat, CURRENTCITY.position.lng, 15);
                }
                watchPosition.clearWatch();
                timeoutWatchPosition = null;
                $scope.$apply($scope.inProgress = false);
                Stations.updatePopupStations();
            },
            onSuccess: function (position) {
                Utils.log('Position Success');
                //if(!User.equal(position)) {
                    User.position.lat = position.coords.latitude;
                    User.position.lng = position.coords.longitude;
                    if (User.marker === undefined && User.point === undefined) {
                        User.marker = Marker.createUserPositionMarker();
                        User.marker.setZIndexOffset(1000);
                        User.point = Marker.createPositionPoint();
                    } else {
                        User.marker.setLatLng([User.position.lat, User.position.lng]);
                        User.marker.update();
                        User.point = undefined;
                        User.point = Marker.createPositionPoint();
                    }

                /*}else{
                    geolocation.stopLocation(true);
                }*/
                if(timeoutWatchPosition === null) {
                    timeoutWatchPosition = setTimeout(function () {
                        geolocation.stopLocation(true);
                    }, 5000);
                }
            },
            onError: function (e) {
                $ionicPopup.alert({
                    title: 'Error : Code ' + e.code,
                    template: e.message
                });
                Utils.log('Position Error');
                Utils.log("Stop Location");
                geolocation.stopLocation(false);
            },
            startLocation: function () {
                Utils.log("Start Location");
                $scope.inProgress = true;
                var watchOptions = {
                    frequency: 1000,
                    //timeout: 10000,
                    enableHighAccuracy: false
                };
                watchPosition = $cordovaGeolocation.watchPosition(watchOptions);
                watchPosition.then(null, this.onError, this.onSuccess);
            }

        };

        var route = null;
        /**
         * Module Map
         * @type {{init: Function, center: Function, bound: Function, getDirection: Function}}
         */
        var Map = {
            init: function () {
                L.mapbox.accessToken = MAPBOX_API_ACCESSTOKEN;

                map = L.mapbox.map('map', MAPBOX_SECRETKEY, {

                    zoomControl: false,
                    attributionControl: false
                }).setView([CURRENTCITY.position.lat,CURRENTCITY.position.lng], DEFAULT_MAP_ZOOM);


                map.on('click', function () {
                    if ($scope.open) {
                        $scope.$apply($scope.toggleMainPanel());

                    }
                });

                map.on('zoomend', function () {
                    console.log(map.getZoom());
                    if (map.getZoom() <= 14 && !miniMarker) {
                        miniMarker = true;
                        Stations.updateMarkerStations();
                    } else if (map.getZoom() > 14 && miniMarker) {
                        miniMarker = false;
                        Stations.updateMarkerStations();
                    }
                });

            },
            center: function (lat, lng, zoom) {
                map.setView([lat, lng], zoom);
            },
            bound: function (station) {
                var point = L.point(0, 50);
                var boundOption = {
                    "padding": point
                };
                map.fitBounds([
                    [User.position.lat, User.position.lng],
                    [station.position.lat, station.position.lng]
                ], boundOption);
            },
            getDirection: function (station) {
                //Custom Marker
                var CustomRouteLayer = MQ.Routing.RouteLayer.extend({
                    createStopMarker: function (location, stopNumber) {
                        var custom_icon,
                            marker;

                        custom_icon = L.icon({
                            iconUrl: '//www.mapquestapi.com/staticmap/geticon?uri=poi-red_1.png',
                            iconSize: [0, 0],
                            iconAnchor: [10, 29],
                            popupAnchor: [0, -29]
                        });

                        marker = L.marker(location.latLng, {icon: custom_icon})
                            .addTo(map);

                        return marker;
                    }
                });

                //Make Directions
                var dir = MQ.routing.directions();
                dir.route({
                    locations: [
                        {latLng: {lat: User.position.lat, lng: User.position.lng}},
                        {latLng: {lat: station.position.lat, lng: station.position.lng}
                        }],
                    options: {routeType: 'pedestrian'}
                });

                //Draw Directions Option
                var dirOption = {
                    directions: dir,
                    draggable: false,
                    ribbonOptions: {
                        draggable: false,
                        ribbonDisplay: {color: '#4f4f4f', opacity: 0.5}
                    }
                };


                if (route == null) {
                    route = new CustomRouteLayer(dirOption);
                } else {
                    map.removeLayer(route);
                    route = new CustomRouteLayer(dirOption);

                }

                map.addLayer(route);
            },
            hideDirection: function () {
                map.removeLayer(route);
            }
        };


        //
        (function () {
            Utils.log('Starting App');

            Map.init();

            $scope.toggleMainPanel();

            $http.get(JCDECAUX_WEBSERVICE_URL)
                .success(function (data) {
                    Utils.log("Nombre de stations : "+ data.length);
                    Utils.sort(data);
                    Stations.init(data);

                    Utils.hidden("loader-content");
                    Utils.show("starter-content");

                    geolocation.startLocation();
                    app.startRefresh();
                });
        })();

        //Auto-start app
        /*(function () {
            $http.get("../config.json")
                .success(function (data) {
                    $scope.cb.checked = data.stationCB;
                    //$scope.mesStations = data.mesStations;
                    startApp();
                })
                .error(function (e) {
                    startApp();
                });
        })();*/
    });

angular.element(document).ready(function () {
    var domElement = document.getElementById("openBike");
    angular.bootstrap(domElement, ["openBike"]);
}); 