// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

//Path for the image of the floor
const {ipcRenderer} = require('electron');
const L = require('leaflet');

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
    ipcRenderer.send('toMap', sfloor);
    floorSelect.style.display = "none";
    mapView.style.display = "block";
    addMapPic();
});

//Functionality for Buttons
backBtn.addEventListener('click',()=>{
    ipcRenderer.send('back-to-previous');
    home.style.display = "none";
    mapView.style.display = "none";
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

//Add Image of Map
function addMapPic(){
    //remove old floor imagepath and place newly selected floor imagepath
    if( mymap.hasLayer(imagepath)){
        mymap.removeLayer(imagepath);
    }

    switch(sfloor){
        case '0':
            imagepath = "";
        case '1':
            imagepath = "./images/floor1.svg";
        case '2':
            imagepath = "./images/floor2.svg";
        case '3':
            imagepath = "./images/floor3.svg";
    }

    if(sfloor != '' && imagepath != ''){
        console.log(imagepath);
        image = L.imageOverlay(imagepath, bounds);
        image.addTo(mymap);
    }
    else{
        console.log("Image Failed to Load");
    }

}

//Furniture Obj
function Furniture(fid, num_seats){
    this.furn_id = fid;
    this.num_seats = num_seats;
    this.seat_places = [];
    this.seat_type = 32;
    this.whiteboard = [];
    this.totalOccupants = 0;
    this.marker;
    this.modified = false;
    this.degreeOffset = 0;
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