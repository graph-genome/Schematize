import React from 'react';

class PangenomeSchematic extends React.Component {
	constructor(props) {
		super(props);
		// this.props.jsonPath //currently file cannot be a variable because of require()
		this.jsonData = this.readFile('');// this.props.jsonPath
		this.pathNames = this.jsonData.path_names;
		this.processArray(this.props.beginBin, this.props.endBin);
	}
	componentDidUpdate() {
		this.processArray(this.props.beginBin, this.props.endBin);
		console.log("#components: " + this.components);
	}
	readFile(ignored_fileName) {
		// console.log();
		// var jsonFile = require('./data/Athaliana.bin100000.schematic.json'); // This cannot be a variable
		// var jsonFile = require('./data/yeast_bin10k_7indiv_16chr.schematic.json'); // This cannot be a variable
		// const jsonFile = require('./data/sebastian.Athaliana.all.50000.w100000.schematic.1D.json'); // This cannot be a variable
		const jsonFile = require('./data/Athaliana.Jan_sort.bin100000.schematic.json');
		// const jsonFile = require('./data/run1.B1phi1.i1.seqwish.w100.schematic.json'); // ERIKS DATA FROM JANUARY
		// console.log(jsonFile);
		return jsonFile
	}
	processArray(beginBin, endBin) {
	    if(this.jsonData.json_version !== 8){
	        throw MediaError("Wrong Data JSON version: was expecting version 8, got " + this.jsonData.json_version + ".  " +
            "This version introduced first and last nucleotide for each bin/path.  " + // KEEP THIS UP TO DATE!
            "Using a mismatched data file and renderer will cause unpredictable behavior," +
            " instead generate a new data file using github.com/graph-genome/component_segmentation.")
        }
		// while(wrongFile){
		// 	getNextFileName()
		// }
		// let data = getJSONData(filename);
		var componentArray = [];
		var offsetLength = 0;
		for (var component of this.jsonData.components) {
			if(component.first_bin >= beginBin){
				var componentItem = new Component(component, offsetLength);
				offsetLength += componentItem.arrivals.length + componentItem.departures.length-1;
				componentArray.push(componentItem);
				if(component.last_bin > endBin && componentArray.length > 1){break}
			}
		}
		this.components = componentArray;
	}
}

class Component {
	constructor(component, offsetLength) {
		this.offset = offsetLength;
		this.firstBin = component.first_bin;
		this.lastBin = component.last_bin;
		this.arrivals = [];
		for (let arrival of component.arrivals) {
			this.arrivals.push(new LinkColumn(arrival))
		}
		this.departures = [];
		for (let departure of component.departures) { //don't slice off adjacent here
			this.departures.push(new LinkColumn(departure))
		}
		// we do not know the x val for this component, yet
		this.x = 0;
		// deep copy of occupants
		this.occupants = Array.from(component.occupants);
		this.matrix = Array.from(component.matrix);
		this.num_bin = this.lastBin - this.firstBin + 1;
	}
	firstDepartureColumn() {
		return (this.num_bin) + this.arrivals.length;
	}
}

class LinkColumn {
	constructor(linkColumn) {
		this.upstream = linkColumn.upstream;
		this.downstream = linkColumn.downstream;
		this.participants = (linkColumn.participants);//new Set
		this.key = this.edgeToKey()
	}
	edgeToKey() {
		/**downstream and upstream are always in the same orientation regardless of if it is a
		 * departing LinkColumn or an arriving LinkColumn.**/
		return String(this.downstream).padStart(13, '0') + String(this.upstream).padStart(13, '0');
	};

}

export default PangenomeSchematic