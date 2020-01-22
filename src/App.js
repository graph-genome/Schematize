import {render} from 'react-dom';
import {Layer, Stage} from 'react-konva';
import React, {Component} from 'react';

import './App.css';
import PangenomeSchematic from './PangenomeSchematic.js'
import ComponentRect from './ComponentRect.js'
import LinkColumn from './LinkColumn.js'
import LinkArrow from './LinkArrow.js'
import {LinkRecord} from "./LinkArrow";

function stringToColor(linkColumn, highlightedLinkColumn) {
    let colorKey = (linkColumn.downstream + 1) * (linkColumn.upstream + 1);
    if (highlightedLinkColumn && colorKey
        === (highlightedLinkColumn.downstream + 1) * (highlightedLinkColumn.upstream + 1)) {
        return 'black';
    } else {
        return stringToColourSave(colorKey);
    }
}

const stringToColourSave = function(colorKey) {
    colorKey = colorKey.toString();
    let hash = 0;
    for (let i = 0; i < colorKey.length; i++) {
        hash = colorKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let j = 0; j < 3; j++) {
        let value = (hash >> (j * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
};

function leftPadding(component) {
    return (component.lastBin - component.firstBin + 1) + component.arrivals.length;
}

class App extends Component {
    layerRef = React.createRef();
    static defaultProps = {beginBin:2000,
        endBin:3000,
        binsPerPixel:6,
        paddingSize:2,
        leftOffset:10
    };
    constructor(props) {
        Object.assign(App.defaultProps, props);
        super(props);
        let schematic = new PangenomeSchematic(props);
        const sum = (accumulator, currentValue) => accumulator + currentValue;
        let actualWidth = this.props.leftOffset + schematic.components.map(component =>
            component.arrivals.length + component.departures.length + (component.lastBin - component.firstBin) + 1 + this.props.paddingSize
        ).reduce(sum) * this.props.binsPerPixel;
        console.log(actualWidth);
        // console.log(schematic.components);

        this.state = {
            schematize: schematic.components,
            pathNames: schematic.pathNames,
            topOffset: 400,
            pathsPerPixel: 1,
            actualWidth: actualWidth,
            highlightedLink: 0 // we will compare linkColumns
        };
        this.updateHighlightedNode = this.updateHighlightedNode.bind(this);

        this.calculateLinkCoordinates();
    };

    calculateLinkCoordinates() {
        /** calculate the x coordinates of all components
         * calculate the x coordinates of all arrivals and departures */

        /* In this dictionary the key is the global unique paddedKey created by @edgetoKey.
        The value is a list of size 2:
        1. Element: the x-coordinate of the arrival link column
        2. Element: the x-coordinate of the corresponding departure link column */
        this.linkToXmapping = {}; //(paddedKey): [arrivalX, departureX]
        this.linksAlreadyRendered = new Set(); // set of links (padded Keys) which have already been rendered.

        for (let i = 0; i < this.state.schematize.length; i++) {
            let schematizeComponent = this.state.schematize[i];
            schematizeComponent.x = this.props.leftOffset + (this.leftXStart(schematizeComponent, i)) * this.props.binsPerPixel;
            //ARRIVALS: Calculate all X
            for (let j = 0; j < schematizeComponent.arrivals.length; j++) {
                let arrival = schematizeComponent.arrivals[j];
                let xCoordArrival = this.props.leftOffset +
                    (this.leftXStart(schematizeComponent, i) + j) * this.props.binsPerPixel;
                let paddedKey = arrival.edgeToKey();
                if (!(paddedKey in this.linkToXmapping)) {
                    //place holder value, go as far right as possible
                    // this.linkToXmapping[paddedKey] = [xCoordArrival,
                    //     this.state.actualWidth + 100]
                    // TODO place holder value in the same place
                    this.linkToXmapping[paddedKey] = new LinkRecord(arrival, xCoordArrival, xCoordArrival)
                } else {
                    this.linkToXmapping[paddedKey].xArrival = xCoordArrival; // set with real value
                }
            }
            //DEPARTURES: Calculate all X
            for (let k = 0; k < schematizeComponent.departures.length; k++) {
                let departure = schematizeComponent.departures[k];
                let xCoordDeparture = this.props.leftOffset
                    + (this.leftXStart(schematizeComponent, i)
                        + leftPadding(schematizeComponent)
                        + k) * this.props.binsPerPixel;
                let paddedKey = departure.edgeToKey();
                if (!(paddedKey in this.linkToXmapping)) {
                    //place holder value, go as far left as possible
                    // this.linkToXmapping[paddedKey] = [this.state.actualWidth + 100, xCoordDeparture]
                    this.linkToXmapping[paddedKey] = new LinkRecord(departure, xCoordDeparture, xCoordDeparture)
                } else {
                    this.linkToXmapping[paddedKey].xDepart = xCoordDeparture; // set real value
                }
            }
        }
        this.calculateLinkElevations();
    }

    calculateLinkElevations() {
        /**Starting with the shortest links, claim a spot of elevation to place the link in.
         * As the links get bigger, you take the max() of the range of the link and add 1.
         * This claims the "air space" for that link to travel through without colliding with anything.
         * The longest link should end up on top.  We'll probably need a "link gutter" maximum to keep
         * this from getting unreasonably tall.**/
        this.distanceSortedLinks = Object.values(this.linkToXmapping).sort(
            (a,b)=> a.distance() - b.distance()
        );
        this.reserveElevationAirSpace();
        // this.state.topOffset = Math.max(this.elevationOccupied);
    }

    reserveElevationAirSpace(){
        /* Set up an array of zeros, then gradually fill it with height stacking
        * @Simon this section is largely done, it just needs a sorted distanceSortedLinks as input*/
        let length = this.state.actualWidth; //this.props.endBin - this.props.beginBin;
        this.elevationOccupied = new Array(length).fill(10);
        for (let record of this.distanceSortedLinks) {
            let linkBegin = Math.min(record.xArrival, record.xDepart);
            let linkEnd = Math.max(record.xArrival, record.xDepart);
            let elevation = Math.max(...this.elevationOccupied.slice(linkBegin, linkEnd + 1));
            if(isNaN(elevation)){
                console.log(record, linkBegin, linkEnd);
            }
            elevation += this.props.binsPerPixel;
            for (let x = linkBegin; x < linkEnd && x < this.elevationOccupied.length; x++) {
                this.elevationOccupied[x] = elevation;
            }
            record.elevation = elevation; //storing final value for render
        }
    }

    componentDidMount = () => {
        this.layerRef.current.getCanvas()._canvas.id = 'cnvs';
    };

    updateHighlightedNode = (linkRect) => {
        this.setState({highlightedLink: linkRect})
    };

    leftXStart(schematizeComponent, i) {
        return (schematizeComponent.firstBin - this.props.beginBin) + (i * this.props.paddingSize) + schematizeComponent.offset;
    }


    renderComponent(schematizeComponent, i) {
        return (
            <React.Fragment>
                <ComponentRect
                    item={schematizeComponent}
                    key={i}
                    x={this.state.schematize[i].x}
                    y={this.state.topOffset}
                    height={this.state.pathNames.length * this.state.pathsPerPixel}
                    width={(leftPadding(schematizeComponent) + schematizeComponent.departures.length) * this.props.binsPerPixel}
                />

                {schematizeComponent.arrivals.map(
                    (linkColumn, j) => {
                        let leftPad = 0;
                        return this.renderLinkColumn(schematizeComponent, i, leftPad, j, linkColumn);
                    }
                )}
                {schematizeComponent.departures.map(
                    (linkColumn, j) => {
                        let leftPad = leftPadding(schematizeComponent);
                        return this.renderLinkColumn(schematizeComponent, i, leftPad, j, linkColumn);
                    }
                )}
            </React.Fragment>
        )
    }

    renderLinkColumn(schematizeComponent, i, leftPadding, j, linkColumn) {
        let xCoordArrival = this.props.leftOffset + (this.leftXStart(schematizeComponent,i) + leftPadding + j) * this.props.binsPerPixel;
        let localColor = stringToColor(linkColumn, this.state.highlightedLink);
        return <LinkColumn
            key={"departure" + i + j}
            item={linkColumn}
            pathNames={this.state.pathNames}
            x={xCoordArrival}
            pathsPerPixel={this.state.pathsPerPixel}
            y={this.state.topOffset}
            width={this.props.binsPerPixel}
            color={localColor}
            updateHighlightedNode={this.updateHighlightedNode}
        />
    }

    renderLinksForOneComponent(schematizeComponent, i) {
        // if (i < 2){return <React.Fragment/>}  //FIXME: don't render telomeres. Comment by @subwaystation: Disabling
        // this does not bring back the rendering of the telomeres.
        return (
            <React.Fragment>
                {schematizeComponent.arrivals.map((linkColumn, j) => {
                    return this.renderLinks(j, linkColumn, i);
                })}
                {schematizeComponent.departures.map((linkColumn, k) => {
                    return this.renderLinks(k, linkColumn, i);
                })}
            </React.Fragment>
        )
    }

    renderLinks(link) {

        let [arrowXCoord, absDepartureX] = [link.xArrival, link.xDepart];
        // put in relative coordinates to arriving LinkColumn
        let departureX = absDepartureX - arrowXCoord + this.props.binsPerPixel/2;
        let arrX = 2;
        let turnDirection = (departureX < 0)? -1.5 : 1.5;
        const departOrigin = [departureX, 0];
        const departCorner = [departureX - turnDirection, -link.elevation + 2];
        let departTop = [departureX - (turnDirection*6), -link.elevation];
        let arriveTop = [arrX + turnDirection*6, -link.elevation];
        let arriveCorner = [arrX + turnDirection, -link.elevation + 2]; // 1.5 in from actual corner
        const arriveCornerEnd = [arrX, -5];
        let points = [
            departOrigin[0], departOrigin[1],
            departCorner[0], departCorner[1],
            departTop[0], departTop[1],
            arriveTop[0], arriveTop[1],
            arriveCorner[0], arriveCorner[1],
            arriveCornerEnd[0], arriveCornerEnd[1],
            arrX, 0];
        if (Math.abs(departureX) <= 12) { //Small distances, usually self loops
            points = [
                departOrigin[0], departOrigin[1],
                departCorner[0], departCorner[1],
                arriveCorner[0], arriveCorner[1],
                arrX, 0];
        }
        if(points.some(isNaN)){
            console.log(points);
        }
        return <LinkArrow
            key={"arrow" + link.linkColumn.edgeToKey()}
            x={arrowXCoord}
            y={this.state.topOffset - 5}
            points={points}
            width={this.props.binsPerPixel}
            color={stringToColor(link.linkColumn, this.state.highlightedLink)}
            updateHighlightedNode={this.updateHighlightedNode}
            item={link.linkColumn}
        />
    }

    render() {
        this.linksAlreadyRendered.clear(); // reset counters
        console.log("Start render");
        return (
            <React.Fragment>
                <Stage
                    width={this.state.actualWidth + 20}
                    height={this.state.topOffset + this.state.pathNames.length * this.state.pathsPerPixel}>
                    <Layer ref={this.layerRef}>
                        {this.state.schematize.map(
                            (schematizeComponent, i)=> {
                                return (
                                    <React.Fragment>
                                        {/*These two lines could be in separate for loops if you want control over ordering*/}
                                        {this.renderComponent(schematizeComponent, i)}
                                        {/*{this.renderLinksForOneComponent(schematizeComponent, i)}*/}
                                    </React.Fragment>
                                )
                            }
                        )}
                        {this.distanceSortedLinks.map(
                            (record, k) => {
                                return (<React.Fragment>
                                    {this.renderLinks(record)}
                                </React.Fragment>)
                            }
                        )}
                    </Layer>
                </Stage>
            </React.Fragment>
        );
    }

}

render(<App />, document.getElementById('root'));

export default App;
