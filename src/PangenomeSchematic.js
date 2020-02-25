import React from 'react';
import {observe} from "mobx";
import * as $ from 'jquery';

class PangenomeSchematic extends React.Component {
	constructor(props) {
		/*Only plain objects will be made observable. For non-plain objects it is considered the
		 responsibility of the constructor to initialize the observable properties. Either use
		 the @observable annotation or the extendObservable function.*/
		super(props);
		this.pathNames = []
		this.components = []
		this.loadIndexFile(this.props.store.jsonName); //initializes this.chunk_index
		this.getJSON(this.props.store.startChunkURL, this.loadJSON.bind(this));
		//whenever jsonName changes,
		observe(this.props.store, "jsonName", () => {
			this.loadIndexFile(this.props.store.jsonName)});
		// console.log("public ", process.env.PUBLIC_URL ) //PUBLIC_URL is empty
	}
	componentDidUpdate() {
		// console.log("#components: " + this.components);
	}
	openRelevantChunk(chunk_index){
		this.chunk_index = chunk_index;
		//only do a new chunk scan if it's needed
		let startFile = chunk_index["files"][0]["file"];
		let nextChunk = null;
		for(let i=0; i < chunk_index["files"].length; ++i){ //linear scan for the right chunk
			let chunk = chunk_index["files"][i];
			if(chunk["last_bin"] >= this.props.store.beginBin && chunk["first_bin"] <= this.props.store.beginBin){
				startFile = chunk["file"]; // retrieve file name
				nextChunk = chunk;  // fallback: if it's last chunk in series
				if(i+1 < chunk_index["files"].length){nextChunk = chunk_index["files"][i+1];}
				console.log("Opening chunk", startFile, nextChunk["file"])
				//restrict end position to end of the new chunk
				this.props.store.updateEnd(Math.min(nextChunk["last_bin"], this.props.store.endBin));
				break; // done scanning
			}
		}
		//will trigger chunk update in App.nextChunk() which calls this.loadJSON
		this.props.store.switchChunkFiles(
			process.env.PUBLIC_URL + 'test_data/' + this.props.store.jsonName + '/' + startFile,
			process.env.PUBLIC_URL + 'test_data/' + this.props.store.jsonName + '/' + nextChunk["file"]);
	}
	loadIndexFile(jsonFilename){
		let indexPath = process.env.PUBLIC_URL + 'test_data/' + jsonFilename + '/bin2file.json'
		console.log("Reading", indexPath);
		$.getJSON(indexPath, this.openRelevantChunk.bind(this)).fail(function() {
			alert( "error" );
		})
	}
	getJSON(filepath, callback) {
		console.log("Fetching", filepath);
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
        // not async because there's nothing to render without the file
		xobj.open('GET', process.env.PUBLIC_URL + filepath, false);
		xobj.onreadystatechange = function () {
			if (xobj.readyState === 4 && xobj.status === 200) {
				// Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
				callback(xobj.responseText);
			}
		};
		xobj.send(null);
	}
	loadJSON(data){
		this.jsonData = JSON.parse(data);
		this.pathNames = this.jsonData.path_names;
		this.processArray();
	}

	processArray() {
		/*parses beginBin to endBin range, returns false if new file needed*/
		if(!this.jsonData){
			return false;
		}
		let [beginBin, endBin] = [this.props.store.beginBin, this.props.store.endBin];
	    if(this.jsonData.json_version !== 10){
	        throw MediaError("Wrong Data JSON version: was expecting version 10, got " + this.jsonData.json_version + ".  " +
            "This version added last_bin to data chunk index.  " + // KEEP THIS UP TO DATE!
            "Using a mismatched data file and renderer will cause unpredictable behavior," +
            " instead generate a new data file using github.com/graph-genome/component_segmentation.")
        }
		console.log("Parsing components ", beginBin, " - ", endBin);

		if(this.props.store.beginBin > this.jsonData.components.slice(-1)[0].last_bin ||
			this.props.store.beginBin < this.jsonData.components[0].first_bin) {
			//only do a new chunk scan if it's needed
			this.openRelevantChunk(this.chunk_index); // this will trigger a second update cycle
			return false;
		}else {
			var componentArray = [];
			var offsetLength = 0;
			for (var component of this.jsonData.components) {
				if (component.last_bin >= beginBin) {
					var componentItem = new Component(component, offsetLength);
					offsetLength += componentItem.arrivals.length + componentItem.departures.length - 1;
					componentArray.push(componentItem);
					if (component.first_bin > endBin && componentArray.length > 1) {
						break
					}
				}
			}
			this.components = componentArray;
			return true;
		}
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