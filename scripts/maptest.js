//Initalise events
$(document).ready(function() {
    console.log(localStorage)
    console.log('ready')

    //Apply Filter
    $("#searchbox").keyup(function (e) {
        if (e.which == 13) {
            //localeSearch()
            doGeocode()
        }
    });

    //Set Radius to search value
    $("#searchRadius")[0].value = localStorage[5]

    $("#searchRadius").on('keyup mouseup change click', () => {
        if($("#searchRadius")[0].value > 0){
            console.log("radius changed")
            latlon = L.latLng(localStorage[98],localStorage[97])
            localStorage[5] = $("#searchRadius")[0].value
            nearbySchools(latlon)
        }
    })



    //Set checkboxes to search value

    if(localStorage[2] == 1){
        $("#GovernmentCheck")[0].checked = true
    }
    else{
        $("#GovernmentCheck")[0].checked = false
    }
    if(localStorage[3] == 1){
        $("#PrivateCheck")[0].checked = true
    }
    else{
        $("#PrivateCheck")[0].checked = false
    }
    if(localStorage[4] == 1){
        $("#CatholicCheck")[0].checked = true
    }
    else{
        $("#CatholicCheck")[0].checked = false
    }

    if(localStorage[6] == 1){
        $("#LGBTchecked")[0].checked = true
    }
    else{
        $("#LGBTchecked")[0].checked = false
    }
    if(localStorage[8] == 1){
        $("#ASPEchecked")[0].checked = true
    }
    else{
        $("#ASPEchecked")[0].checked = false
    }
    if(!$("#GovernmentCheck")[0].checked && !$("#PrivateCheck")[0].checked  && !$("#CatholicCheck")[0].checked  ){
        $("#GovernmentCheck")[0].checked = true
        $("#PrivateCheck")[0].checked = true
        $("#CatholicCheck")[0].checked = true
    }

    //Check favbox
    $(document).on('change', 'input[type="checkbox"]', function(e){
        $(".favcheck").click(shortlist(e.target.id))
    });

    //Fix easyautocomplete style issue
    $('div.easy-autocomplete').removeAttr('style');

    initAutocomplete()

    //Apply initial filters
    $(document).on( "load", function() {
        $("#filterApply").click(filterMap(mymap))

    })

});



//Establish leaflet map
let mymap = L.map('mapid',{
    loadingControl: true
})
mymap.zoomControl.setPosition('bottomright');

//Build leaflet map
function buildMap(){

    //Get initial latlon
    let latlon = L.latLng()
    if(localStorage[98] == "undefined" || localStorage[98] == "undefined" ){
        latlon = L.latLng([-37.814, 144.96332])
    }else{
        latlon = L.latLng(localStorage[98],localStorage[97])
    }

    //Generate nearby schools based on initial map value
    let searchMarker = new L.marker()
    searchMarker = L.marker(latlon).addTo(mymap);
    searchMarker.bindPopup(localStorage[96])
    searchMarker.id = localStorage[96]
    searchMarker.on('click', clickMarker)

    nearbySchools(latlon)

    mymap.setView(latlon,15);
    // Load tiles
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets-basic',
        accessToken: 'pk.eyJ1Ijoiam9zenRyZWljaGVyIiwiYSI6ImNqNmJicmxtczE3ZnUydnFybWl4am94bnAifQ.AqK2Zt30_RpbcPHLatRS2A'
    }).addTo(mymap);


    //If stats enabled get LGA
    mymap.spin(true)
    if (localStorage[7] !== 0){
        loadGeoJSON(mymap)
    }
    else{
        console.log('GeoJSON disabled')
    }

    //Get school data and generate markers
    getSchoolList(mymap)
    return mymap
}

//Load LGA
function loadGeoJSON(map){

    let LGA = new L.geoJson();
    LGA.setStyle({fillColor: 'red'})

    //Get GeoJSON data on LGAs
    if (document.getElementById("bullyingChecked").checked) {
        $.getJSON("data/LGA_geojson.GeoJSON", function (data) {
            //Bind LGA to map
            $(data.features).each(function (key, data) {
                LGA.addData(data);
            })

            //Colour LGA by bullying rate
            if (document.getElementById("bullyingChecked").checked) {
                bullyingColor(LGA)
            }

            LGA.addTo(map)
        }).then(mymap.spin(false))
    }
    mymap.spin(false)
}

