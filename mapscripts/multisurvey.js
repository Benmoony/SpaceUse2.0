function Furniture(fid, numSeats, x, y, degree_offset, ftype, inArea, avgUseRatio, avgOccupancy, sumOccupants, modified_count, mod_array, activities){
	this.fid = fid;
	this.numSeats = numSeats;
	this.x = x;
	this.y = y;
	this.degree_offset = degree_offset;
	this.ftype = ftype;
	this.inArea = inArea;
	this.avgUseRatio = avgUseRatio;
	this.avgOccupancy = avgOccupancy;
	this.sumOccupants = sumOccupants;
	this.modified_count = modified_count;
	this.mod_array = mod_array;
	this.activities = activities;
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

const threshold = .2;

function display_multisurvey(data, sfloor, sfloorName){

    let surveyareadata = data[0][4][1][sfloorName];

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
        new_area.polyArea = polyItem;
        areaMap.set(i, new_area);
        
        polyItem.addTo(surveyaAreaLayer);
        
    }

    for(var a in data){
        let surveydata = data[a];
        let floor = surveydata[sfloor];
        let surv_array = [];

        for(i in floor){

            let s_array = surveydata[1][i];

            for(j in s_array){
                //Check to see if furn exists in furnmap based on furn ID, if not create new element, if it does, add info to map

                let furn = new Furniture(s_array[j].furn_id, s_array[j].num_seats);
                furn.x = s_array[j].x;
                furn.y = s_array[j].y;
                furn.ftype = s_array[j].ftype;
                furn.seat_places = s_array[j].seat_places;
                furn.degree_offset = s_array[j].degree_offset;
                furn.area_id = s_array[j].area_id;

                furnMap.set(furn.furn_id, furn);
                
            }
        }
    }

    

    drawmultiMarkers(surv_array);
}

function drawmultiMarkers(surv_array){
    console.log(surv_array);
}

function calculateAreaData(){
	var iterateAreaMap = areaMap.values();
	floorMaxSeats = 0;
	total_floor_vistors = 0;
	avgFloorPop = 0;

	for(var i of areaMap){
		var num_surveys = survey_id_array.length;
		var cur_area = iterateAreaMap.next().value;
		var area_furn_count = 0;
		var area_ratio_sum = 0;
		var max_seats = 0;
		var total_seats_used = 0;
		var iterateFurnMap = furnMap.values();

		for(var j of furnMap){
			var cur_furn = iterateFurnMap.next().value;
			if(cur_furn != undefined){
				//check if the furniture is in the current area we are collecting data on
				if(cur_furn.inArea == cur_area.area_id){
					area_furn_count++;
					max_seats += parseInt(cur_furn.numSeats);
					area_ratio_sum += parseFloat(cur_furn.avgUseRatio);
					total_seats_used += parseInt(cur_furn.sumOccupants);
				}
				//check if a modified furniture exists for that furniture that is also within the current area
				for(var k = 0; k < cur_furn.mod_array.length; k++){
					var mod_furn = cur_furn.mod_array[k];
					if(mod_furn[2] == cur_area.area_id){
						var mod_occ = mod_furn[3];
						var mod_seats = mod_furn[4];
						total_seats_used += parseInt(mod_occ);
						area_ratio_sum += parseFloat(mod_occ/mod_seats);
						area_furn_count++;
					}
				}
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
	}
}


function addSurveyedAreas(){
	areaMap.forEach(function(key, value, map){
		drawAreaMulti(key).addTo(mymap);
	});
}


function drawAreaMulti(area){
	var curVerts = [];
	for(var i=0; i < area.verts.length; i++){
		area_verts = area.verts[i];
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
		+ area.peakDate
		+ "</br>Peak Survey ID: "
		+ area.peakSurvey;

	poly.bindPopup(popupString);

	if(area.numSeats != 0){
		area_string += popupString + "</br></br>";
	}
	else{
		area_string += "<strong>" + area.area_name 
					+"</strong></br>Average Room Population: " 
					+ area.avgPopArea
					+ "</br>Peak Room Occupants: " + area.peak 
					+ "</br>Peak Date: " + area.peakDate 
					+ "</br>Peak Survey ID: " + area.peakSurvey
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
