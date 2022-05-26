const { map } = require("leaflet");

var surveyPopDim =
{
    'maxWidth': '300',
    'maxHeight': '300'
}

const threshold = .2;
var num_surveys = 0;
var total_floor_vistors = 0;
var dateMap = new Map();
var dataWindow = document.getElementById('surveyData');

function display_multisurvey(data, sfloor, sfloorName){

	areaMap.clear();
	if(mymap.hasLayer(surveyLayer)){
        mymap.removeLayer(surveyLayer);
        mymap.removeLayer(surveyAreaLayer);
        surveyLayer = new L.layerGroup().addTo(mymap);
        surveyAreaLayer = new L.layerGroup().addTo(mymap);
    }

	furnMap.clear();
    let surveyareadata = data[0][4][1][sfloorName];
	total_floor_vistors = 0;

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
        
        //polyItem.addTo(surveyaAreaLayer);
        
    }

	let timestart = data[0][5]['Time Start'];
	let timeend = data[data.length - 1][6]['Time End'];
	dataWindow.style.display = "block";
	let datastring = "<strong>Survey Number: </strong>"
    + data.length
    + "</br><strong>Survey Range Start: </strong>"
    + timestart
	+ "</br><strong>Survey Range End: </strong>"
    + timeend
    /*+ "</br><strong>Total Occupants: </strong>" 
    + occupied_seats
    + "</br><strong>Max Occupants: </strong>"
    + total_seats*/
    + "</br><hr>";
    dataWindow.innerHTML = datastring;

    for(var a in data){
		num_surveys++;
        let surveydata = data[a];
        let floor = surveydata[sfloor];
		let date = surveydata[5];
		dateMap.set(a, date);
        let surv_array = [];

        for(i in floor){

            let s_array = floor[i];

            for(j in s_array){
                //Check to see if furn exists in furnmap based on furn ID, if not create new element, if it does, add info to map
				let total_occupants = 0;
				if(furnMap.has(s_array[j].furn_id)){
					let curfurn = furnMap.get(s_array[j].furn_id);
					for(var k = 0; k < curfurn.seat_places.length; k++){

						let seat = curfurn.seat_places[k];
						if(seat.occupied === true){
							total_occupants++;					
						}
					}
					curfurn.sumOccupants += total_occupants;
					let lastitem = curfurn.arrOccupants[curfurn.arrOccupants.length - 1]
					curfurn.arrOccupants.push(total_occupants);
					if(lastitem < total_occupants){
						curfurn.peakuse = date;
						curfurn.peakPop = total_occupants;
					}
					
				}
				else{
					let furn = new Furniture(s_array[j].furn_id, s_array[j].num_seats);
					for(var k = 0; k < furn.seat_places.length; k++){

						let seat = furn.seat_places[k];
						if(seat.occupied === true){
							total_occupants++;					
						}
					}
					furn.x = s_array[j].x;
					furn.y = s_array[j].y;
					furn.ftype = s_array[j].ftype;
					furn.seat_places = s_array[j].seat_places;
					furn.degree_offset = s_array[j].degree_offset;
					furn.area_id = s_array[j].area_id;
					furn.sumOccupants = total_occupants;
					furn.arrOccupants.push(total_occupants);
					furn.peakuse = date;

					furnMap.set(furn.furn_id, furn);
				}
                
            }
        }
    }

	for(let[key, value] of furnMap){
		let arr = value.arrOccupants; 
		let sum = 0;
		for(let i = 0; i < arr.length; i++){
			sum += arr[i];
		}
		value.avgOccupancy = sum / arr.length;
		value.avgUseRatio = (sum / arr.length) * 100;

		var furn_id = value.furn_id;

        var num_seats = parseInt(key.num_seats);
        //var newFurn = new Furniture(furn_id, num_seats);

        var x = value.x;
        var y = value.y;
        var degree_offset = value.degree_offset;
        var furniture_type = value.ftype;
        var seat_type = value.seat_type;

        var latlng = [y,x];

        //parse furniture type to an int, then get the correct icon
        var type =  parseInt(furniture_type);

        var sicon = getIconObj(type);


		var popupString = "<strong>Average Occupancy: </strong>" 
			+ value.avgOccupancy + " of " + value.num_seats 
			+ "</br><strong>Total Occupants: </strong>" + value.sumOccupants 
			+ "</br><strong>Average Use: </strong>" + Math.round(value.avgUseRatio) +"%";

        //place a marker for each furniture item
        marker = L.marker(latlng, {
            icon: sicon,
            rotationAngle: degree_offset,
            rotationOrigin: "center",
            draggable: false,
            ftype: furniture_type,
            numSeats: num_seats,
            fid: furn_id.toString()
        }).addTo(surveyLayer).bindPopup(popupString, surveyPopDim);

        //make marker clickable
        marker.on('click', surveyClick);
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
                if(isMarkerInsidePolygon(y,x, jtem.polyArea)){
                    area_id = jtem.area_id;
                }
            });
            if(area_id !== "TBD"){
                selected_furn.in_area = area_id;
            }
        });
	}

	calculateAreaData();
	mymap.invalidateSize();
}