//Colour LGA by bullying rate
function bullyingColor(GeoJSON){
    GeoJSON.setStyle({fillColor: 'red'})
    GeoJSON.eachLayer(function(layer) {
        layer.setStyle({fillColor: getColor(layer.feature.properties.Indicator)})
            .bindPopup('Bullying rate: ' + layer.feature.properties.Indicator )
    })
}


// get color depending on bulling proportion value
function getColor(d) {
    if(d < 12.5){
        return '#34ff00'
    }
    else if(d >= 12.5 && d < 17.5){
        return '#fdff00'
    }
    else{
        return '#ff001b'
    }
}




//Get school and add marker
function getSchoolList(map) {
    $.getJSON("data/schoolList.json", function(json) {
        addSchoolMarkers(json, map)
    })
}

//Add marker
function addSchoolMarkers(data, map){


    var markers = L.markerClusterGroup({
        animateAddingMarkers : true,
        removeOutsideVisibleBounds: true,
        disableClusteringAtZoom: 15
    });
    var markersList = [];

    let addmarker = (data) => {
        let icon = getIcon(data)
        let latlon = L.latLng(data.Latitude,data.Longitude)
        var marker = L.marker(latlon,{icon: icon})
        marker.properties = data
        marker.on('click',clickSchool)
        markersList.push(marker)
        markers.addLayer(marker)
        markers.bind
    }

    //Only add primary schools
    for(i = 0; i < data.length; i++){
        if(data[i].Type.includes("Pri")){
            if(sectorEnabled(data[i])){
                addmarker(data[i])
            }
        }
     }

    map.addLayer(markers)

}

//Define marker
let getIcon = (data) => {

    if(localStorage[6] == 1 && (data.LGBT=="Y")) { //LGBT badge
        switch (data.Sector) {
            case "Government":
                var icon = L.icon({
                    iconUrl: "http://www.eduwell.ga/EduWell/icons/icons8-Govt2-LGBT.png"
                })
                break
            case "Independent":
                var icon = L.icon({
                    iconUrl: "http://www.eduwell.ga/EduWell/icons/icons8-Private-LGBT.png"
                })
                break
            case "Catholic":
                var icon = L.icon({
                    iconUrl: "http://www.eduwell.ga/EduWell/icons/icons8-Catholic-LGBT.png"
                })
                break
            default:
                var icon = L.icon({
                    iconUrl: "http://www.eduwell.ga/EduWell/icons/icons8-Govt-LGBT.png"
                })
        }
    }
    else if(localStorage[8] == 1 && (data.AS_Phys)){ //After School Phys Ed
        switch(data.Sector){
            case "Government":
                var icon = L.icon({
                    iconUrl: "http://www.eduwell.ga/EduWell/icons/icons8-Govt-ASPE.png"
                })
                break
            case "Independent":
                var icon = L.icon({
                    iconUrl: "http://www.eduwell.ga/EduWell/icons/icons8-Private-ASPE.png"
                })
                break
            case "Catholic":
                var icon = L.icon({
                    iconUrl: "http://www.eduwell.ga/EduWell/icons/icons8-Catholic-ASPE.png"
                })
                break
            default:
                var icon = L.icon({
                    iconUrl: "icons/icons8-Govt.png"
                })
        }
    }else{
        switch(data.Sector){ //Default Badge
            case "Government":
                var icon = L.icon({
                    iconUrl: "http://www.eduwell.ga/EduWell/icons/icons8-Govt2.png"
                })
                break
            case "Independent":
                var icon = L.icon({
                    iconUrl: "http://www.eduwell.ga/EduWell/icons/icons8-Private.png"
                })
                break
            case "Catholic":
                var icon = L.icon({
                    iconUrl: "http://www.eduwell.ga/EduWell/icons/icons8-Catholic.png"
                })
                break
            default:
                var icon = L.icon({
                    iconUrl: "http://www.eduwell.ga/EduWell/icons/icons8-Govt.png"
                })
        }
    }

    icon.options.iconSize = [data.total_scaled,data.total_scaled]; //Size by students enrolled
    icon.options.className = "leafletIcon";
    return icon
}

// //Configure easy complete search bar
// function defineSearch(){
//     var options = {
//         url: "data/localities.json",
//
//         getValue: "SearchName",
//
//         list: {
//             match: {
//                 enabled: true
//             }
//         }
//     };
//
//     $("#searchbox").easyAutocomplete(options);
// }

//Initialise map and search
mymap = buildMap()
// defineSearch()





