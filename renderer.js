// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const getNameForm = document.getElementById('ipcNameForm');
const home = document.getElementById('home');
const backBtn = document.getElementById('backBtn');

//Process Surveyors Name
getNameForm.addEventListener('submit', function (event){
    event.preventDefault() // stop the form from submitting
    let firstname = document.getElementById("fname").value;
    let lastname = document.getElementById("lname").value;
    let sname = firstname + " " + lastname;
    ipcRenderer.send('toMain', sname);
    getNameForm.style.display = "none";
    home.style.display = 'block';
})


//Functionality for Back Button
backBtn.addEventListener('click',()=>{
    ipcRenderer.send('back-to-previous');
    home.style.display = "none";
    getNameForm.style.display = "block";
});