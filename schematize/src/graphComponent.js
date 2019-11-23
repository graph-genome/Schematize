let fs = require('fs')


class PangenomeSchematic {
	constructor(fileName) {
		this.jsonPath = fileName;
	}
	readFile(jsonPath) {
		console.log(jsonPath);
		var jsonFile = require('./dump.json')
		console.log(jsonFile)
		return(jsonFile)
	}
	processArray(jsonFile) {
		var componentArray = [];
		for (var component in jsonFile) {
			componentArray.push(new Component(component));
		}
		return (componentArray)
	}
}


class LinkColumn {
	constructor(upstream, downstream, participants) {
		this.upstream = upstream;
		this.downstream = downstream;
		this.participants = participants;
	}
}

class Component {
	constructor(firstBin, lastBin, arrivals, departures) {
		this.firstBin = firstBin;
		this.lastBin = lastBin;
		this.arrivals = []
		for (var arrival in arrivals) {this.arrivals.push(new LinkColumn(arrival))};
		this.departures = []
		for (var departure in departures) {this.departures.push(new LinkColumn(departure))};
	}
}

var testSchematic = new PangenomeSchematic()

var jsonFile = testSchematic.readFile('./dump.json')
var componentArray = testSchematic.processArray(jsonFile)
console.log(componentArray)