//Click school event get school info
function clickSchool(e) {

    //Get properties
    let props = e;
    if (!(props.target == undefined || props.target == null )){
        props = e.target.properties
    }


    //Mark as selected
    // let selected = new L.icon({iconUrl: 'icons/icons8-Checkmark-48.png'})

    let checkbox = ""

    //Generate appropriate checkbox
    if(inShortList(props.School_Id)){
        // shortlist(props.School_Id)
        checkbox = "<input class='favcheck' type='checkbox' id='" +
        props.School_Id + "'checked>"
    }else {
        checkbox = "<input class='favcheck' type='checkbox' id='" +
            props.School_Id + "'>"
    }


    document.getElementById("selectedSchool").style.height = "auto";

    let Address = props.Address1
        + props.Address2 + ", " +
        props.Town + " " + props.PPostcode
    console.log(Address)
    let streetView_imgURL = "https://maps.googleapis.com/maps/api/streetview?size=600x300&location=" +
        props.School_Name + "," + Address + "&key=AIzaSyDL8mL_M5dy0iux97ExLt8gRrj_NNtbmII";

    //set school type icon
    let schoolType_icon = ""
    if(props.Sector == "Government"){schoolType_icon = "<img src='icons/icons8-Govt2.png' style='height: 20px'>"}
    if(props.Sector == "Catholic"){schoolType_icon = "<img src='icons/icons8-Catholic.png' style='height: 20px'>"}
    if(props.Sector == "Independent"){schoolType_icon = "<img src='icons/icons8-Private.png' style='height: 20px'>"}

    document.getElementById("selectedSchool").innerHTML = (props ?
        "<div style='width: 100%; padding-right: 5px;display: block; position: relative;'>" +
        "<img style='width:100%;' id='streetviewImg' src='"
        + streetView_imgURL + "'>" +
        "<span id='streetviewInfo'>click image for streetview</span><div class='favbox'><span class='addShortList'>Add to short list</span>" + checkbox + "</div>" +
        '<h3>' + props.School_Name + '</h3>' +
        '<i>' + Address + "</i><br>"
        + '<br>' + props.Phone + "<br>"
        + "<a class='smalllink' href='" + props.web + "'>" + props.web + "</a><br>"
        + "<br><br><b>School Type: </b>" + schoolType_icon + " " + props.Sector
        + "<br><b>Students enrolled: </b>" + parseInt(props.Total) + "<br>" +
        "<b>Buildings: </b>" + getBuildings(props) + "<br>" +
        "<b>Total building area: </b>" + getFloorArea(props) + "<br>"
        + "<b>Average Annual Investment: </b> " + getInvest(props) + "<br>"
        + "<br><h4>Special Programs:</h4>" + isLGBT(props) + isASPE(props) + isNone(props)
        : '<h4>Click a school to see info</h4>')


    //Find nearby schools to clicked school
    nearbySchools(L.latLng(props.Latitude, props.Longitude))
    $("#showSchoolBlock").animate({ scrollTop: 0 }, 100);

    $('#streetviewImg').click(function(){
        modal.style.display = "block";
        modalImg.src = this.src;
        captionText.innerHTML = this.alt;
    })

    $('#streetviewInfo').click(function(){
        modal.style.display = "block";
        modalImg.src = this.src;
        captionText.innerHTML = this.alt;
    })

    // Geocode the address
    let geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'address': (props.School_Name + "," + Address),
        region: 'VIC, Aus',
        componentRestrictions: {country:'AU'}
    }, (results) =>{
        initializeStreetView(results[0].geometry.location.lat(), results[0].geometry.location.lng())
    })




}

//Click school event get school info
function clickMarker (e) {

    //Get properties
    let Id = e.target.id;

    //Mark as selected
    let checkbox = ""

    document.getElementById("selectedSchool").style.height = "150px";

    document.getElementById("selectedSchool").innerHTML = "<h3>" + Id + "</h3>"

    //Find nearby schools to clicked school
    // nearbySchools(L.latLng(props.Latitude, props.Longitude))
}


