// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

//Path for the image of the floor
const image;

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
    let sfloor = document.getElementById("floor").value;
    ipcRenderer.send('toMap', sfloor);
    floorSelect.style.display = "none";
    mapView.style.display = "block";
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
var mymap = L.map('mapid', {crs: L.CRS.Simple, minZoom: 0, maxZoom: 4});
var furnitureLayer = L.layerGroup().addTo(mymap);
var areaLayer = L.layerGroup().addTo(mymap);
var drawnItems = new L.FeatureGroup();
var bounds = [[0,0], [360,550]];
mymap.fitBounds(bounds);

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
    //remove old floor image and place newly selected floor image
    if( mymap.hasLayer(image)){
        mymap.removeLayer(image);
    }

    //Get Floor ID here
    floor_id_selection = form_info.value;

}

function Furniture(id,ftype, latlng, fname, roomName, roomId){
    this.id = id;
    this.fname = fname;
    this.marker;
    this.degreeOffset = 0;
    this.x = latlng.lng;
    this.y = latlng.lat;
    this.ftype = ftype;
    this.roomName = roomName;
    this.roomId = roomId;
}