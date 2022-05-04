const { map } = require("leaflet");

function Furniture(fid, numSeats, x, y, degree_offset, ftype, avgUseRatio, avgOccupancy, sumOccupants, modified_count, mod_array, activities){
	this.fid = fid;
	this.numSeats = numSeats;
	this.x = x;
	this.y = y;
	this.degree_offset = degree_offset;
	this.ftype = ftype;
	this.avgUseRatio = avgUseRatio;
	this.avgOccupancy = avgOccupancy;
	this.sumOccupants = sumOccupants;
	this.modified_count = modified_count;
	this.mod_array = mod_array;
	this.activities = activities;
	this.arrOccupants = [];
}

function Area(area_id, facilites_id, area_name){
    this.area_id = area_id
    this.facilites_id = facilites_id;
    this.area_name = area_name;
    this.area_vertices = [];
    this.polyArea;
    this.totalOccupants = 0;
    this.totalSeats = 0;
    this.avgPopArea = 0;
	this.avgRatio = 0;
	this.totalSeatsUsed = 0;
	this.peak = 0;
	this.peakSurvey = 0;
	this.peakDate = 0;
}


var surveyPopDim =
{
    'maxWidth': '300',
    'maxHeight': '300'
}

const threshold = .2;
var num_surveys = 0;
var total_floor_vistors = 0;

function display_multisurvey(data, sfloor, sfloorName){

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

    for(var a in data){
		num_surveys++;
        let surveydata = data[a];
        let floor = surveydata[sfloor];
        let surv_array = [];

        for(i in floor){

            let s_array = surveydata[1][i];

            for(j in s_array){
                //Check to see if furn exists in furnmap based on furn ID, if not create new element, if it does, add info to map
				if(furnMap.has(s_array[j].furn_id)){
					let curfurn = furnMap.get(s_array[j].furn_id);
					curfurn.sumOccupants += s_array[j].total_occupants;
					curfurn.arrOccupants.push(s_array[j].total_occupants);
				}
				else{
					let furn = new Furniture(s_array[j].furn_id, s_array[j].num_seats);
					furn.x = s_array[j].x;
					furn.y = s_array[j].y;
					furn.ftype = s_array[j].ftype;
					furn.seat_places = s_array[j].seat_places;
					furn.degree_offset = s_array[j].degree_offset;
					furn.area_id = s_array[j].area_id;
					furn.sumOccupants = s_array[j].total_occupants;
					furn.arrOccupants.push(s_array[j].total_occupants);

					furnMap.set(furn.fid, furn);
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

		var furn_id = value.fid;

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
			+ value.avgOccupancy + " of " + value.numSeats 
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
				//check if the furniture is in the current area we are collecting data on
				if(cur_furn.area_id === cur_area.area_id && cur_furn.area_id != null){
					area_furn_count++;
					max_seats += parseInt(cur_furn.numSeats);
					area_ratio_sum += parseFloat(cur_furn.avgUseRatio);
					total_seats_used += parseInt(cur_furn.sumOccupants);
				}
				//check if a modified furniture exists for that furniture that is also within the current area
				/*for(var k = 0; k < cur_furn.mod_array.length; k++){
					var mod_furn = cur_furn.mod_array[k];
					if(mod_furn[2] == cur_area.area_id){
						var mod_occ = mod_furn[3];
						var mod_seats = mod_furn[4];
						total_seats_used += parseInt(mod_occ);
						area_ratio_sum += parseFloat(mod_occ/mod_seats);
						area_furn_count++;
					}
				}*/
			}
		}
		//calculate area data based on now consolidated furniture data
		cur_area.numSeats = max_seats;
		floorMaxSeats += cur_area.numSeats;
		cur_area.avgPopArea = total_seats_used/num_surveys;
		avgFloorPop += cur_area.avgPopArea;
		cur_area.avgRatio = area_ratio_sum/area_furn_count;
		cur_area.totalSeatsUsed = total_seats_used;
		total_floor_vistors += cur_area.totalSeatsUsed;

		//call fuunction to draw area's after
		drawAreaMulti(cur_area).addTo(surveyaAreaLayer);

	}
}

function drawAreaMulti(area){
	var curVerts = [];
	for(var i=0; i < area.area_vertices.length; i++){
		area_verts = area.area_vertices[i];
		curVerts.push([area_verts.x,area_verts.y]);
	}

	var poly = L.polygon(curVerts);
	popupString = "<strong>"+area.area_name +"</strong></br>Number of Seats: "
		+ area.numSeats +"</br>Average Area Population: " + Math.round((area.avgPopArea) * 100)/100
		+"</br>Percentage Use: "
		+ Math.round(((area.avgPopArea/area.numSeats) * 100) * 100)/100
		+ "%</br>Ratio of use over Period: "
		+ Math.round((area.avgRatio * 100) * 100)/100 
		+ "%</br>Peak Population: "
		+ area.peak
		+ "</br>Peak Date: "
		+ area.peakDate;

	poly.bindPopup(popupString);

	let area_string = "";
	if(area.numSeats != 0){
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
	var area_use = Number((area.avgPopArea/area.numSeats)*100);

	if(area_use < threshold){
		poly.setStyle({fillColor:"red"});
	}
	else{
		poly.setStyle({fillColor:"green"});
	}

	return poly;
}
