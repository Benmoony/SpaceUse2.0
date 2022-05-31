//need for map
var drawnItems = new L.FeatureGroup();

//setup global variables for map builder
var selected_marker;
var selected_furn;
var mapPopulated = false;
var floor_id_selection = -1;
var form_info = document.getElementById("floor_dropdown");
var floor_image = "local";
var polyArea;
var furn;
var ftype;
var coord;
var lat;
var lng;
var cur_floor_id;

//floor image placed from dropdown selection
var image;

//Varables to hold the room info
var roomName = "";
var roomId = "";

//get areas and place over map
/*var getAreas = document.getElementById("getAreas");
getAreas.onclick = function(){
    //get areas for this floor
    //check if the areaMap has been populated already
    //create areas if the map is empty
    if(!mapPopulated){
        var cur_layout_id;
        $.ajax({
            url:'phpcalls/get-layout-id-from-floor.php',
            type: 'get',
            async: false,
            data:{ 'floor_ID': floor_id_selection },
            success: function(data){
                var json_object = JSON.parse(data);
                cur_layout_id = json_object[0];

            }
        })
        
        //createAreas(cur_layout_id);
        //getAreas.innerHTML = "Remove Areas";
        mapPopulated = true;

    }

    else{
        mymap.removeLayer(areaLayer);
        areaLayer = L.layerGroup().addTo(mymap);
        mapPopulated = false;
        //getAreas.innerHTML = "Generate Areas";
        //insertLayout.style.display = "none";
    }
}*/

//Make sure all pieces of furniture are in areas before inserting a new layout.
//var insertLayout = document.getElementById("insertLayout");
/*insertLayout.onclick = function(){
    var layoutReady = true;
    var outOfBoundsLatLng = [];
    var roomCheck;
    //calculate the area each piece of furniture is in.
    furnMap.forEach(function(value, key, map){
        //get the x,y for each piece of furniture
        y = value.y;
        x = value.x;
        roomCheck = value.ftype;
        area_id="TBD";

        areaMap.forEach(function(jtem, key, mapObj){
            //check if x,y are in a polygon
            if(isMarkerInsidePolygon(y,x, jtem.polyArea)){
                area_id = jtem.area_id;
            }
        });

        if(area_id !== "TBD"){
            value.inArea = area_id;
        }
        else {
            if(roomCheck != 20){
                layoutReady = false;
                outOfBoundsLatLng = [y,x];
            }

            if(roomCheck == 20){
                cur_room_id = value.roomId;
                $.ajax({
                    url: 'phpcalls/check-room.php',
                    type: 'get',
                    async: false,
                    data:{ 'roomId': cur_room_id },
                    success: function(data){
                        var json_object = JSON.parse(data);
                        if(json_object.length == 0){
                            value.inArea = 0;
                        }
                        else{
                            get_area_id = json_object[0];
                            value.inArea = get_area_id[0];
                        }
                        
                    }
                });
            }
        }
    });
}*/


function markerLayClick(e){
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
    nameDiv.innerHTML = "<strong>Type: </strong>"+selected_furn.ftype+"</br></br>";

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

    if(document.getElementById("seataddDiv") == null){
        var seataddDiv = document.createElement("div");
        seataddDiv.id = "seataddDiv";
        document.getElementById("popup").appendChild(seataddDiv);
        seatAddHelper("seataddDiv");
    }
}

function createFurnObj(ftype, lat, lng, coord){
    //get the index of the selected item
    
    mapKey++;

    var selectedIcon = getIconObj(ftype);

    //create the furniture object and store in map
    var newFurn = new Furniture(mapKey, 0);
    newFurn.ftype = ftype;
    newFurn.x = lng;
    newFurn.y = lat;
    console.log(newFurn);

    furnMap.set(mapKey, newFurn);

    if(document.getElementById("popup") == null){
            popupDiv = document.createElement("DIV");
            popupDiv.id = "popup";
            document.getElementById("popupHolder").appendChild(popupDiv);
    }

    var popup = document.getElementById("popup");
    var popupDim =
    {
        'minWidth': '200',
        'minHeight': '200'
    };//This is the dimensions for the popup

    marker = L.marker(coord, {
            fid: mapKey,
            icon: selectedIcon,
            rotationAngle: 0,
            draggable: true
    }).addTo(furnitureLayer).bindPopup(popup,popupDim);
    //give it an onclick function
    marker.on('click', markerLayClick);

    //define drag events
    marker.on('drag', function(e) {
        console.log('marker drag event');
    });
    marker.on('dragstart', function(e) {
        console.log('marker dragstart event');
        mymap.off('click', onMapClick);
    });
    marker.on('dragend', function(e) {
        //update latlng for insert string
        var changedPos = e.target.getLatLng();
        var lat=changedPos.lat;
        var lng=changedPos.lng;

        selected_marker = this;
        selected_furn = furnMap.get(selected_marker.options.fid);
        selected_furn.x = lng;
        selected_furn.y = lat;

        //output to console to check values
        console.log('marker dragend event');

        setTimeout(function() {
            mymap.on('click', onMapClick);
        }, 10);
    });
}

//Deletes the selected marker
function deleteHelper()
{
	mymap.removeLayer(selected_marker);
	furnMap.delete(selected_furn.furn_id);
}

function seatAddHelper(parentDiv){

    var minusButton = document.createElement('minusbutton');
    var addButton = document.createElement('button');
    var seatTracker = document.createElement('p');
    

    selected_marker.options.num_seat = seats;
}

//Rotation Functionality
//This function helps rotate the furniture and appends the div after the furniture has been rotated.
function rotateHelper(parentDiv)
{
	if(document.getElementById("rotateSlider") == null)
	{
		var rotateSlider = document.createElement("input");
		rotateSlider.type = "range";
		rotateSlider.min = "-180";
		rotateSlider.max = "180";
		rotateSlider.value = "0";
		rotateSlider.step = "10";
		rotateSlider.id = "rotateSlider";
		rotateSlider.value = selected_furn.degreeOffset;
		
		var sliderValue = document.createElement("p");
		sliderValue.id = "sliderValue";
		sliderValue.innerText = "Value: "+selected_furn.degreeOffset;
		
		document.getElementById(parentDiv).appendChild(sliderValue);
		document.getElementById(parentDiv).appendChild(rotateSlider);
	
			
		rotateSlider.oninput = function()
		{
			selected_marker.setRotationOrigin("center");
			selected_furn.degreeOffset =rotateSlider.value;
			selected_marker.options.degree_offset = rotateSlider.value;
			selected_marker.setRotationAngle(rotateSlider.value);
			sliderValue.innerText = "Value: " + rotateSlider.value;
		}
	}
	
	else
	{
		document.getElementById("rotateSlider").remove();
		document.getElementById("sliderValue").remove();
	}

}