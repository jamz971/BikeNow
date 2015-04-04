// Ionic Starter App
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

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
            var apiKey = '&apiKey=7a250017cf6524d013a3f3aeab071dada46ebe86';
            $scope.stations;
            var map;
            var VELO_DISPO = "VELO_DISPO";
            var BORNES_DISPO = "BORNES_DISPO";
            var markerStations = [];
            var pointStation = [];
            var listePointsDistances = [];
            var listePointsDistancesSorted = [];
            var action = VELO_DISPO;
            var timer = undefined;
            var currentOpenPopup = '';
            var maPosition;
            var myPositionMarker;
            $scope.myChart;
            var all;
            $scope.favorisChart = [];

            var myPointPosition;
            $scope.mesStations = [];
            $scope.currentStation;

            $scope.pageTitle = "Prendre un Vélo";
            $scope.cacherBtnRight = false;
            $scope.cacherBtnLeft = true;
            $scope.cb = {"checked": false};

            var log = function (message) {
                console.log('=====> ' + message);
            };

            //Méthode de tri des stations dans l'ordre croissant de leurs numéros
            var sort = function (data) {
                return data.sort(function (a, b) {
                    if (a.number < b.number)
                        return -1;
                    if (a.number > b.number)
                        return 1;
                });
            };

            $scope.addFavoris = function () {
                log("Add Station to favoris");
                $scope.$apply(function () {
                    $scope.mesStations.push({"numStation": $scope.currentStation.number});
                });
                
                var dataFavorisChart = [
                        {
                            value: $scope.currentStation.available_bikes,
                            color: "#ef4e3a",
                            highlight: "#ef4e3a",
                            label: "Vélos"
                        },
                        {
                            value: $scope.currentStation.available_bike_stands,
                            color: "#9e9e9e",
                            highlight: "#9e9e9e",
                            label: "Bornes"
                        }
                    ];
                        var ctx = document.getElementById('favoris-' + $scope.currentStation.name).getContext("2d");
                        $scope.favorisChart.push(new Chart(ctx).Doughnut(dataFavorisChart, {animateRotate: false}));
                    

                console.log($scope.mesStations);
                $scope.toggleLeft();
            };

            //CheckToggle pour le paiement par CB
            $scope.onCheckedToggle = function () {
                updateStations();
            };

            var initLeftPanel = function () {
                for (var i = 0; i < $scope.mesStations.length; i++) {
                    var index = $scope.mesStations[i].numStation - 1;
                    var stationName = $scope.stations[index].name;
                    var dataFavorisChart = [
                        {
                            value: $scope.stations[index].available_bikes,
                            color: "#ef4e3a",
                            highlight: "#ef4e3a",
                            label: "Vélos"
                        },
                        {
                            value: $scope.stations[index].available_bike_stands,
                            color: "#9e9e9e",
                            highlight: "#9e9e9e",
                            label: "Bornes"
                        }
                    ];
                    log(stationName);
                    if ($scope.favorisChart[i] == undefined) {
                        var ctx = document.getElementById('favoris-' + stationName).getContext("2d");
                        $scope.favorisChart[i] = new Chart(ctx).Doughnut(dataFavorisChart, {animateRotate: false});
                    }



                }
            };

            //Affichage du panel gauche (Favoris)
            $scope.toggleLeft = function () {
                map.closePopup();
                log("Affiche Favoris");
                $ionicSideMenuDelegate.toggleLeft();
            };

            //Affichage du panel droit (Options)
            $scope.toggleRight = function () {
                map.closePopup();
                $ionicSideMenuDelegate.toggleRight();
            };

            //Méthode bornes dispo
            $scope.getBorneDispo = function () {
                console.log("=====> Methode : getBorneDispo()");
                console.log($scope.cb.checked);
                map.closePopup();
                action = BORNES_DISPO;
                $scope.cacherBtnRight = true;
                $scope.cacherBtnLeft = false;
                $scope.pageTitle = "Déposer un Vélo";
                updateStations();
            };

            //Méthode vélos dispo
            $scope.getVeloDispo = function () {
                console.log("=====> Methode : getVeloDispo()");
                console.log($scope.cb.checked);
                map.closePopup();
                action = VELO_DISPO;
                $scope.cacherBtnRight = false;
                $scope.cacherBtnLeft = true;
                $scope.pageTitle = "Prendre un Vélo";
                updateStations();
            };

            //Retoune la distances entre maPosition et les autres bornes
            var getProximityStations = function () {
                console.log('====> Méthode GetAllDistance');
                for (var i = 0; i < pointStation.length; i++) {
                    listePointsDistances.push({"index": i, "distance": myPointPosition.distanceTo(pointStation[i])});
                    listePointsDistancesSorted.push({"index": i, "distance": myPointPosition.distanceTo(pointStation[i])});
                }
                listePointsDistancesSorted.sort(function (a, b) {
                    if (a.distance < b.distance)
                        return -1;
                    if (a.distance > b.distance)
                        return 1;
                });
                all = true;
                initLeftPanel();
                refreshStationsData();
                openProximityStation();
                timer = startRefresh();
            };
            
            var openProximityStation = function(){
                var index = listePointsDistancesSorted[0].index;
                var marker = markerStations[index];
                marker.openPopup();
            };

            //Actualise la position du device et la pastille de localisation sur la carte
            var updatePosition = function (position) {
                log("Resume : Update Position");
                maPosition.lat = position.coords.latitude;
                maPosition.lng = position.coords.longitude;
                console.log(maPosition.lat + '|' + maPosition.lng);
                myPointPosition = L.latLng(maPosition.lat, maPosition.lng);
                map.setView([maPosition.lat, maPosition.lng], 15);
                myPositionMarker = undefined;
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

            //Méthode de comparaison des stations
            var isDifferent = function (stationOld, stationNew) {
                var result = true;
                if (all == true) {
                    result = true;
                } else {
                    if (stationOld.available_bikes == stationNew.available_bikes &&
                            stationOld.available_bike_stands == stationNew.available_bike_stands &&
                            stationOld.status == stationNew.status) {
                        result = false;
                    }
                }

                return result;
            };

            //Actualise les pastilles de stations suivant les filtres VELOS_DISPO ou BORNES_DISPO
            var updateStations = function () {
                for (var i = 0; i < $scope.stations.length; i++) {
                    var station = $scope.stations[i];
                    var marker = markerStations[i];
                    var content = (station.status == "CLOSED") ? 'HS' : (action == VELO_DISPO) ? station.available_bikes : station.available_bike_stands;
                    var classMarker = ($scope.cb.checked == true && station.banking == false && action == VELO_DISPO) ? 'count-icon-hidden' : ((content != 'HS' && content > 0) ? 'count-icon' : 'count-icon-close');
                    marker.setIcon(L.divIcon({
                        //Style CSS of marker
                        className: classMarker,
                        //HTML value inner marker
                        html: content,
                        // Set a markers width and height.
                        iconSize: [40, 40]
                    })
                            );
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

            //Méthode d'actualisation des données des stations
            var refreshStationsData = function () {
                console.log("=====> Update Data Stations");
                $http.get('https://api.jcdecaux.com/vls/v1/stations?contract=nantes' + apiKey)
                        .success(function (data) {
                            data = sort(data);
                            for (var i = 0; i < $scope.stations.length; i++) {
                                var station = $scope.stations[i];
                                var updateStation = data[i];
                                if (isDifferent(station, updateStation)) {
                                    log("Update Station : " + station.name);
                                    console.log(station);
                                    console.log(updateStation);
                                    $scope.stations[i] = data[i];
                                    station = $scope.stations[i];
                                    var marker = markerStations[i];
                                    var content = (station.status == "CLOSED") ? 'HS' : (action == VELO_DISPO) ? station.available_bikes : station.available_bike_stands;
                                    var classMarker = (content != 'HS' && content > 0) ? 'count-icon' : 'count-icon-close';

                                    //Mise à jour du contenu de la pastille
                                    marker.setIcon(L.divIcon({
                                        //Style CSS of marker
                                        className: classMarker,
                                        //HTML value inner marker
                                        html: content,
                                        // Set a markers width and height.
                                        iconSize: [40, 40]
                                    })
                                            );
                                    var popupMarker = marker.getPopup();
                                    popupMarker.setContent(infoStationContent(station, i));
                                    popupMarker.update();
                                    //marker.setPopupContent();

                                    //Mise à jour du graphique       
                                    if (station.name == currentOpenPopup) {
                                        // $scope.myChart.segments[0].value = station.available_bikes;
                                        // $scope.myChart.segments[1].value = station.available_bike_stands;
                                        // $scope.myChart.update();
                                        var dataChart = [
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
                                        $scope.myChart = undefined;
                                        $scope.myChart = new Chart(ctx).Doughnut(dataChart, {animateRotate: false});

                                    }

                                }
                            }
                            all = false;
                        });
            };

            //Si l'application passe en background => pause sur l'actualisation des données.
            document.addEventListener("pause", onPause, false);
            var onPause = function () {
                log("Device Pause");
                clearInterval(timer);
            };

            //Si l'application reprend le focus => nouvelle géolocalisation et reprise de l'actualisation des données
            document.addEventListener("resume", onResume, false);
            var onResume = function () {
                log("Device Resume");
                navigator.geolocation.getCurrentPosition(updatePosition, onError, {maximumAge: 5000, timeout: 10000, enableHighAccuracy: true});
            };

            //Lanceur de l'actualisation des données au démarrage de l'application
            var startRefresh = function () {
                log("Start Refresh methode");
                return setInterval(refreshStationsData, 30000);
            };

            //Ajout des markers de stations sur la map
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

            //Cration de point sur la map (pour le calcul des distances)
            var makePoint = function (station) {
                return L.latLng(station.position.lat,
                        station.position.lng);
            };

            //Initialisation de l'application
            var startApp = function () {
                log('Starting App');
                $http.get('https://api.jcdecaux.com/vls/v1/stations?contract=nantes' + apiKey)
                        .success(function (data) {

                            $scope.stations = sort(data);

                            L.mapbox.accessToken = 'pk.eyJ1Ijoia2VteTk3MSIsImEiOiJNS3UwWVgwIn0.XMwOcHaSlli4iZ8dBbfbOA';
                            map = L.mapbox.map('map', 'kemy971.k3ef99fc', {zoomControl: false}).setView([47.218371, -1.553621], 15);
                            log("Make Position and Marker");
                            for (var i = 0; i < $scope.stations.length; i++) {
                                pointStation.push(makePoint($scope.stations[i]));
                                markerStations.push(addMarker($scope.stations[i], i));
                            }
                            document.getElementById('starter').style.visibility = "visible";
                            
                            log('Get Position');
                            navigator.geolocation.getCurrentPosition(onSuccess, onError, {maximumAge: 5000, timeout: 10000, enableHighAccuracy: true});
                        });
            };


            var recupAppConfig = function () {
                $http.get("../config.json")
                        .success(function (data) {
                            $scope.cb.checked = data.stationCB;
                            $scope.mesStations = data.mesStations;
                            startApp();
                        })
                        .error(function (e) {
                            startApp();
                        });
            };

            recupAppConfig();

            //Start App


        });


angular.element(document).ready(function () {
    // retrieve the DOM element that had the ng-app attribute     
    var domElement = document.getElementById('starter');
    angular.bootstrap(domElement, ["starter"]);
}); 