//Find nearby schools to specified area
function nearbySchools(latlon){
    let area = latlon //Area from which nearby schools is measured
    let threshold = localStorage[5]*1000 //Threshold for distance to travel
    //default to 3000 if invalid
    if(threshold == undefined || threshold < 1000 || threshold > 10000){
        threshold = 3000
    }
    let nearbySchools = []
    $.getJSON("data/schoolList.json", function(json) {
        json.map((item) =>{
            let schoolLoc = L.latLng(item.Latitude,item.Longitude)
            let distance = area.distanceTo(schoolLoc)
            if(distance < threshold && distance > 0){

                item.distance = distance
                if(sectorEnabled(item)){
                    nearbySchools.push(item)
                }
            }
        })

        nearbySchools.sort(function(a, b) {
            return parseFloat(a.distance) - parseFloat(b.distance);
        });
        document.getElementById('schoolDisplay').innerHTML = ""
        nearbySchools.map((school) => {

            let schoolData = school
            let checkbox = ""
            //Check if school is in shortlist
            if(inShortList(school.School_Id)){
                checkbox = "<input class='favcheck' type='checkbox' id='" +
                    school.School_Id + "'checked>"
            }else {
                checkbox = "<input class='favcheck' type='checkbox' id='" +
                    school.School_Id + "'>"
            }

            //Define icon
            let schoolType_icon = ""
            if(school.Sector == "Government"){schoolType_icon = "<img src='icons/icons8-Govt2.png' style='height: 20px'>"}
            if(school.Sector == "Catholic"){schoolType_icon = "<img src='icons/icons8-Catholic.png' style='height: 20px'>"}
            if(school.Sector == "Independent"){schoolType_icon = "<img src='icons/icons8-Private.png' style='height: 20px'>"}


            document.getElementById('schoolDisplay').innerHTML += "<div class='schoolListEntry' id='"+ school.School_Id + "'> " +
                "<div class='favbox'><span class='addShortList'>Add to shortlist</span>" + checkbox + "</div><h4 id=" + school.School_Id + ">"
                + school.School_Name + "</h4>" +
                '<span id=\'info\'><i>' + school.Address1
                + school.Address2 + ", " +
                school.Town + " " + school.PPostcode
                + "</i><br><br><b>Distance: </b>" + (school.distance/1000).toFixed(2) + "km"
                + "<br><b>School Type: </b>" + schoolType_icon + school.Sector
                + "</span></div>";


            // $("#" + school.School_Id)[0].data = school.Latitude
            // $("#" + school.School_Id).data += school.Longitude


            //Focus school on click
            $(".schoolListEntry").hover( function(e) {
                hoverNearbySchool(e)
            })

            $(".schoolListEntry").click( function(e) {
                clickNearbySchool(e)
            })
        })
    })
}



//Activate Search
let searchMarker = new  L.marker()
// function localeSearch(){
//     mymap.removeLayer(searchMarker)
//     document.getElementById('searcherror').innerHTML = ""
//     let query = document.getElementById('searchbox').value;
//     $.getJSON("data/localities.json", function(json) {
//         let x = 0
//         json.map((item) =>{
//             if(item.SearchName == query){
//                 x = 1
//                 let searchLocale2 = L.latLng(item.Lat, item.Lon)
//                 localStorage[5] = $("#searchRadius")[0].value
//                 if(searchLocale2.Lat !== "undefined"){
//                     searchMarker = L.marker(searchLocale2).addTo(mymap);
//                     searchMarker.bindPopup(item.SearchName)
//                     searchMarker.id = query
//                     searchMarker.on('click', clickMarker)
//                     document.getElementById("selectedSchool").style.height = "15%";
//                     document.getElementById("schoolDisplay").style.height = "85%";
//                     document.getElementById("selectedSchool").innerHTML = '<h3>' + item.SearchName + '</h3>'
//                     mymap.setView(searchLocale2,13);
//                     nearbySchools(searchLocale2)
//                     localStorage[98] = item.Lat
//                     localStorage[97] = item.Lon
//                     return x
//                 }
//             }
//         return x
//         })
//         if(x == 0){
//             document.getElementById('searcherror').innerHTML = "Please enter a valid locality"
//             console.log("Invalid Query")
//         }else if(document.getElementById('searchRadius').value < 1 || document.getElementById('searchRadius').value > 10){
//             document.getElementById('searcherror').innerHTML = "Please enter a distance between 1-10km"
//         }else{
//             console.log("Valid Query")
//
//         }
//     })
// }




