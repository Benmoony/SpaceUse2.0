//All Map functions:
//Initalize Map
var L = require('leaflet');
window.$ = window.jQuery = require('jquery');
var imagepath = "";
var sfloor = "";
var selected_furn;

const floorBtn = document.getElementById('submitFloor');

//Add Floor to Global JSON
floorBtn.addEventListener('click', function (event){
    event.preventDefault() // stop the form from submitting
    sfloor = document.getElementById("floor").value;
    
    mapView.style.display = "block";
    addMapPic();
    //Add Furniture After Adding Items

});

var mymap = L.map('MapContainer', {crs: L.CRS.Simple, minZoom: 0, maxZoom: 4});
var furnitureLayer = new L.layerGroup().addTo(mymap);
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

        //TODO: Retool get Icon, to return the URL and the class name, build the Icon to add to the marker here
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
        }).addTo(furnitureLayer).bindPopup('Marker at ' + latlng).openPopup();

        console.log(furnitureLayer);
        //TODO: Implement Popup
        

        //make marker clickable
        marker.on('click', markerClick);

        //update marker coords when a user stops dragging the marker, set to furniture object to indicate modified
        /*marker.on("dragend", function(e){
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
        });*/

        //add furniture to the datamap to capture input information from data
        furnMap.set(furn_id.toString(), key);
        console.log(furnMap);

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
        test_furn_1.x = 338;
        test_furn_1.y = 122;
        test_furn_1.ftype = 10;
        test_furn_array.push(test_furn_1);
        build_markers(test_furn_array);

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
        var newLargeZoom = '' + (markerSize*2) +'px';
        $('#MapContainer.furnitureIcon').css({'width':newzoom,'height':newzoom});
        $('#MapContainer.furnitureLargeIcon').css({'width':newLargeZoom,'height':newLargeZoom});
    });

}

//TODO: implement MarkerClick

function markerClick(e){

    /*
    //when a marker is clicked, it should be rotatable, and delete able
    selected_marker = this;
    selected_furn = furnMap.get(selected_marker.options.fid);
    //make sure the nameDiv is created and attached to popup
    if(document.getElementById("nameDiv") == null){
        var nameDiv = document.createElement("div");
        nameDiv.id = "nameDiv";
        document.getElementById("popup").appendChild(nameDiv);
    }
    //set the nameDiv to the name of the current furniture
    var nameDiv = document.getElementById("nameDiv");
    nameDiv.innerHTML = "<strong>Type: </strong>"+selected_furn.fname+"</br></br>";

    if(document.getElementById("deleteButtonDiv") == null) {
        //create a div to hold delete marker button
        var deleteButtonDiv = document.createElement("div");
        deleteButtonDiv.id = "deleteButtonDiv";
        //attach deleteButton div to popup
        document.getElementById("popup").appendChild(deleteButtonDiv);
        //create delete button
        var deleteMarkerButton = document.createElement("BUTTON");
        deleteMarkerButton.id = "deleteMarkerButton";
        deleteMarkerButton.innerHTML = "Delete";
        deleteMarkerButton.onclick = deleteHelper;
        //deleteMarkerButton.className = "deleteButton";
        //add the button to the div
        document.getElementById("deleteButtonDiv").appendChild(deleteMarkerButton);
    }

    //check if the rotateDiv has been made
    if(document.getElementById("rotateDiv") == null){
        //create a div to hold rotateButton
        var rotateDiv = document.createElement("div");
        rotateDiv.id = "rotateDiv";
        //attach the rotatebutton div to the popup
        document.getElementById("popup").appendChild(rotateDiv);
        rotateHelper("rotateDiv");
    }
    */
}