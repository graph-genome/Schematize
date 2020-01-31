import {Layer, Stage} from 'react-konva';
import React, {Component} from 'react';

import './App.css';
import PangenomeSchematic from './PangenomeSchematic'
import ComponentRect from './ComponentRect'
import LinkColumn from './LinkColumn'
import LinkArrow from './LinkArrow'
import ComponentConnectorRect from './ComponentConnectorRect'
import {calculateLinkCoordinates} from "./LinkRecord";

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

class App extends Component {
    layerRef = React.createRef();
    constructor(props) {
        super(props);
        const {beginBin, endBin} = this.props.store;
        let schematic = new PangenomeSchematic({beginBin, endBin});
        console.log(schematic.pathNames.length);
        const sum = (accumulator, currentValue) => accumulator + currentValue;
        let actualWidth = this.props.store.leftOffset + schematic.components.map(component =>
            component.arrivals.length + component.departures.length + (component.lastBin - component.firstBin) + 1 + this.props.store.paddingSize
        ).reduce(sum) * this.props.store.binsPerPixel;
        console.log(actualWidth);
        // console.log(schematic.components);
        this.state = {
            schematize: schematic.components,
            pathNames: schematic.pathNames,
            actualWidth: actualWidth
        };
        this.updateHighlightedNode = this.updateHighlightedNode.bind(this);

        let [links, top] =
            calculateLinkCoordinates(schematic.components, this.props.store.binsPerPixel, this.props.store.topOffset,
                this.leftXStart.bind(this));
        this.distanceSortedLinks = links;
        this.props.store.updateTopOffset(top);
        this.oneComponentConnector = ["1"] // FIXME this is for testing
    };

    componentDidMount = () => {
        this.layerRef.current.getCanvas()._canvas.id = 'cnvs';
    };

    updateHighlightedNode = (linkRect) => {
        this.setState({highlightedLink: linkRect});
        // this.props.store.updateHighlightedLink(linkRect); // TODO this does not work, ask Robert about it
    };

    leftXStart(schematizeComponent, i) {
        return (schematizeComponent.firstBin - this.props.store.beginBin) + (i * this.props.store.paddingSize) + schematizeComponent.offset;
    }


    renderComponent(schematizeComponent, i) {
        return (
            <React.Fragment>
                <ComponentRect
                    item={schematizeComponent}
                    key={i}
                    x={this.state.schematize[i].x + this.props.store.leftOffset}
                    y={this.props.store.topOffset}
                    height={this.state.pathNames.length * this.props.store.pathsPerPixel}
                    width={(schematizeComponent.leftPadding() + schematizeComponent.departures.length) * this.props.store.binsPerPixel}
                />

                {schematizeComponent.arrivals.map(
                    (linkColumn, j) => {
                        let leftPad = 0;
                        return this.renderLinkColumn(schematizeComponent, i, leftPad, j, linkColumn);
                    }
                )}
                {schematizeComponent.departures.map(
                    (linkColumn, j) => {
                        let leftPad = schematizeComponent.leftPadding();
                        return this.renderLinkColumn(schematizeComponent, i, leftPad, j, linkColumn);
                    }
                )}
                {schematizeComponent.occupants.map(
                    (occupant, j) => {
                        return this.renderOccupants(occupant, i, j);
                    }
                )}
{/*                {schematizeComponent.occupants.map(
                    (componentConnector, j) => {
                        return this.renderComponentConnector(componentConnector, i, j);
                    }
                )}*/}
            </React.Fragment>
        )
    }

    renderOccupants(occupant, i, j) {
        const schema = this.state.schematize[i];
        const x_val = this.props.store.leftOffset + schema.x + (schema.arrivals.length * this.props.store.binsPerPixel);
        const width = schema.leftPadding() * this.props.store.binsPerPixel - (schema.arrivals.length * this.props.store.binsPerPixel);
        if (occupant) {
            return <ComponentConnectorRect
                key={"occupant" + i + j}
                x={x_val}
                y={this.props.store.topOffset + j}
                width={width}
            />
        } else {
            return null
        }
    }

