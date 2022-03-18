//All Map functions:
//Initalize Map
var L = require('leaflet');
window.$ = window.jQuery = require('jquery');

var imagepath = "";
var sfloor = "";
var isSurvey = false;
var selected_furn;
var selected_marker;
var seat_num;
var floor_path;

//Buttons from DOM to apply helpers too
var SaveBtn = document.getElementById('save');
var LockBtn = document.getElementById('lock');
var RotateBtn = document.getElementById('rotate');
var CheckAllBtn = document.getElementById('checkall');
var MinusBtn = document.getElementById('minus');
var PlusBtn = document.getElementById('plus');


//to store the seat_places array to be saved
var temp_seat_places = [];

const floorBtn = document.getElementById('submitFloor');
const surveyBtn = document.getElementById('surveyFloorSelect');

//Add Floor to Global JSON
floorBtn.addEventListener('click', function (event){
    event.preventDefault() // stop the form from submitting
    sfloor = document.getElementById("floor").value;
    isSurvey = false;
    mapView.style.display = "block";
    addMapPic();
    //Add Furniture After Adding Items
});

surveyBtn.addEventListener('click', function (event){
    event.preventDefault()
    isSurvey = true;
    sfloor.getElementById("sfloor").value;
    mapView.style.display = "block";

});

function reinializePop(){
	let obj = document.getElementById('MapContainer');
    obj.insertAdjacentHTML('afterend', '<div id="popup"><div id="seat_div"></div><div id="wb_div"></div><button id="save" style="display:none">Save and Exit</button><button id="lock">Unlock</button><button id="checkall" style="display:none">Check All</button><label id="seat_operator"></label><button id="minus" style="display:none">-</button><button id="plus" style="display:none">+</button></div>');
    let popup= document.getElementById('popup');

    SaveBtn = document.getElementById('save');
    LockBtn = document.getElementById('lock');
    //RotateBtn = document.getElementById('rotate');
    CheckAllBtn = document.getElementById('checkall');
    MinusBtn = document.getElementById('minus');
    PlusBtn = document.getElementById('plus');

    
    MinusBtn.addEventListener('click', ()=>{
        minus(selected_furn);
    });

    //calls when plus button is clicked
    PlusBtn.addEventListener('click', ()=>{
        var newSeat = new Seat(temp_seat_places.length);
        temp_seat_places.push(newSeat);
        plus(newSeat, temp_seat_places.length, true);
        checkAll(selected_furn);
    });

    //called when save button is clicked on popup.
    SaveBtn.addEventListener('click', ()=>{
        var occupants = document.getElementById("occupantInput");
        if(occupants)
        {
            selected_furn.totalOccupants = occupants.value;
        }
        selected_marker.setOpacity(1);
        selected_furn.seat_places = temp_seat_places;
        
        if(temp_wb != [])
        {
            selected_furn.whiteboard = temp_wb;
        }
        
        mymap.closePopup();
    });

    //helps lock or unlock furniture item on movement
    LockBtn.addEventListener('click', ()=>{
        var lockButton = document.getElementById("lock");
        
        if(lockButton.innerText === "Unlock")
        {
            selected_marker.dragging.enable();
            lockButton.innerText = "Lock";
        }        	
        else
        {
            selected_marker.dragging.disable();
            lockButton.innerText = "Unlock";
        }
        mymap.closePopup();
    });

    //called when checkall button is clicked.function
    CheckAllBtn.addEventListener('click', ()=>{
        checkAll(selected_furn);
    });
}

//Initalize Map
var mymap = L.map('MapContainer', {crs: L.CRS.Simple, minZoom: 0, maxZoom: 4});
var furnitureLayer = new L.layerGroup().addTo(mymap);
var surveyLayer = new L.layerGroup().addTo(mymap);
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

//Define Activities
activityMap.set(0, "Studying");
activityMap.set(1, "Computer");
activityMap.set(2, "Entertainment");

wb_activityMap.set(0, "Partition");
wb_activityMap.set(1, "Writing");

//Max Interactible Boundaries
var latMax = 359.75;
var latMin = -0.5;
var longMax = 508.18;
var longMin = 42.18;

//container for furniture objects
var furnMap = new Map();
var mapKey = 0;

var popupDim =
{
    'maxWidth': '5000',
    'maxHeight': '5000'
};

var surveyPopDim =
{
    'maxWidth': '300',
    'maxHeight': '300'
}

//extend the marker class to add furniture data
var marker = L.Marker.extend({
	options: {
		fid: 0,
		ftype: "default ftype",
		degreeOffset: 0,
		numSeats: 0,
		defaultSeat: "default seat"
	}
});

