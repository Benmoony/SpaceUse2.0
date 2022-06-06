//All Map functions:
//Initalize Map

/*
Created By Verja Miller
MIT LISCENSE
*/
var L = require('leaflet');
window.$ = window.jQuery = require('jquery');

var imagepath = "";
var sfloor = "";
var isSurvey = false;
var isMulti = false;
var isLayoutEdit = false;
var selected_furn;
var selected_marker;
var seat_num;
var floor_path;

//Info For Uploaded Surveys
var SurveyStartTime;
var SurveyEndTime;

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
const surveyfloorBtn = document.getElementById('subsurveyFloor');
const msurveyfloorBtn = document.getElementById('msubsurveyFloor');
const layoutfloorBtn = document.getElementById('layfloor');
const layoutDrawBtn = document.getElementById('drawArea');
const layoutSaveFloor = document.getElementById('saveLayFloor');
const layoutSaveLay = document.getElementById('saveLayout');

//Add Floor to Global JSON
floorBtn.addEventListener('click', function (event){
    event.preventDefault() // stop the form from submitting
    sfloor = document.getElementById("floor").value;
    isSurvey = false;
    isMulti = false;
    isLayoutEdit = false;
    mapView.style.display = "block";
    addMapPic();
    //Add Furniture After Adding Items
});

surveyfloorBtn.addEventListener('click', function (event){
    event.preventDefault()
    isSurvey = true;
    isMulti = false;
    isLayoutEdit = false;
    sfloor = document.getElementById("sfloor").value;
    mapView.style.display = "block";
    addMapPic();

});

msurveyfloorBtn.addEventListener('click', function (event){
    event.preventDefault();
    mapView.style.display = "block";
    sfloor = document.getElementById('msfloor').value;
    isMulti = true;
    isSurvey = false;
    isLayoutEdit = false;
    addMapPic();
});

layoutfloorBtn.addEventListener('click', function(event){
    event.preventDefault();
    mapView.style.display = "block";
    sfloor = document.getElementById('layfloor').value;
    isLayoutEdit = true;
    isSurvey = false;
    isMulti = false;
    addMapPic();
});

layoutDrawBtn.addEventListener('click', function(event){
    event.preventDefault();
    var backcolor = layoutDrawBtn.style.backgroundColor;

    if(backcolor !== 'green'){
        layoutDrawBtn.style.backgroundColor = 'green';
    } else {
        layoutDrawBtn.style.backgroundColor = 'salmon';
    }
    areaMaker();
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
var surveyAreaLayer = new L.layerGroup().addTo(mymap);
var areaLayer = L.layerGroup().addTo(mymap);
var drawnItems = new L.FeatureGroup().addTo(mymap);
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

//Create the boundries for placing furniture
var latMax = 359.75;
var latMin = -0.5;
var longMax = 508.18;
var longMin = 42.18;


//Proccesses clicking the map
mymap.on('click', function(e){
    var coord = e.latlng;
    var lat = coord.lat;
    var lng = coord.lng;
    console.log("You clicked the map at latitude: " + lat + " and longitude: " + lng);

    if(isLayoutEdit === true){
        let outBounds = false;
        if(lat > latMax || lat < latMin || lng > longMax || lng < longMin){
            alert("Please place the furniture inside the map");
            outBounds = true;
        }

        //check if area was clicked out of bounds
        if(outBounds === false && drawing === false){
            //get the furniture select element
            furn = document.getElementById("furn_icons");
            //get the type id from the value
            ftype = furn.value;
            //convert the string furniture type into an int to send to getIconObj(int ftype)
            ftype = parseInt(ftype);

            createFurnObj(ftype, lat, lng, coord);
        }

        if(drawing === true){
            //Create Polygon for area's here;

            
        }
    }
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
    this.marker;
    this.area_id;
    this.modified = false;
    this.degree_offset = 0;
    this.x;
    this.y;
    this.ftype;
    this.avgUseRatio;
	this.avgOccupancy;
	this.sumOccupants;
	this.modified_count;
	this.mod_array;
	this.activities;
	this.arrOccupants = [];
    this.peakuse;
    this.peakPop = 0;
}

//Seat Obj
function Seat(seatPos){
    this.seatPos = seatPos;
    //this.type = type;
    this.activity = [];
    this.occupied = false;
}

//Area Obj
function Area(area_id, facilites_id, area_name){
    this.area_id = area_id
    this.facilites_id = facilites_id;
    this.area_name = area_name;
    this.area_vertices = [];
    this.polyArea;
    this.totalOccupants = 0;
    this.totalSeats = 0;
    this.totalOccupants = 0;
    this.totalSeats = 0;
    this.avgPopArea = 0;
	this.avgRatio = 0;
	this.totalSeatsUsed = 0;
	this.peakPop = 0;
	this.peakSurvey = 0;
	this.peakDate = 0;
}

function AreaVertices(x,y){
    this.x = x;
    this.y = y;
}

//pass information from the layout to build the markers after loading layout file
function build_markers(furnitureArray){

    furnMap.clear();

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
            areaMap.forEach(function(jtem, key, mapObj){
                
                if(isMarkerInsidePolygon(y, x, jtem.polyArea)){
                    area_id = jtem.area_id;
                }
            });
            if(area_id !== "TBD"){
                selected_furn.in_area = area_id;
            }
        });

        //add furniture to the datamap to capture input information from data
        furnMap.set(furn_id.toString(), key);
    }

    mymap.invalidateSize();
}