    renderComponentConnector(componentConnector, i , j) {
        // x is the (num_bins + num_arrivals + num_departures)*binsPerPixel
        const schema = this.state.schematize[i];
        const x_val = this.props.store.leftOffset + schema.x + (schema.leftPadding() + schema.departures.length) * this.props.store.binsPerPixel;
        if (componentConnector) {
            return <ComponentConnectorRect
                key={"occupant" + i + j}
                x={x_val}
                y={this.props.store.topOffset + j}
                width={this.props.store.binsPerPixel * 2}
            />
        } else {
            return null
        }
    }

    renderLinkColumn(schematizeComponent, i, leftPadding, j, linkColumn) {
        let xCoordArrival = this.props.store.leftOffset + (this.leftXStart(schematizeComponent,i) + leftPadding + j) * this.props.store.binsPerPixel;
        let localColor = stringToColor(linkColumn, this.state.highlightedLink);
        return <LinkColumn
            key={"departure" + i + j}
            item={linkColumn}
            pathNames={this.state.pathNames}
            x={xCoordArrival}
            pathsPerPixel={this.props.store.pathsPerPixel}
            y={this.props.store.topOffset}
            width={this.props.store.binsPerPixel}
            color={localColor}
            updateHighlightedNode={this.updateHighlightedNode}
        />
    }

    renderLink(link) {
        /*Translates the LinkRecord coordinates into pixels and defines the curve shape.
        * I've spent way too long fiddling with these numbers at different binsPerPixel
        * I suggest you don't fiddle with them unless you plan on nesting the React
        * Components to ensure that everything is relative coordinates.*/
        let [arrowXCoord, absDepartureX] = [link.xArrival, link.xDepart];
        // put in relative coordinates to arriving LinkColumn
        let departureX = absDepartureX - arrowXCoord + this.props.store.binsPerPixel/2;
        let arrX = this.props.store.binsPerPixel/2;
        let bottom = -2;//-this.props.store.binsPerPixel;
        let turnDirection = (departureX < 0)? -1 : 1;
        const departOrigin = [departureX, this.props.store.binsPerPixel-2];
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
            arrX, -1];
        if (Math.abs(departureX) <= this.props.store.binsPerPixel) { // FIXME Small distances, usually self loops
            if(link.isArrival){
                points = [
                    arrX, -10,//-link.elevation - 4,
                    arrX, bottom];
            }else{
                points = [
                    departOrigin[0], bottom + this.props.store.binsPerPixel,
                    departOrigin[0], -5];//-link.elevation-this.props.store.binsPerPixel*2,];
            }

        }
        if(points.some(isNaN)){
            console.log("Some points are NaN: " + points);
        }
        return <LinkArrow
            key={"arrow" + link.linkColumn.key}
            x={arrowXCoord + this.props.store.leftOffset}
            y={this.props.store.topOffset - 5}
            points={points}
            width={this.props.store.binsPerPixel}
            color={stringToColor(link.linkColumn, this.state.highlightedLink)}
            updateHighlightedNode={this.updateHighlightedNode}
            item={link.linkColumn}
        />
    }

    render() {
        console.log("Start render");
        return (
            <React.Fragment>
                <Stage
                    width={this.state.actualWidth + 20}
                    height={this.props.store.topOffset + this.state.pathNames.length * this.props.store.pathsPerPixel}>
                    <Layer ref={this.layerRef}>
                        {this.state.schematize.map(
                            (schematizeComponent, i)=> {
                                return (
                                    <React.Fragment key={"f" + i}>
                                        {/*These two lines could be in separate for loops if you want control over ordering*/}
                                        {this.renderComponent(schematizeComponent, i)}
                                    </React.Fragment>
                                )
                            }
                        )}
                        {this.distanceSortedLinks.map(
                            (record,i ) => {
                                return (<React.Fragment key={'L'+ i}>
                                    {this.renderLink(record)}
                                </React.Fragment>)
                            }
                        )}
                    </Layer>
                </Stage>
            </React.Fragment>
        );
    }

}

// render(<App />, document.getElementById('root'));

export default App;