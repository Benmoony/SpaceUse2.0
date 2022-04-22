// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

//Path for the image of the floor
const {ipcRenderer} = require('electron');
const global = require('./global.js');
var L = require('leaflet');
const { selectors } = require('sizzle');


//Form References
const getNameForm = document.getElementById('ipcNameForm');

//Div References
const home = document.getElementById('home');
const floorSelect = document.getElementById('floorSelect');
const surveyFloorSelect = document.getElementById('surveyFloorSelect');
const mapView = document.getElementById('mapView');
const multimenu = document.getElementById('msurveySelect');
const msurveyFloorSelect = document.getElementById('msurveyFloorSelect');

//Button References
const backBtn = document.getElementById('backBtn');
const surveyBtn = document.getElementById('surveyBtn');
const saveFloor = document.getElementById('saveFloor');
const saveSurvey = document.getElementById('saveSurvey');
const loadSurvey = document.getElementById('loadSurveyBtn');
const showMultiSurvey = document.getElementById('loadMultipleSurvey');
const msurvey = document.getElementById('msurvey');
const dsurvey = document.getElementById('dsurvey');


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
    surveyFloorSelect.style.display = "none";
    msurveyFloorSelect.style.display = "none";
    multimenu.style.display = "none";
    surveyBtn.disabled = false;
    loadSurvey.disabled = false;
    getNameForm.style.display = "block";
    document.getElementById("surveyData").style.display = "none";
    isSurvey = false;
    isMulti = false;
});

surveyBtn.addEventListener('click',()=>{
    //Load Layout from here
    ipcRenderer.send('LoadLayout');
    
});

loadSurvey.addEventListener('click',()=>{
    ipcRenderer.send('LoadSurvey');
    
});

ipcRenderer.on('LoadSurveySuccess', function(event, data){
    global.survey = data;
    //process Survey data here from csv to JSON
    surveyFloorSelect.style.display = "block";
    surveyBtn.disabled = true;
});

//Render Functions for Multi Survey
showMultiSurvey.addEventListener('click',()=>{
    surveyBtn.disabled = true;
    multimenu.style.display = "block";
});

msurvey.addEventListener('click', ()=>{
    //determine if the user selected multi or directory
    //call loadMultipleSurvey passing the upload type
    ipcRenderer.send('LoadMultipleSurvey');
});

dsurvey.addEventListener('click', ()=>{
    //determine if the user selected multi or directory
    //call loadMultipleSurvey passing the upload type
    ipcRenderer.send('LoadDirectory');
});

ipcRenderer.on('LoadDirectorySurveySuccess', function(event, data){
    global.survey = data;
    surveyBtn.disabled = true;
    msurveyFloorSelect.style.display = "block";
    
});

ipcRenderer.on('LoadMultiSurveySuccess', function(event, data){
    global.survey = data;
    surveyBtn.disabled = true;
    msurveyFloorSelect.style.display = "block";
});



ipcRenderer.on('LoadLayoutSuccess', function(event, data){
    global.layout = data;
    //process layout data here from csv to JSON
    floorSelect.style.display = "block";
    loadSurvey.disabled = true;
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
    surveyFloorSelect.style.display = "none";
    multimenu.style.display = "none";
    getNameForm.style.display = "block";
    loadSurvey.disabled = false;
    surveyBtn.disabled = false;
    isMulti = false;
    isSurvey = false;
});

    











