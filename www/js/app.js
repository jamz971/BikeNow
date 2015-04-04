var starter;
starter = angular.module('starter', ['ionic','ngCordova','chart.js'])

    .run(function ($ionicPlatform, $rootScope,$cordovaStatusbar) {
        $ionicPlatform.ready(function () {
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
            window.statusbar.visible = false;
        });
    })
    .controller('AppCtrl', function ($scope, $http,$document, $ionicSideMenuDelegate, $ionicPopup,$ionicPlatform, $cordovaGeolocation) {

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
        $scope.colors = ["#9e9e9e","#ef4e3a"];
        $scope.prendreBtn = "active";
        $scope.deposerBtn = "";
        $scope.currentOpenPopup;
        $scope.data = {
            showDelete: false,
            showReorder : true
        };

        $scope.open = true;
        $scope.inProgress;

        var map;
        var VELO_DISPO = "VELO_DISPO";
        var BORNES_DISPO = "BORNES_DISPO";
        var action = VELO_DISPO;
        var apiKey = '&apiKey=7a250017cf6524d013a3f3aeab071dada46ebe86';
        var timer = undefined;
        var miniMarker = false;
        var city = ["nantes","lyon","paris"];
        var cityIndex = 0;
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

        $scope.toggleMainPanel = function(callback){
            var heightSup = 296;
            var heightScreen = window.screen.height;
            var dist =  heightScreen - heightSup;
            var i = 1;
            var mapCanvas = document.getElementById("map");
            var cardStationProche = document.getElementById("cardStationProche");
            var footer = document.getElementById("footer");
            
            if($scope.open) {
                $scope.open = false;
                move('#map')
                    .set('height', (232 + dist)+"px")
                    //.set('height', "89%")
                    .duration('0.1s')
                    .end(function(){
                        map.invalidateSize(true);
                        move('#cardStationProche')
                            .ease('snap')
                            .set('margin-top', (232 + dist)+"px")
                            .duration('0.3s')
                            .end();
                        move('#footer')
                            .ease('snap')
                            .set('margin-top', (173 + dist)+"px")
                            .duration('0.3s')
                            .end();
                    });
            }else{
                $scope.open = true;
                map.closePopup();
                move('#map')
                    .set('height', 232+"px")
                    .duration('0.1s')
                    .end(function(){
                        map.invalidateSize(true);
                    });
                move('#cardStationProche')
                    .ease('snap')
                    .set('margin-top', 232+"px")
                    .duration('0.3s')
                    .end();
                move('#footer')
                    .ease('snap')
                    .set('margin-top', 173+"px")
                    .duration('0.3s')
                    .end();

            }
        };

        $scope.centerToPosition = function(){
            if(!geolocation.inProgress){
                geolocation.startLocation();
            }

        };

        $scope.showStation = function(station,action){
            if(action){
                $scope.toggleMainPanel();

            }else{
                $ionicSideMenuDelegate.toggleLeft();
            }
            setTimeout(function(){
                map.setView([station.position.lat, station.position.lng], 16);
                station.marker.openPopup();
            },500);



        };

        $scope.addFavoris = function () {
            Favoris.add();
        };

        $scope.delFavoris = function(station){
            Favoris.del(station);
        };
        /**
         * Module de gestion des Favoris
         */
        var Favoris = {
            add: function () {

                var station = Marker.currentOpenPopup.station;
                station.favoris = true;
                var btnFavoris = document.getElementById('favoris');
                btnFavoris.setAttribute("disabled","");
                $ionicSideMenuDelegate.toggleLeft();
            },
            del: function(station){
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
                data: function(){
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
                        if(result>1000){
                            result = result/1000;
                            result = result + ' ';
                            result = result.slice(0,4);
                            result = result+' km';
                        }else{
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
                    for (key in stations) {
                        var marker = stations[key].marker;
                        marker.bindPopup(Marker.infoStationContent(stations[key]));
                    }
                },
                updateMarkerStations: function () {
                    for (key in stations) {
                        Marker.updateStationMarker(stations[key]);
                    }
                },
                refreshStationsData: function () {
                    console.log("=====> Update Data Stations");
                    $http.get('https://api.jcdecaux.com/vls/v1/stations?contract=' + city[cityIndex] + apiKey)
                        .success(function (data) {
                            var i = -1;
                            Utils.sort(data);
                            for (key in stations) {
                                i++;
                                var station = stations[key];
                                var updateStation = data[i];
                                if (!station.equal(updateStation)) {
                                    Utils.log("Update Station : " + station.name);
                                    console.log(station);
                                    console.log(updateStation);
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
                        });
                },
                getProximityStation: function () {
                    var station,distance = undefined;
                    for (key in stations) {
                        if(distance != undefined){
                            if(stations[key].distanceInt() < distance) {
                                station = stations[key];
                                distance = stations[key].distanceInt();
                            }
                        }else{
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
            equal : function(position){
                if(this.position.lat == position.coords.latitude &&
                this.position.lng == position.coords.longitude){
                    return true;
                }else{
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
                open : false
            };
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
                    marker.bindPopup(this.infoStationContent(station),{className:"CustomPopup"});

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
                            btnFavoris.setAttribute("disabled","");
                        } else {
                           btnFavoris.addEventListener('click', $scope.addFavoris, false);
                            btnFavoris.removeAttribute("disabled","");
                        }


                        currentOpenPopup.station = station;
                        $scope.currentOpenPopup = currentOpenPopup;
                    }, station);
                    marker.addEventListener("popupclose", function () {
                        currentOpenPopup.open = false;
                        console.log("Status Popup : "+currentOpenPopup.open);
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
                    var classMarker = ($scope.cb.checked == true && station.banking == false && action == VELO_DISPO) ? 'count-icon-hidden' : ((content != 'HS' && content > 0) ? ((miniMarker)?'mini-count-icon':'count-icon') :((miniMarker)?'mini-count-icon-close':'count-icon-close'));

                    if(miniMarker){
                        marker.setIcon(L.divIcon({
                                //Style CSS of marker
                                className: classMarker,
                                //HTML value inner marker
                                //html: content,
                                // Set a markers width and height.
                                //iconSize: [40, 40]
                                iconSize: [15, 15]
                            })
                        );
                    }else{
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
            startRefresh: function () {
                Utils.log("Start Refresh methode");
                return setInterval(Stations.refreshStationsData, 30000);
            },
            stopRefresh : function(){
                Utils.log("Stop Application");
                clearInterval(timer);
            },
            resumeRefresh : function(){
                Utils.log("Resume Application");
                geolocation.startLocation();
                timer = app.startRefresh();
            }
        };

        $ionicPlatform.on('pause',app.stopRefresh);
        $ionicPlatform.on('resume',app.resumeRefresh);
        var watchPosition;
        var geolocation ={
                    inProgress : $scope.inProgress,
                    stopLocation : function(){
                        Utils.log("Stop Location");
                        watchPosition.clearWatch();
                        $scope.$apply($scope.inProgress = false);
                    },
                    onSuccess : function (position) {
                        Utils.log('Position Success');
                        if(!User.equal(position)){
                        User.position.lat = position.coords.latitude;
                        User.position.lng = position.coords.longitude;
                        if(User.marker==undefined && User.point==undefined){
                            User.marker = Marker.createUserPositionMarker();
                            User.marker.setZIndexOffset(1000);
                            User.point = Marker.createPositionPoint();
                            map.setView([User.position.lat, User.position.lng], 16);


                            setTimeout(function(){
                                $scope.toggleMainPanel();
                            },1000);

                        }else{
                            User.marker.setLatLng([User.position.lat,User.position.lng]);
                            User.marker.update();
                            User.point = undefined;
                            User.point = Marker.createPositionPoint();
                        }



                        }else{
                        geolocation.stopLocation();
                        console.log(User.position.lat + '|' + User.position.lng);
                        Stations.updatePopupStations();
                        }

                        },
                    onError : function (e) {
                    $ionicPopup.alert({
                        title: 'Error : Code '+ e.code,
                        template: e.message
                    });
                    Utils.log('Position Error');
                    Map.center(47.218371, -1.553621, 15);
                    Utils.log("Stop Location");
                    watchPosition.clearWatch();
                    $scope.$apply($scope.inProgress = false);
                },
                startLocation : function () {
                Utils.log("Start Location");
                $scope.inProgress = true;
                var watchOptions = {
                    frequency : 2000,
                    timeout : 10000,
                    enableHighAccuracy: false
                };
                watchPosition =  $cordovaGeolocation.watchPosition(watchOptions);
                watchPosition.then(null,this.onError,this.onSuccess);
            }

            };

        var Map = {
            init:function(){
                L.mapbox.accessToken = 'pk.eyJ1Ijoia2VteTk3MSIsImEiOiJNS3UwWVgwIn0.XMwOcHaSlli4iZ8dBbfbOA';

                map = L.mapbox.map('map', 'kemy971.7a67c729', {zoomControl: false, attributionControl : false}).setView([47.218371, -1.553621], 15);


                map.on('click',function(){
                    if ($scope.open) {
                        $scope.$apply($scope.toggleMainPanel());

                    }
                });

                map.on('zoomend',function(){
                    console.log(map.getZoom());
                    if(map.getZoom()<= 14 && !miniMarker){
                        miniMarker = true;
                        Stations.updateMarkerStations();
                    }else if(map.getZoom()> 14 && miniMarker){
                        miniMarker = false;
                        Stations.updateMarkerStations();
                    }
                });

            },
            center:function(lat,lng,zoom){
                map.setView([lat,lng],zoom);
            }
        };


        //Initialisation de l'application
        var startApp = function () {
            Utils.log('Starting App');

            Map.init();

            $scope.toggleMainPanel();

            $http.get('https://api.jcdecaux.com/vls/v1/stations?contract='+city[cityIndex]+ apiKey)
                .success(function (data) {

                    Utils.sort(data);
                    Stations.init(data);

                    Utils.hidden("loader-content");
                    Utils.show("starter-content");

                    geolocation.startLocation();
                    timer = app.startRefresh();
                });
        };

        //Auto-start app
        (function () {
            $http.get("../config.json")
                .success(function (data) {
                    $scope.cb.checked = data.stationCB;
                    //$scope.mesStations = data.mesStations;
                    startApp();
                })
                .error(function (e) {
                    startApp();
                });
        })();
    });

angular.element(document).ready(function () {
    var domElement = document.getElementById('starter');
    angular.bootstrap(domElement, ["starter"]);
}); 