function display_survey(surveyArray){

    var total_seats = 0;
    var occupied_seats = 0;

    for(var i in surveyArray){

        var key = surveyArray[i];
        var furn_id = key.furn_id;

        var num_seats = parseInt(key.num_seats);
        total_seats += num_seats; 

        var area = key.area_id;
        var x = key.x;
        var y = key.y;
        var degree_offset = key.degree_offset;
        var furniture_type = key.ftype;
        var seat_places = key.seat_places;
        var sumOccupant = 0;
        for(var j = 0; j < seat_places.length; j++){

            let seat = seat_places[j];
            if(seat.occupied === true){
                occupied_seats++;
                sumOccupant++;
                
                //add to area occupied seats here
                if(area != undefined && area < areaMap.size){
                    areaMap.get(area).totalOccupants++; 
                }
                
            }
        }
        
        //add to area total seats;
        if(area != undefined && area < areaMap.size){
            areaMap.get(area).totalSeats += num_seats;
        }

        var latlng = [y,x];

        //parse furniture type to an int, then get the correct icon
        var type =  parseInt(furniture_type);

        var sicon = getIconObj(type);

        //build Text Content of Seat
        var popupString = "<strong>Seat ID: </strong>" 
                        + furn_id.toString() 
                        + "</br><strong>Total Occupants: </strong>" 
                        + sumOccupant
                        + "</br><strong>Max Occupants: </strong>"
                        + num_seats;


        //place a marker for each furniture 
        marker = L.marker(latlng, {
            icon: sicon,
            rotationAngle: degree_offset,
            rotationOrigin: "center",
            draggable: false,
            ftype: furniture_type,
            numSeats: num_seats,
            seats: seat_places,
            fid: furn_id.toString()
        }).addTo(surveyLayer).bindPopup(popupString, surveyPopDim);

        //make marker clickable
        marker.on('click', surveyClick);

        if(seat_places.length <= 0){
            marker.setOpacity(.3);
        }

        
    }

    var dataWindow = document.getElementById('surveyData');
    dataWindow.style.display = "block";

    let datastring = "<strong>Survey Start: </strong>"
    + SurveyStartTime
    + "</br><strong>Survey End: </strong>"
    + SurveyEndTime
    + "</br><strong>Total Occupants: </strong>" 
    + occupied_seats
    + "</br><strong>Max Occupants: </strong>"
    + total_seats
    + "</br><hr>";
    dataWindow.innerHTML = datastring;

    //Display Area Popups here: Create Data String for each area and append it to the inner HTML

    areaMap.forEach(function(item){
        let p = ((item.totalOccupants / item.totalSeats) * 100).toFixed(2) + '%';

        let areastring = "<Strong>Area: </strong>"
        + item.area_name
        + "</br><strong>Facilities ID: </strong>"
        + item.facilites_id
        + "</br><strong>Total Occupants: </strong>" 
        + item.totalOccupants 
        + "</br><strong>Max Occupants: </strong>"
        + item.totalSeats
        + "</br><strong>Percentage Used: </strong>"
        + p
        + "</br><hr>";

        dataWindow.innerHTML += areastring;
    });
        
    

    mymap.invalidateSize();
}