//Run filters
function filterMap(map) {
    let error = document.getElementById("error")
    let govt = document.getElementById("GovernmentCheck").checked
    let private = document.getElementById("PrivateCheck").checked
    let catholic = document.getElementById("CatholicCheck").checked
    let LGBT = document.getElementById("LGBTchecked").checked
    let ASPE = document.getElementById("ASPEchecked").checked
    let Bullying = document.getElementById("bullyingChecked").checked

    error.innerHTML = ""

    if(!govt && !private && !catholic){
        console.log("Click a school")
        error.innerHTML = "Please select at least one school type"
    }
    else{
        if(govt){
            localStorage[2] = true
        }
        if(private){
            localStorage[3] = true
        }
        if(catholic){
            localStorage[4] = true
        }
        if(LGBT){
            localStorage[6] = 1
        }
        if(ASPE){
            localStorage[8] = 1
        }
        else{
            localStorage[6] = 0
        }
        if(Bullying){
            localStorage[7] = 1
        }
        mymap.eachLayer(function (layer) {
            mymap.removeLayer(layer);
        });
        buildMap()
    }
}

//Filter Checks

function sectorEnabled(item){
    if(item.Sector == "Government" && document.getElementById("GovernmentCheck").checked){
        return true
    }
    else if(item.Sector == "Independent" && document.getElementById("PrivateCheck").checked){
        return true
    }
    else if(item.Sector == "Catholic" && document.getElementById("CatholicCheck").checked){
        return true
    }
    else{
        false
    }
}

function getInvest(props){
    if(parseInt(props.Investment) > 1){
        return "$" + props.Investment
    }
    else{
        return "Not Available"
    }
}

function getBuildings(props){
    if(props.BuildingNumber > 1){
        return parseInt(props.BuildingNumber)
    }
    else{
        return "Not Available"
    }
}

function getFloorArea(props) {
    if(props.FloorArea > 1){
        return parseInt(props.FloorArea) + "m<sup>2</sup>"
    }
    else{
        return "Not Available"
    }
}

let isLGBT = (props) => {
    if(props.LGBT == "Y"){
        return "<img src='http://www.eduwell.ga/EduWell/icons/icons8-LGBT%20Flag-48.png' height='30'> Safe Schools (LGBTA support) <br>";
    }
    else{
        return ""
    }
}

function isASPE(props) {
    if(props.AS_Phys){
        return "<img src='http://www.eduwell.ga/EduWell/icons/icons8-Exercise-48.png' height='30'> After-school Physical Activity <br>";
    }else{
        return ""
    }

}

function isNone(props){
    if((props.LGBT == "N") && !(props.AS_Phys)){
        return "None Available"
    }else{
        return ""
    }
}

//Shortlist WILL REPLACE FAV LIST

let Shortlist = []

function shortlist(schoolID) {

    //Add or remove shortlist
    if(!inShortList(schoolID)){
        Shortlist.push(schoolID)
    }
    else{
        removeShortList(schoolID)
    }

    //Define selected schools list
    let favNum = Shortlist.length
    document.getElementById('numToCompare').innerHTML = favNum;
    document.getElementById('selectedSchools').innerHTML = "";

    let favNames = []
    Shortlist.map((e)=>{
        $.getJSON("data/schoolList.json", function(json) {
            json.map((school) => {
                if(school.School_Id == e){
                    favNames.push(school.School_Name)
                }
                return(favNames)
            })
            return(favNames)
        }).then(() =>{
            document.getElementById('selectedSchools').innerHTML = "";
            for(i = 0; i < favNames.length; i++){
                document.getElementById('selectedSchools').innerHTML += "<li>" + favNames[i] + "</li>";
            }
        })
    })
}

//Fetch IDs for schools in which compare is checked
function compare(){

    if(Shortlist.length < 2){
        $("#compare_error")[0].innerHTML = "Select at least 2 schools to compare"
    }
    else{
        localStorage[100] = Shortlist.length
        for(i in Shortlist){
            localStorage[i] = Shortlist[i]
        }
        window.location.href = 'comparison.html';
        return Shortlist
    }
}

function inShortList(schoolID){
    let x = 0

    if(Shortlist.length > 0){
        for(let i = 0; i < Shortlist.length; i++){
            if(Shortlist[i] == schoolID){
                x += 1
            }
        }
        if(x > 0){
            return true
        }
        else{
            return false
        }
    }
    else{
        console.log('Shortlist Empty')
        return false
    }
    console.log(x)
}

function removeShortList(SchoolID){
    $('#' + SchoolID)[0].checked = false
    Shortlist = Shortlist.filter(function(item) {
        return item !== SchoolID
    })
}

