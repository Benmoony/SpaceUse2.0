/*Basic Helper Functions for interacting with Maps*/
function getFurnMap(){
    return furnMap;
}

function getActivityMap(){
    return activityMap;
}

function getWhiteboardActivityMap(){
    return wb_activityMap;
}

function getIconObj(furniture_type) {

	switch(furniture_type){
		case 1:
		case 2:
		case 3:
		case 4: selectedIcon=rectTable ; break;
		case 5:
		case 6: selectedIcon=counterCurved; break;
		case 7:
		case 8:
		case 9:
		case 10: selectedIcon = circTable; break;
		case 11: selectedIcon = couchCurved ; break;
		case 12: selectedIcon = couchTwo ; break;
		case 13: selectedIcon = couchThree ; break;
		case 14: selectedIcon = couchFour; break;
		case 15: selectedIcon = couchSix ; break;
		case 16:
		case 17:
		case 18:
		case 19: selectedIcon = collabStation; break;
		case 20: selectedIcon = roomIcon; break;
		case 21: selectedIcon = computerStation;break;
		case 22: selectedIcon = seatOne; break;
		case 23: selectedIcon = seatOneSoft; break;
		case 24: selectedIcon = fitDeskEmpty; break;
		case 25: selectedIcon = medCornerEmpty; break;
		case 26: selectedIcon = mfReaderEmpty; break;
		case 27: selectedIcon = studyOne; break;
		case 28: selectedIcon = studyTwo; break;
		case 29: selectedIcon = studyThree; break;
		case 30: selectedIcon = studyFour; break;
		case 31: selectedIcon = vidViewerEmpty; break;
		case 33: selectedIcon = rectTable ; break;
		default: selectedIcon = computerStation; break;
	}
	return selectedIcon;
}