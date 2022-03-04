// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

//Path for the image of the floor
const {ipcRenderer, ipcMain} = require('electron');
const global = require('./global.js');
var L = require('leaflet');


//Form References
const getNameForm = document.getElementById('ipcNameForm');

//Div References
const home = document.getElementById('home');
const floorSelect = document.getElementById('floorSelect');
const mapView = document.getElementById('mapView');

//Button References
const backBtn = document.getElementById('backBtn');
const surveyBtn = document.getElementById('surveyBtn');
const saveFloor = document.getElementById('saveFloor');
const saveSurvey = document.getElementById('saveSurvey');

var layout = "";


//TODO: USE EVENT BUBBLING on the MAP VIEW ID to ensure events are handled on Dynamically created objects
//When click specific button in the div, use a certain function

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

//Functionality for Buttons
backBtn.addEventListener('click',()=>{
    ipcRenderer.send('back-to-previous');
    home.style.display = "none";
    mapView.style.display = "none";
    floorSelect.style.display = "none";
    getNameForm.style.display = "block";
});

surveyBtn.addEventListener('click',()=>{

    //Load Layout from here
    ipcRenderer.send('LoadLayout');
});

ipcRenderer.on('LoadLayoutSuccess', function(event, data){
    global.layout = data;
    //process layout data here from csv to JSON
    floorSelect.style.display = "block";
});

//Disable Submit Survey Button by Default.
//Enable Button after saving first floor to data
saveFloor.addEventListener('click', ()=>{
    ipcRenderer.send('SaveFurniture', furnMap, sfloor);
    alert('Floor ' + sfloor + ' saved!');
});

saveSurvey.addEventListener('click', ()=>{
    ipcRenderer.send('SaveSurvey');
});

ipcRenderer.on('SaveSuccess', ()=>{
    alert('File Saved');
    home.style.display = "none";
    mapView.style.display = "none";
    floorSelect.style.display = "none";
    getNameForm.style.display = "block";
});

    











