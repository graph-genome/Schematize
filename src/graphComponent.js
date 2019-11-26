// import set from "set";
//var Set = require('set');
let fs = require('fs');


class PangenomeSchematic {
	constructor(fileName) {
		this.jsonPath = fileName;
	}
	readFile() {
		// console.log();
		// var jsonFile = require('./data/Athaliana.bin100000.schematic.json'); // This cannot be a variable
		var jsonFile = require('./data/yeast_bin10k_7indiv_16chr.schematic.json'); // This cannot be a variable

		console.log(jsonFile)
		return(jsonFile)
	}
	processArray(jsonFile) {
		var componentArray = [];
		var offsetLength = 0;
		for (var component in jsonFile.components) {
			var componentItem = new Component(jsonFile.components[component], offsetLength)
			offsetLength += componentItem.arrivals.length + componentItem.departures.length;
			componentArray.push(componentItem);
			//if(component > 20){break} // debugging: to limit input data
		}
		this.components = componentArray;
		this.pathNames = jsonFile.path_names;
		return (componentArray)
	}
}


class LinkColumn {
	constructor(linkColumn) {
		this.upstream = linkColumn.upstream;
		this.downstream = linkColumn.downstream;
		this.participants = (linkColumn.participants);//new Set
	}
}

class Component {
	constructor(component, offsetLength) {
//firstBin, lastBin, arrivals, departures) {
		this.offset = offsetLength;
		this.firstBin = component.first_bin;
		this.lastBin = component.last_bin;
		this.arrivals = [];
		for (var arrival in component.arrivals) {
			this.arrivals.push(new LinkColumn(component.arrivals[arrival]))
		}
		this.departures = [];
		for (var departure in component.departures) {
			this.departures.push(new LinkColumn(component.departures[departure]))
		}
		
	}
}

var schematic = new PangenomeSchematic();

var jsonFile = schematic.readFile();
schematic.processArray(jsonFile);
export default schematic