function calculateAreaData(){
	floorMaxSeats = 0;
	total_floor_vistors = 0;
	avgFloorPop = 0;

	for(let[key, value] of areaMap){
		
		var cur_area = value
		var area_furn_count = 0;
		var area_ratio_sum = 0;
		var max_seats = 0;
		var total_seats_used = 0;

		for(let[key2, value2] of furnMap){
			var cur_furn = value2;
			if(cur_furn != undefined){
				if(cur_furn.area_id === cur_area.area_id && cur_furn.area_id != null){
					area_furn_count++;
					max_seats += parseInt(cur_furn.num_seats);
					area_ratio_sum += parseFloat(cur_furn.avgUseRatio);
					total_seats_used += parseInt(cur_furn.sumOccupants);
				}
			}
		}
		//calculate area data based on now consolidated furniture data
		cur_area.num_seats = max_seats;
		floorMaxSeats += cur_area.num_seats;
		cur_area.avgPopArea = total_seats_used/num_surveys;
		avgFloorPop += cur_area.avgPopArea;
		cur_area.avgRatio = area_ratio_sum/area_furn_count;
		cur_area.totalSeatsUsed = total_seats_used;
		total_floor_vistors += cur_area.totalSeatsUsed;

		//call fuunction to draw area's after
		calculateAreaPeaks(cur_area);

	}
}

function calculateAreaPeaks(cur_area){
	//for cur area, run through date map and calculate values for dates;
	var datearr = [];
	for(let [key, value] of dateMap){
		let date = value['Time Start']
		datearr[key] = 0;
		for(let [key2, value2] of furnMap){
			if(cur_area.area_id === value2.area_id){
				let peak_furn_date = value2.peakuse['Time Start'];
				if(date === peak_furn_date){
					datearr[key] = datearr[key] + value2.peakPop;	
				}
			}
			
		}
	}
	

	//find the peak date for the area
	var peakdate = dateMap.get('0')['Time Start'];
	cur_area.peakPop = datearr[0];
	
	if(datearr.length > 1){
		for(let z = 1; z < datearr.length; z++){
			if(datearr[z] > datearr[z - 1]){
				let key = z.toString();
				peakdate = dateMap.get(key)['Time Start'];
				cur_area.peakPop = datearr[z];
			}
		}
	}
	


	cur_area.peakDate = peakdate;

	drawAreaMulti(cur_area).addTo(surveyAreaLayer);
}

function drawAreaMulti(area){
	var curVerts = [];
	for(var i=0; i < area.area_vertices.length; i++){
		area_verts = area.area_vertices[i];
		curVerts.push([area_verts.x,area_verts.y]);
	}

	var poly = L.polygon(curVerts);
	popupString = "<strong>"+area.area_name +"</strong></br>Number of Seats: "
		+ area.num_seats +"</br>Average Area Population: " + Math.round((area.avgPopArea) * 100)/100
		+"</br>Percentage Use: "
		+ Math.round((area.avgPopArea/area.num_seats) * 100)
		+ "%</br>Ratio of use over Period: "
		+ Math.round(area.avgRatio) 
		+ "%</br>Peak Population: "
		+ area.peakPop
		+ "</br>Peak Date: "
		+ area.peakDate
		+ "</br><hr>";

	poly.bindPopup(popupString);
	dataWindow.innerHTML += popupString;
	let area_string = '';
	if(area.num_seats != 0){
		area_string += popupString + "</br></br>";
	}
	else{
		area_string += "<strong>" + area.area_name 
					+"</strong></br>Average Room Population: " 
					+ area.avgPopArea
					+ "</br>Peak Room Occupants: " + area.peak 
					+ "</br>Peak Date: " + area.peakDate 
					+ "</br></br>";
	}

	//convert the varables to numbers, if not you will get unexpected results
	//https://www.w3schools.com/js/js_comparisons.asp
	var area_use = Number((area.avgPopArea/area.num_seats)*100);

	if(area_use < threshold){
		poly.setStyle({fillColor:"red"});
	}
	else{
		poly.setStyle({fillColor:"green"});
	}

	return poly;
}
