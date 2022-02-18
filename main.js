// Modules to control application life and create native browser window
const { app, Tray, BrowserWindow, Menu, dialog, ipcMain, globalShortcut} = require('electron')
const converter = require('json-2-csv');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');
const global = require('./global.js');


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
  global.shared.surveyArray.push(f1);
  global.shared.surveyArray.push(f2);
  global.shared.surveyArray.push(f3);
  //Navigate to the homepage
  let date = new Date();
  let TimeStart = {'Time Start': date};
  global.shared.surveyArray.push(TimeStart);
  console.log("Displaying Home " + sname);
});

ipcMain.on('back-to-previous',()=>{
  global.shared.surveyArray.length = 0;
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

  let floorFurn = mapToObj(furnMap);
  console.log(floorFurn);

  global.shared.surveyArray[sfloor][curfloor] = floorFurn;
  console.log(global.shared.surveyArray);
});

ipcMain.on('SaveSurvey',()=>{
  let FinalArray = JSON.stringify(global.shared.surveyArray);
  let date = new Date();
  let TimeEnd = {'Time End': date};
  global.shared.surveyArray.push(TimeEnd);

  converter.json2csv(FinalArray, (err, csv) => {
    if (err) {
        throw err;
    }
    console.log(csv);
    fs.writeFile('testfile.csv', csv, function(err){
      if(err) throw err;
    });

  });
});


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