// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

//Path for the image of the floor
const {ipcRenderer} = require('electron');
var L = require('leaflet');

//local dependencies
require('./mapscripts/map_helpers.js');
require('./mapscripts/makerinPoly.js');

var imagepath = "";
var sfloor = "";


//Form References
const getNameForm = document.getElementById('ipcNameForm');

//Div References
const home = document.getElementById('home');
const floorSelect = document.getElementById('floorSelect');
const mapView = document.getElementById('mapView');

//Button References
const backBtn = document.getElementById('backBtn');
const surveyBtn = document.getElementById('surveyBtn');
const floorBtn = document.getElementById('submitFloor');


//Process Surveyors Name
getNameForm.addEventListener('submit', function (event){
    event.preventDefault() // stop the form from submitting
    let firstname = document.getElementById("fname").value;
    let lastname = document.getElementById("lname").value;
    let sname = firstname + " " + lastname;
    ipcRenderer.send('toMain', sname);
    getNameForm.style.display = "none";
    home.style.display = 'block';
});


//Add Floor to Global JSON
floorBtn.addEventListener('click', function (event){
    event.preventDefault() // stop the form from submitting
    sfloor = document.getElementById("floor").value;
    
    mapView.style.display = "block";
    addMapPic();
    //Add Furniture After Adding Items

});

//Functionality for Buttons
backBtn.addEventListener('click',()=>{
    ipcRenderer.send('back-to-previous');
    home.style.display = "none";
    mapView.style.display = "none";
    floorSelect.style.display = "none";
    getNameForm.style.display = "block";
});

surveyBtn.addEventListener('click',()=>{
    floorSelect.style.display = "block";
});



//All Map functions:
//Initalize Map
var mymap = L.map('MapContainer', {crs: L.CRS.Simple, minZoom: 0, maxZoom: 4});
var furnitureLayer = L.layerGroup().addTo(mymap);
var areaLayer = L.layerGroup().addTo(mymap);
var drawnItems = new L.FeatureGroup();
var bounds = [[0,0], [360,550]];
mymap.fitBounds(bounds);

//map image
var image;

var furnMap = new Map();
var activityMap = new Map();
var wb_activityMap = new Map();
var areaMap = new Map();

//Max Interactible Boundaries
var latMax = 359.75;
var latMin = -0.5;
var longMax = 508.18;
var longMin = 42.18;

//container for furniture objects
var furnMap = new Map();
var mapKey = 0;


//create a container for areas
var areaMap = new Map();

//Furniture Obj
function Furniture(fid, num_seats){
    this.furn_id = fid;
    this.num_seats = num_seats;
    this.seat_places = [];
    this.seat_type = 32;
    this.whiteboard = [];
    this.total_occupants = 0;
    this.marker;
    this.modified = false;
    this.degree_offset = 0;
    this.x;
    this.y;
    this.ftype;
}

//Seat Obj
function Seat(seatPos){
    this.seatPos = seatPos;
    //this.type = type;
    this.activity = [];
    this.occupied = false;
}

//pass information from the layout to build the markers after loading layout file
function build_markers(furnitureArray){

    //define array of furniture to build markers from based on passed layout ID
    for(var i in furnitureArray){

        //prebuild furniture array in the form of furniture objects to add to the map

        var key = furnitureArray[i];
        console.log(key);
        var furn_id = key.furn_id;

        var num_seats = parseInt(key.num_seats);
        //var newFurn = new Furniture(furn_id, num_seats);

        var x = key.x;
        var y = key.y;
        var degree_offset = key.degree_offset;
        var furniture_type = key.ftype;
        var seat_type = key.seat_type;

        var latlng = [y,x];
        area_id = "TBD";

        //parse furniture type to an int, then get the correct icon
        var type =  parseInt(furniture_type);
        var sicon = getIconObj(type);
        console.log(sicon);

        
        //place a marker for each furniture item
        marker = L.marker(latlng, {
            icon: sicon,
            rotationAngle: degree_offset,
            rotationOrigin: "center",
            draggable: false,
            ftype: furniture_type,
            numSeats: num_seats,
            fid: furn_id.toString()
        }).addTo(furnitureLayer);
        

        //TODO: Implement Popup
        /*.bindPopup(popup, popupDim);*/

        //make marker clickable
        marker.on('click', markerClick);
        marker.setOpacity(.3);

        //update marker coords when a user stops dragging the marker, set to furniture object to indicate modified
        marker.on("dragend", function(e){
            selected_furn.modified = true;
            latlng =  e.target.getLatLng();

            selected_furn.latlng = latlng;
            y = latlng.lat;
            x = latlng.lng;
            area_id="TBD";
            selected_furn.y = y;
            selected_furn.x = x;
            areaMap.forEach(function(jtem, key, mapObj){
                
                if(isMarkerInsidePolygon(y,x, jtem.polyArea)){
                    area_id = jtem.area_id;
                }
            });
            if(area_id !== "TBD"){
                selected_furn.in_area = area_id;
            }
        });

        //add furniture to the datamap to capture input information from data
        furnMap.set(furn_id.toString(), newFurn);

    }
}

//Add Image of Map to div
function addMapPic(){
    //remove old floor imagepath and place newly selected floor imagepath
    if( mymap.hasLayer(image)){
        mymap.removeLayer(image);
    }

    sfloor = parseInt(sfloor);

    switch(sfloor){
        case 0:
            imagepath = "";
            break;
        case 1:
            imagepath = "./images/floor1.svg";
            break;
        case 2:
            imagepath = "./images/floor2.svg";
            break;
        case 3:
            imagepath = "./images/floor3.svg";
            break;
    }

    if(sfloor != '' && imagepath != ''){
        console.log(imagepath);
        image = L.imageOverlay(imagepath, bounds);
        image.addTo(mymap);

        //load furniture after image depending on selected layout.
        //Prebuild Layout in CSV File to JSON
        //TODO: implement Layout

        //Test furniture piece
        let test_furn_array = [];
        let test_furn_1 = new Furniture(1, 2);
        test_furn_1.x = 50;
        test_furn_1.y = 50;
        test_furn_1.ftype = 33;
        test_furn_array.push(test_furn_1);
        build_markers(test_furn_array);


    }
    else{
        console.log("Image Failed to Load");
    }

}