//Add Image of Map to div
function addMapPic(){
    //remove old floor imagepath and place newly selected floor imagepath
    if(image != undefined){
        mymap.removeLayer(image);
    }

    //reinalize furniture layer
    if(mymap.hasLayer(furnitureLayer)){
        mymap.removeLayer(furnitureLayer);
        mymap.removeLayer(areaLayer);
       
        furnitureLayer = new L.layerGroup().addTo(mymap);
        areaLayer = new L.layerGroup().addTo(mymap);
        

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

    if(mymap.hasLayer(surveyLayer)){
        mymap.removeLayer(surveyLayer);
        mymap.removeLayer(surveyAreaLayer);
     
        surveyLayer = new L.layerGroup().addTo(mymap);
        surveyAreaLayer = new L.layerGroup().addTo(mymap);
        
    }


    //TODO:: Eventually replace this code with a dynamic file picker
    sfloor = parseInt(sfloor);
    let sfloorName = "";
    switch(sfloor){
        case 0:
            imagepath = "";
            break;
        case 1:
            imagepath = "./images/floor1.svg";
            sfloorName = "Floor 1";
            break;
        case 2:
            imagepath = "./images/floor2.svg";
            sfloorName = "Floor 2";
            break;
        case 3:
            imagepath = "./images/floor3.svg";
            sfloorName = "Floor 3";
            break;
    }

    if(sfloor != '' && imagepath != ''){
        image = L.imageOverlay(imagepath, bounds);
        image.addTo(mymap);

        //load furniture after image depending on selected layout.
        if(isMulti === true){
            
            areaMap.clear();
            furnMap.clear();
            dateMap.clear();
            
            display_multisurvey(global.survey, sfloor, sfloorName);
        } 
        else if(isSurvey === true){
            let surveydata = global.survey[sfloor];
            let surveyareadata = global.survey[4][1][1][sfloorName];
            SurveyStartTime = global.survey[5][1]["Time Start"];
            SurveyEndTime = global.survey[6][1]["Time End"];
            let floor = surveydata[1];
            let surv_array = [];

            areaMap.clear();
            for(i in surveyareadata){
                let cur_area_data = surveyareadata[i];
                let new_area = new Area(i, cur_area_data["facilities_id"], cur_area_data["name"]);
                let points = surveyareadata[i].points;
                for(j in points){
                    curpoint = points[j];
                    let x = curpoint.v_x;
                    let y = curpoint.v_y;
                    var newVert = new AreaVertices(x, y);
                    new_area.area_vertices.push(newVert);
                }

                var polyItem = drawArea(new_area);
                new_area.polyArea = polyItem;
                areaMap.set(i, new_area);
                polyItem.addTo(surveyAreaLayer);
                
            }

            for(i in floor){

                let s_array = surveydata[1][i];

                for(j in s_array){
                    let furn = new Furniture(s_array[j].furn_id, s_array[j].num_seats);
                    furn.x = s_array[j].x;
                    furn.y = s_array[j].y;
                    furn.ftype = s_array[j].ftype;
                    furn.seat_places = s_array[j].seat_places;
                    furn.degree_offset = s_array[j].degree_offset;
                    furn.area_id = s_array[j].area_id;

                    surv_array.push(furn);
                }
            }

            display_survey(surv_array);
        }
        else if(isLayoutEdit === true){
            areaMap.clear();
            furnMap.clear();
            mymap.removeLayer(drawnItems);
            drawnItems = new L.layerGroup().addTo(mymap);
            mymap.invalidateSize();

        }
        else{
            let floordata = global.layout[sfloor][1];
            let areadata = global.layout[4][1][sfloorName];
            let furn_array = [];

            for(i in areadata){
                let cur_area_data = areadata[i];
                let new_area = new Area(i, cur_area_data["facilities_id"], cur_area_data["name"]);
                let points = areadata[i].points;
                for(j in points){
                    curpoint = points[j];
                    let x = curpoint.v_x;
                    let y = curpoint.v_y;
                    var newVert = new AreaVertices(x, y);
                    new_area.area_vertices.push(newVert);
                }

                var polyItem = drawArea(new_area);
                new_area.polyArea = polyItem;
                areaMap.set(i, new_area);
                polyItem.addTo(areaLayer);
                
            }

            //Build Furniture map from data to build markers
            for(i in floordata){
                let furn = new Furniture(floordata[i].fid, floordata[i].num_seats);
                furn.x = floordata[i].x;
                furn.y = floordata[i].y;
                furn.ftype = floordata[i].ftype;
                furn.degree_offset = floordata[i].degree_offset;
                areaMap.forEach(function(jtem, jkey, mapObj){
				
                    if(isMarkerInsidePolygon(furn.y, furn.x, jtem.polyArea)){
                        furn.area_id = jtem.area_id;
                    }
                });

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
        var newLongWidth = '' + (markerSize*4) +'px';

        $('.furnitureIcon').css({'width':newzoom,'height':newzoom});
        $('.furnitureLargeIcon').css({'width':newLargeZoom,'height':newLargeZoom});
        $('.furnitureLongIcon').css({'width':newLargeZoom,'height':newLongWidth});
    });

}

function drawArea(area){
	var verts = [];

	for(var i=0; i < area.area_vertices.length; i++){
		area_verts = area.area_vertices[i];
		verts.push([area_verts.x,area_verts.y]);
	}
	var poly = L.polygon(verts);
	poly.bindPopup(area.area_name);

	return poly;
}

function isMarkerInsidePolygon(x,y, poly) {
	var inside = false;
	for (var ii=0;ii<poly.getLatLngs().length;ii++){
		var polyPoints = poly.getLatLngs()[ii];
		for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
			var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
			var xj = polyPoints[j].lat, yj = polyPoints[j].lng;

			var intersect = ((yi > y) != (yj > y))
				&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}
	}

	return inside;
}

function updateHelper(){
	var outString="";
	
	furnMap.forEach(function(item, key, mapObj){
		aid = "TBD";
		x = item.x;
		y = item.y;
		areaMap.forEach(function(jtem, jkey, mapObj){
				
			if(isMarkerInsidePolygon(y, x, jtem.polyArea)){
				aid = jtem.area_id;
			}
		});
		if(area_id !== "TBD"){
			item.in_area = aid;
		}
        outString+= updateFurn(item);
		outString+="\n";
	});
}