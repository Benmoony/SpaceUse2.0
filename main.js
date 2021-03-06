// Modules to control application life and create native browser window
const { app, Tray, BrowserWindow, Menu, dialog, ipcMain, globalShortcut} = require('electron');
const csv = require('csv-parser');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');
const global = require('./global.js');
const { timeEnd } = require('console');
const { resourceLimits } = require('worker_threads');

//Script for Deploying exe: npx electron-packager D:\GitHub\SpaceUse2.0 SpaceUse --platform=win32 --arch=x64     
//Global reference to the window object to prevent it being closed automatically when the JavaScript object is garbage collected
let win;

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      nodeIntegrationInSubFrames: true,
      contextIsolation: false,

      //preload: path.join(__dirname, 'preload.js')
    }
  })

  
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  win = mainWindow;
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  mainWindow.on('close', (e) => {
    var choice = require('electron').dialog.showMessageBox(this,
      {
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: 'Are you sure you want to quit?'
     });
     if(choice == 1){
       e.preventDefault();
     }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


ipcMain.on('toMain', function(event, sname){

  
  //Store the Surveyor's name in the global Array
  let Surveyor = {'Surveyor': sname};
  global.shared.surveyArray.push(Surveyor);
  let f1 = {'Floor One': []};
  let f2 = {'Floor Two': []};
  let f3 = {'Floor Three': []};
  let a = {'Areas': []};
  global.shared.surveyArray.push(f1);
  global.shared.surveyArray.push(f2);
  global.shared.surveyArray.push(f3);
  global.shared.surveyArray.push(a);
  //Navigate to the homepage
  let date = new Date();
  let TimeStart = {'Time Start': date};
  global.shared.surveyArray.push(TimeStart);
  console.log("Displaying Home " + sname);
});

ipcMain.on('back-to-previous',()=>{
  global.shared.surveyArray.length = 0;
  global.shared.layout.length = 0;
  global.shared.survey.length = 0;
  global.shared.createLayout.length = 0;
  console.log("Memory Cleared, type name again");
});

ipcMain.on('SaveFurniture', function(event, furnMap, sfloor){
  
  console.log("Saving Furn Map on floor: " + sfloor);
  var curfloor = "";

  switch(sfloor){
    case 1: curfloor = "Floor One"; break;
    case 2: curfloor = "Floor Two"; break;
    case 3: curfloor = "Floor Three"; break;
  }
  //get floor data from furn map

  let floorFurn = mapToObj(furnMap);

  global.shared.surveyArray[sfloor][curfloor] = floorFurn;
});

ipcMain.on('layoutCreate', function(event){
  let Layout = {'Layout': true};
  global.shared.createLayout.push(Layout);

  let f1 = {'Floor 1': []};
  let f2 = {'Floor 2': []};
  let f3 = {'Floor 3': []};
  global.shared.createLayout.push(f1);
  global.shared.createLayout.push(f2);
  global.shared.createLayout.push(f3);
});

ipcMain.on('SaveLayoutFloor', function(event, furnMap, sfloor){
  console.log("Saving Furn Map on floor: " + sfloor);
  var curfloor = "";

  switch(sfloor){
    case 1: curfloor = "Floor 1"; break;
    case 2: curfloor = "Floor 2"; break;
    case 3: curfloor = "Floor 3"; break;
  }

  //floordata from furn map
  for(let [key, value] of furnMap){
    let furnString = "";
    let num_seats = parseInt(value.num_seats);

    furnString = {
      "fid": value.furn_id,
      "num_seats": num_seats,
      "x": value.x,
      "y": value.y,
      "ftype": value.ftype,
      "degree_offset": value.degree_offset
    };

    global.shared.createLayout[sfloor][curfloor].push(furnString);
  }

});

ipcMain.on('SaveLayout', ()=>{
  
  let data = global.shared.createLayout;
  let areadata = global.shared.areadata;
  let toconvert = { 
    "Layout": true,
    "Floor 1": data[1]["Floor 1"],
    "Floor 2": data[2]["Floor 2"],
    "Floor 3": data[3]["Floor 3"],
    "Areas": areadata["Areas"]
  }

  let jsonObject = JSON.stringify(toconvert);
  let dpath = './Layouts/' + "NewLayout" + '.json'

  dialog.showSaveDialog({
    title: 'Select the File Path to save',
    defaultPath: path.join(__dirname, dpath),
    buttonLabel: 'Save',
    filters: [
      {
        name: 'Text Files',
        extensions: ['json']
      }
    ],
    properties: []
  }).then(file => {
    if (!file.canceled) {
      console.log(file.filePath.toString());
        
      // Creating and Writing to the sample.txt file
      fs.writeFile(file.filePath.toString(),jsonObject, function (err) {
        if (err) throw err;
          console.log('Saved!');
          global.shared.createLayout.length = 0;
          win.webContents.send('SaveSuccess');
        });
      }
    }).catch(err => {
      console.log(err)
    });
});

ipcMain.on('LoadLayout',()=>{
  //Load File
  dialog.showOpenDialog({
    title: 'Select the Layout to be uploaded',
    defaultPath: path.join(__dirname, './Layouts/'),
    buttonLabel: 'Upload',
    // Restricting the user to only Text Files.
    filters: [
      {
        name: 'Text Files',
        extensions: ['json']
      }, ],
    // Specifying the File Selector Property
    properties: ['openFile']
  }).then(file => {
    // Stating whether dialog operation was
    // cancelled or not.
    console.log(file.canceled);
    if (!file.canceled) {
      // Updating the GLOBAL filepath variable 
      // to user-selected file.
      global.filepath = file.filePaths[0].toString();

      let rawdata = fs.readFileSync(global.filepath);
      let json = JSON.parse(rawdata);
      var data = [];
      for(var i in json){
        data.push([i, json[i]]);
      }

      if(data[0][1] != true){
        console.log("Not A Layout");
        return;
      }
      global.shared.surveyArray[4] = data[4];
      win.webContents.send('LoadLayoutSuccess', data);
      
    }  
  }).catch(err => {
    console.log(err)
  });


});

//loads area file for layout builder
ipcMain.on('LoadArea', ()=>{
  //TODO FUTURE: Create area 
  let filepath = path.join(__dirname, './mapscripts/areas.json');
  let newareadata = JSON.parse(fs.readFileSync(filepath));
  global.shared.areadata = newareadata;
  win.webContents.send('LoadAreasSuccess', newareadata);
});

ipcMain.on('LoadSurvey', ()=>{
  //Load File
  dialog.showOpenDialog({
    title: 'Select the Survey to be uploaded',
    defaultPath: path.join(__dirname, './SavedSurveys/'),
    buttonLabel: 'Upload',
    // Restricting the user to only Text Files.
    filters: [
      {
        name: 'Text Files',
        extensions: ['json']
      }, ],
    // Specifying the File Selector Property
    properties: ['openFile']
  }).then(file => {
    // Stating whether dialog operation was
    // cancelled or not.
    console.log(file.canceled);
    if (!file.canceled) {
      // Updating the GLOBAL filepath variable 
      // to user-selected file.
      global.filepath = file.filePaths[0].toString();

      let rawdata = fs.readFileSync(global.filepath);
      let json = JSON.parse(rawdata);
      var data = [];
      for(var i in json){
        data.push([i, json[i]]);
      }

      win.webContents.send('LoadSurveySuccess', data);

    }  
  }).catch(err => {
    console.log(err)
  });

});

ipcMain.on('LoadDirectory', ()=>{
  dialog.showOpenDialog({
    title: 'Select the Folder to be uploaded',
    defaultPath: path.join(__dirname, './SavedSurveys/'),
    buttonLabel: 'Upload',
    // Restricting the user to only Text Files.
    filters: [
      {
        name: 'Text Files',
        extensions: ['json']
      }, 
    ],
    // Specifying the File Selector Property
    properties: ['openDirectory']
  }).then(file => {
    // Stating whether dialog operation was
    // cancelled or not.
    console.log(file.canceled);
    if (!file.canceled) {
      // Updating the GLOBAL filepath variable 
      // to user-selected file.
      var data = [];
      for(let i = 0; i < file.filePaths.length; i++){
        global.filepath = file.filePaths[i].toString();
        let rawdata = fs.readFileSync(global.filepath);
        let json = JSON.parse(rawdata);
       
        data.push(json);
        
      }

      win.webContents.send('LoadDirectorySurveySuccess', data);

    }  
  }).catch(err => {
    console.log(err)
  });
});

ipcMain.on('LoadMultipleSurvey', ()=>{
  dialog.showOpenDialog({
    title: 'Select the Files to be uploaded',
    defaultPath: path.join(__dirname, './SavedSurveys/'),
    buttonLabel: 'Upload',
    // Restricting the user to only Text Files.
    filters: [
      {
        name: 'Text Files',
        extensions: ['json']
      }, 
    ],
    // Specifying the File Selector Property
    properties: ['openFile', 'multiSelections']
  }).then(file => {
    // Stating whether dialog operation was
    // cancelled or not.
    console.log(file.canceled);
    if (!file.canceled) {
      // Updating the GLOBAL filepath variable 
      // to user-selected file.
      var data = [];
      for(let i = 0; i < file.filePaths.length; i++){
        global.filepath = file.filePaths[i].toString();
        let rawdata = fs.readFileSync(global.filepath);
        let json = JSON.parse(rawdata);
       
        data.push(json);
        
      }
      
      win.webContents.send('LoadMultiSurveySuccess', data);

    } 
  }).catch(err => {
    console.log(err)
  });   
});


ipcMain.on('SaveSurvey',()=>{
  let date = new Date();
  let TimeEnd = {'Time End': date};
  global.shared.surveyArray.push(TimeEnd);
  var jsonObject = JSON.stringify(global.shared.surveyArray);

  let month = date.getUTCMonth() + 1;
  let day = date.getUTCDate();
  let year = date.getUTCFullYear();
  let hours = date.getHours();
  let min = date.getMinutes();

  let newdate = "Survey__" + month + "-" + day + "-" + year + "_" + hours + "-" + min;
  let dpath = './SavedSurveys/' + newdate + '.json'

    //TODO: IMPLEMENT DIALOG OPTION FOR SAVE EVENT LISTENER
  dialog.showSaveDialog({
    title: 'Select the File Path to save',
    defaultPath: path.join(__dirname, dpath),
    buttonLabel: 'Save',
    filters: [
      {
        name: 'Text Files',
        extensions: ['json']
      }
    ],
    properties: []
  }).then(file => {
    if (!file.canceled) {
      console.log(file.filePath.toString());
        
      // Creating and Writing to the sample.txt file
      fs.writeFile(file.filePath.toString(),jsonObject, function (err) {
        if (err) throw err;
          console.log('Saved!');
          global.shared.surveyArray.length = 0;
          win.webContents.send('SaveSuccess');
        });
      }
    }).catch(err => {
      console.log(err)
    });
});

/*function ConvertToCSV(objArray) {
  var str = '';

  for (var i = 0; i < objArray.length; i++) {
      var line = '';
      //Check to see if you want each piece of furniture individually comma
      line = objArray[i];
      line += ',';
      
      console.log(line);

      str += line + '\r\n';
      
  }

  return str;
}*/

//takes a furnMap and returns it as an object array
function mapToObj(inputMap) {
  var obj = {};
  inputMap.forEach(function(value, key){
      obj[key] = value
  });

  return obj;
}
//Create Method for Handling the conversion of the furn map to CSV

/* ---Handling a to main event with arguments such as reading a file----

ipcMain.on("toMain", (event, args) => {
  fs.readFile("path/to/file", (error, data) => {
    // Do something with file contents

    // Send result back to renderer process
    win.webContents.send("fromMain", responseObj);
  });
});

*/