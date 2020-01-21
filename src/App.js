import './App.css';
import PangenomeSchematic from './graphComponent.js'
import ComponentRect from './svgKonvas.js'
import LinkRect from './LinkRect.js'
import ArrowRect from './svgArrow.js'

import { render } from 'react-dom';
import {Stage, Layer} from 'react-konva';

import React, { Component } from 'react';

const stringToColor = function(paddedKey, linkColumn, highlightedLinkColumn) {
    if (highlightedLinkColumn && (linkColumn.downstream + 1) * (linkColumn.upstream + 1)
        === (highlightedLinkColumn.downstream + 1) * (highlightedLinkColumn.upstream + 1)) {
        return 'black';
    } else {
        return stringToColourSave(paddedKey);
    }
};

const stringToColourSave = function(paddedKey) {
    paddedKey = paddedKey.toString();
    let hash = 0;
    for (let i = 0; i < paddedKey.length; i++) {
        hash = paddedKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let j = 0; j < 3; j++) {
        let value = (hash >> (j * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
};

const edgeToKey = function(downstream, upstream) {
    /**downstream and upstream are always in the same orientation regardless of if it is a
     * departing LinkColumn or an arriving LinkColumn.**/
    return String(downstream).padStart(13, '0') + String(upstream).padStart(13, '0');
};

function leftPadding(component) {
    return (component.lastBin - component.firstBin + 1) + component.arrivals.length;
}

class App extends Component {
    layerRef = React.createRef();
    static defaultProps = {beginBin:2,
        endBin:500,
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
        console.log(schematic.components);

        this.state = {
            schematize: schematic.components,
            pathNames: schematic.pathNames,
            topOffset: 100,
            pathsPerPixel: 1,
            actualWidth: actualWidth,
            highlightedLinkId: 0 // we will compare linkColumns
        };
        this.updateHighlightedNode = this.updateHighlightedNode.bind(this);

        this.calculateLinkCoordinates();

    };

    calculateLinkCoordinates() {
        /**
         * calculate the x coordinates of all components
         * calculate the x coordinates of all arrivals and departures
         */

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
                let paddedKey = edgeToKey(arrival.downstream, arrival.upstream);
                if (!(paddedKey in this.linkToXmapping)) {
                    //place holder value, go as far right as possible
                    // this.linkToXmapping[paddedKey] = [xCoordArrival,
                    //     this.state.actualWidth + 100]
                    // TODO place holder value in the same place
                    this.linkToXmapping[paddedKey] = [xCoordArrival, xCoordArrival]
                } else {
                    this.linkToXmapping[paddedKey][0] = xCoordArrival; // set with real value
                }
            }
            //DEPARTURES: Calculate all X
            for (let k = 0; k < schematizeComponent.departures.length; k++) {
                let departure = schematizeComponent.departures[k];
                let xCoordDeparture = this.props.leftOffset
                    + (this.leftXStart(schematizeComponent, i)
                        + leftPadding(schematizeComponent)
                        + k) * this.props.binsPerPixel;
                let paddedKey = edgeToKey(departure.downstream, departure.upstream);
                if (!(paddedKey in this.linkToXmapping)) {
                    //place holder value, go as far left as possible
                    // this.linkToXmapping[paddedKey] = [this.state.actualWidth + 100, xCoordDeparture]
                    // TODO place holder value in the same place
                    this.linkToXmapping[paddedKey] = [xCoordDeparture, xCoordDeparture]
                } else {
                    this.linkToXmapping[paddedKey][1] = xCoordDeparture; // set real value
                }
            }
        }
    }

    componentDidMount = () => {
        this.layerRef.current.getCanvas()._canvas.id = 'cnvs';
    };

    updateHighlightedNode = (linkRect) => {
        this.setState({highlightedLinkId: linkRect})
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
        let localColor = stringToColor((linkColumn.downstream + 1) * (linkColumn.upstream + 1), linkColumn, this.state.highlightedLinkId);
        return <LinkRect
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

    renderLinks(j, linkColumn, i) {
        const paddedKey = edgeToKey(linkColumn.downstream, linkColumn.upstream);
        if(paddedKey in this.linksAlreadyRendered) {
            return <React.Fragment/>; // TODO: don't render a duplicate if it's already been done.
            // @Josiah: We should not run into any duplicates.
            // If the hash function is not collision free, we have a design problem.
        }else{
            this.linksAlreadyRendered.add(paddedKey);
        }
        if(!(paddedKey in this.linkToXmapping)) {
            return <React.Fragment/>;
        }
        let link = this.linkToXmapping[paddedKey];
        console.log(link);
        const elevation = -15 - (j * this.props.binsPerPixel);
        let [arrowXCoord, departureX] = link;
        departureX = departureX - arrowXCoord + 2; // put in relative coordinates to
        let arrX = 2;
        let turnDirection = (departureX < 0)? -1.5 : 1.5;
        const departOrigin = [departureX, 0];
        const departCorner = [departureX - turnDirection, elevation + 2];
        let departTop = [departureX - (turnDirection*6), elevation];
        let arriveTop = [arrX + turnDirection*6, elevation];
        let arriveCorner = [arrX + turnDirection, elevation + 2]; // 1.5 in from actual corner
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
        return <ArrowRect
            key={"arrow" + i + j}
            x={arrowXCoord}
            y={this.state.topOffset - 5}
            points={points}
            width={this.props.binsPerPixel}
            color={stringToColor((linkColumn.downstream + 1) * (linkColumn.upstream + 1), linkColumn, this.state.highlightedLinkId)}
            updateHighlightedNode={this.updateHighlightedNode}
            item={linkColumn}
        />
    }

    render() {
        this.linksAlreadyRendered.clear(); // reset counters
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
                                        {this.renderLinksForOneComponent(schematizeComponent, i)}
                                    </React.Fragment>
                                )
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