//for testing and finding furniture locations
mymap.on('click', function(e){
    var coord = e.latlng;
    var lat = coord.lat;
    var lng = coord.lng;
    console.log("You clicked the map at latitude: " + lat + " and longitude: " + lng);
});

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

        //initalize pointer to popup div
        var popup = document.getElementById("popup");


        //place a marker for each furniture item
        marker = L.marker(latlng, {
            icon: sicon,
            rotationAngle: degree_offset,
            rotationOrigin: "center",
            draggable: false,
            ftype: furniture_type,
            numSeats: num_seats,
            fid: furn_id.toString()
        }).addTo(furnitureLayer).bindPopup(popup, popupDim);

        //make marker clickable
        marker.on('click', markerClick);
        marker.setOpacity(.6);

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
            /*areaMap.forEach(function(jtem, key, mapObj){
                
                if(isMarkerInsidePolygon(y,x, jtem.polyArea)){
                    area_id = jtem.area_id;
                }
            });*/
            if(area_id !== "TBD"){
                selected_furn.in_area = area_id;
            }
        });

        //add furniture to the datamap to capture input information from data
        furnMap.set(furn_id.toString(), key);
    }
}

function display_survey(surveyArray){
    
    for(var i in surveyArray){

        var key = surveyArray[i];
        var furn_id = key.furn_id;

        var num_seats = parseInt(key.num_seats);

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

        //initalize pointer to popup div
        var spop = document.getElementById("surveyPopup");


        //place a marker for each furniture 
        marker = L.marker(latlng, {
            icon: sicon,
            rotationAngle: degree_offset,
            rotationOrigin: "center",
            draggable: false,
            ftype: furniture_type,
            numSeats: num_seats,
            fid: furn_id.toString()
        }).addTo(surveyLayer).bindPopup(spop, surveyPopDim);

        //make marker clickable
        marker.on('click', surveyClick);
    }
}

function surveyClick(e){
    let pop = document.getElementById('spop');
    pop.style.display('block');
    console.log(this);
}

//Add Image of Map to div
function addMapPic(){
    //remove old floor imagepath and place newly selected floor imagepath
    if( mymap.hasLayer(image)){
        mymap.removeLayer(image);
    }

    //reinalize furniture layer
    if(mymap.hasLayer(furnitureLayer)){
        mymap.removeLayer(furnitureLayer);
        furnitureLayer = new L.layerGroup().addTo(mymap);

        if(document.getElementById("popup") === null){
            reinializePop();
            SaveBtn = document.getElementById('save');
            LockBtn = document.getElementById('lock');
            RotateBtn = document.getElementById('rotate');
            CheckAllBtn = document.getElementById('checkall');
            MinusBtn = document.getElementById('minus');
            PlusBtn = document.getElementById('plus');
        }
        
      
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
        image = L.imageOverlay(imagepath, bounds);
        image.addTo(mymap);

        //load furniture after image depending on selected layout.
        //Prebuild Layout in CSV File to JSON
        //TODO: implement Layout
        
        if(isSurvey === true){
            let surveydata = global.survey[sfloor][1];
            let surv_array = [];
            for(i in surveydata){
                let furn = new Furniture(floordata[i].fid, floordata[i].num_seats);
                furn.x = floordata[i].x;
                furn.y = floordata[i].y;
                furn.ftype = floordata[i].ftype;
                furn.degree_offset = floordata[i].degree_offset;
                surv_array.push(furn);
            }
            display_survey(surv_array);
        }
        else{
            let floordata = global.layout[sfloor][1];
            let furn_array = [];
            for(i in floordata){
                let furn = new Furniture(floordata[i].fid, floordata[i].num_seats);
                furn.x = floordata[i].x;
                furn.y = floordata[i].y;
                furn.ftype = floordata[i].ftype;
                furn.degree_offset = floordata[i].degree_offset;
                furn_array.push(furn);
            }
            
            build_markers(furn_array);
        }
        
    }
    else{
        console.log("Image Failed to Load");
    }

    mymap.on('zoomend', function() {
        var markerSize;
        //resize the markers depending on zoomlevel so they appear to scale
        //zoom is limited to 0-4
        switch(mymap.getZoom()){
            case 0: markerSize= 5; break;
            case 1: markerSize= 10; break;
            case 2: markerSize= 20; break;
            case 3: markerSize= 40; break;
            case 4: markerSize= 80; break;
        }
        var newzoom = '' + (markerSize) +'px';
        var newLargeZoom = '' + (markerSize*1.5) +'px';

        $('.furnitureIcon').css({'width':newzoom,'height':newzoom});
        $('.furnitureLargeIcon').css({'width':newLargeZoom,'height':newLargeZoom});
    });

}
