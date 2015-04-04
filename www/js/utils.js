/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var Utils = {
    sort : function (data) {
                return data.sort(function (a, b) {
                    if (a.number < b.number)
                        return -1;
                    if (a.number > b.number)
                        return 1;
                });
            },
    log : function (message) {
                console.log('=====> ' + message);
            },
    show : function(idElement){
        //Affiche l'element de l'ID passé en parametre
        document.getElementById(idElement).style.visibility = "visible";
    },
    hidden : function(idElement){
        //Masque l'element de l'ID passé en parametre
        document.getElementById(idElement).style.visibility = "hidden";
    }
};


