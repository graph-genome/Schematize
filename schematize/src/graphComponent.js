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
			var jsonIndex = new Component(component)
			componentArray.push(jsonFile[jsonIndex]);
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
	constructor(test) {
//firstBin, lastBin, arrivals, departures) {
		console.log(test);
		/*/
		this.firstBin = firstBin;
		this.lastBin = lastBin;
		this.arrivals = []
		for (var arrival in arrivals) {this.arrivals.push(new LinkColumn(arrival))};
		this.departures = []
		for (var departure in departures) {this.departures.push(new LinkColumn(departure))};
		/*/
	}
}

var testSchematic = new PangenomeSchematic()

var jsonFile = testSchematic.readFile('./dump.json')
var componentArray = testSchematic.processArray(jsonFile)
export default componentArray
