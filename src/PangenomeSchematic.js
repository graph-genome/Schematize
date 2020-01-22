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
		console.log(this.components);

	}
	readFile(ignored_fileName) {
		// console.log();
		// var jsonFile = require('./data/Athaliana.bin100000.schematic.json'); // This cannot be a variable
		// var jsonFile = require('./data/yeast_bin10k_7indiv_16chr.schematic.json'); // This cannot be a variable
		const jsonFile = require('./data/sebastian.Athaliana.all.50000.w100000.schematic.json'); // This cannot be a variable
		// console.log(jsonFile);
		return jsonFile
	}
	processArray(beginBin, endBin) {
		var componentArray = [];
		var offsetLength = 0;
		for (var component of this.jsonData.components) {
			if(component.first_bin >= beginBin){
				var componentItem = new Component(component, offsetLength);
				offsetLength += componentItem.arrivals.length + componentItem.departures.length;
				componentArray.push(componentItem);
				if(component.last_bin > endBin){break} // TODO: this limit was set for debugging
			}
		}
		this.components = componentArray;
		return (componentArray)
	}
}

class Component {
	constructor(component, offsetLength) {
//firstBin, lastBin, arrivals, departures) {
		this.offset = offsetLength;
		this.firstBin = component.first_bin;
		this.lastBin = component.last_bin;
		this.arrivals = [];
		for (let arrival of component.arrivals) {
			this.arrivals.push(new LinkColumn(arrival))
		}
		this.departures = [];
		for (let departure of component.departures) {
			this.departures.push(new LinkColumn(departure))
		}
		// we do not know the x val for this component, yet
		this.x = 0;
	}
	leftPadding() {
		return (this.lastBin - this.firstBin + 1) + this.arrivals.length;
	}
}

class LinkColumn {
	constructor(linkColumn) {
		this.upstream = linkColumn.upstream;
		this.downstream = linkColumn.downstream;
		this.participants = (linkColumn.participants);//new Set
	}
	edgeToKey() {
		/**downstream and upstream are always in the same orientation regardless of if it is a
		 * departing LinkColumn or an arriving LinkColumn.**/
		return String(this.downstream).padStart(13, '0') + String(this.upstream).padStart(13, '0');
	};

}


export default PangenomeSchematic