var autocomplete;
function initAutocomplete() {
    var southWest = new google.maps.LatLng( -39.0777905,148.8913944);
    var northEast = new google.maps.LatLng( -34.0061134,140.9758421);
    var vicBounds = new google.maps.LatLngBounds( southWest, northEast )
    autocomplete = new google.maps.places.Autocomplete(
        /** @type {HTMLInputElement} */(document.getElementById('searchbox')),
        { types: ['geocode'],
            componentRestrictions: {country:'AU'}
        });
    google.maps.event.addListener(autocomplete, 'place_changed', function() {
    });
    console.log('Autocomplete Activated')
}



function doGeocode() {
    var addr = document.getElementById("searchbox");
    // Get geocoder instance
    var geocoder = new google.maps.Geocoder();

    // Geocode the address
    geocoder.geocode({
        'address': addr.value,
        region: 'VIC, Aus',
        componentRestrictions: {country:'AU'}
    }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK && results.length > 0) {

            // set it to the correct, formatted address if it's valid
            // addr.value = results[0].formatted_address;;

            lat = results[0].geometry.location.lat()
            lon = results[0].geometry.location.lng()
            console.log(lat)
            console.log(lon)

            //Set bounds to victoria
            if(lon > 150.718821 || lon < 140.6568968 || lat > -33.8030981 || lat < -39.0317517){
                console.log("Invalid Query")
                document.getElementById('searcherror').innerHTML = "Please enter a valid location"
                return
            }else{
                document.getElementById('searcherror').innerHTML = ""
                console.log("Valid Query")
                console.log(addr)
                console.log(status)
                console.log(results[0])
                console.log('search success')
                let searchLocale2 = L.latLng(lat, lon)
                localStorage[5] = $("#searchRadius")[0].value
                searchMarker = L.marker(searchLocale2).addTo(mymap);
                searchMarker.bindPopup(addr.value)
                document.getElementById("selectedSchool").style.height = "15%";
                document.getElementById("schoolDisplay").style.height = "85%";
                document.getElementById("selectedSchool").innerHTML = '<h3>' + addr.value + '</h3>'
                mymap.setView(searchLocale2,15);
                nearbySchools(searchLocale2)
                localStorage[98] = lat
                localStorage[97] = lon
            }



            //https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=YOUR_API_KEY
            // show an error if it's not
        } else {
            document.getElementById('searcherror').innerHTML = "Please enter a valid locality"
            console.log("Invalid Query")
        }
    });
};

function clickNearbySchool(e){
    let id = e.currentTarget.id
    $.getJSON("data/schoolList.json", function(json) {
        school = json.filter((data) => {
            return data.School_Id == id
        })
        let latlon = L.latLng(school[0].Latitude, school[0].Longitude)
        mymap.setView(latlon,15)

        mymap.eachLayer((layer) => {
            if(!(layer.properties == undefined || layer.properties == null)){

                // console.log(layer.properties.School_Id)
                if(layer.properties.School_Id == id){
                    let latlon = L.latLng(layer.properties.Latitude, layer.properties.Longitude)
                    mymap.setView(latlon,15)
                    layer._icon.focus()
                    clickSchool(layer.properties)
                    $("#showSchoolBlock").animate({ scrollTop: 0 }, 100);
                    return
                }
            }

        } )
    })
}

function hoverNearbySchool(e) {
    let id = e.currentTarget.id

        mymap.eachLayer((layer) => {
            if(!(layer.properties == undefined || layer.properties == null)){

                // console.log(layer.properties.School_Id)
                if(layer.properties.School_Id == id){
                    layer._icon.focus()
                    return
                }
            }

        })
}


mymap.spin(false)



/// Ziyans Streetview Modal

var modal = document.getElementById('myModal');

var img = document.getElementById('streetviewImg');
var modalImg = document.getElementById("pano");
var captionText = document.getElementById("caption");

// img.onclick = function(){
//     modal.style.display = "block";
//     modalImg.src = this.src;
//     captionText.innerHTML = this.alt;
// }

// get <span> ,set close button
var span = document.getElementsByClassName("close")[0];

// when clicj(x), close window
span.onclick = function() {
    modal.style.display = "none";
}

//Exit modal on outside click
$('#modalback').click(()=>{
    modal.style.display = "none";

})

function initializeStreetView(lat, lon) {
    document.getElementById('pano').innerHTML = " "
    var latlon = {lat: lat, lng: lon};
    var map = new google.maps.Map(document.getElementById('map'), {
        center: latlon,
        zoom: 14
    });
    var panorama = new google.maps.StreetViewPanorama(
        document.getElementById('pano'), {
            position: latlon,
            pov: {
                heading: 34,
                pitch: 10
            }
        });
    map.setStreetView(panorama);
}








