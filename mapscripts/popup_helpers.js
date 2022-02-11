//Various Helper functions that assist in data collection popup user interface

//TODO: Get Buttons from DOM to apply helpers too
var SaveBtn = document.getElementById('save');
var LockBtn = document.getElementById('lock');
var RotateBtn = document.getElementById('rotate');
var CheckAllBtn = document.getElementById('checkall');
var MinusBtn = document.getElementById('minus');
var PlusBtn = document.getElementById('plus');

//calls when minus button is clicked
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


//this helper will iterate over furnmap and provide update statements for all furnitures location.
function updateHelper(){
	var outString="";
	
	furnMap.forEach(function(item, key, mapObj){
		aid = "TBD";
		x = item.x;
		y = item.y;
		areaMap.forEach(function(jtem, jkey, mapObj){
				
			if(isMarkerInsidePolygon(y,x, jtem.polyArea)){
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

//On click of submission, Create's a Survey Record and Inserts each seat object into the database with that ID
function submitSurveyHelper(){
    submitSurvey(username, layout, furnMap);
}

//Deletes the selected marker
function deleteHelper()
{
	mymap.removeLayer(selected_marker);
	furnMap.delete(selected_furn.id);
}