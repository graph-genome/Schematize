import './App.css';
import schematic from './graphComponent.js'
import ComponentRect from './svgKonvas.js'
import LinkRect from './LinkRect.js'
import ArrowRect from './svgArrow.js'

import { render } from 'react-dom';
import {Stage, Layer} from 'react-konva';

import React, { Component } from 'react';

const stringToColour = function(str, linkColumn, highlightedLinkColumn) {
    if (highlightedLinkColumn && (linkColumn.downstream + 1) * (linkColumn.upstream + 1)
      === (highlightedLinkColumn.downstream + 1) * (highlightedLinkColumn.upstream + 1)) {
    return 'black';
  } else {
    str = str.toString();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let j = 0; j < 3; j++) {
        let value = (hash >> (j * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
  }
};

const stringToColourSave = function(str, linkColumn, highlightedLinkColumn) {
    str = str.toString();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let j = 0; j < 3; j++) {
        let value = (hash >> (j * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
};

/*
In this dictionary the key is the global unique color string created by @stringToColor.
The value is a list of size 2:
1. Element: the x-coordinate of the arrival link column
2. Element: the x-coordinate of the corresponding departure link column
 */
const colToCoordMappingX = {};

class App extends Component {
  layerRef = React.createRef();
  constructor(props) {
    super(props);
/*
    console.log({schematize})
    React.useEffect(() => {
      this.layerRef.current.getCanvas()._canvas.id = 'cnvs';
    }, []);*/
    let binsPerPixel = 4;
    let paddingSize = 2;
    let leftOffset = 10;
    const reducer = (accumulator, currentValue) => accumulator + currentValue;
    let actualWidth = leftOffset + schematic.components.map(component => component.arrivals.length + component.departures.length + (component.lastBin - component.firstBin) + 1 + paddingSize).reduce(reducer) * binsPerPixel;
    console.log(actualWidth);
    this.state = { 
      schematize: schematic.components, 
      pathNames: schematic.pathNames, 
      paddingSize: paddingSize,
      topOffset: 100,
      leftOffset: leftOffset,
      binsPerPixel: binsPerPixel,
      pathsPerPixel: 1,
      actualWidth: actualWidth,
      highlightedLinkId: 0 // we will compare linkColumns
    };
    this.updateHighlightedNode = this.updateHighlightedNode.bind(this)
    for (let i = 0; i < schematic.components.length; i++) {
      let schematizeComponent = schematic.components[i];
      for (let j = 0; j < schematizeComponent.arrivals.length; j++) {
        let arrival = schematizeComponent.arrivals[j];
        let xCoordArrival = this.state.leftOffset + (schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset + j) * this.state.binsPerPixel;
        let localColor = stringToColour((arrival.downstream + 1) * (arrival.upstream + 1));
        if (!(localColor in colToCoordMappingX)) {
          // we want that component to go as far left as possible
          colToCoordMappingX[localColor] = [xCoordArrival, this.state.actualWidth + 100]
        } else {
          let colToCoordMappingXArray = colToCoordMappingX[localColor];
          colToCoordMappingXArray[0] = xCoordArrival;
          colToCoordMappingX[localColor] = colToCoordMappingXArray;
        }
      }
      for (let k = 0; k < schematizeComponent.departures.length; k++) {
        let departure = schematizeComponent.departures[k];
        let xCoordDeparture = this.state.leftOffset + (schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset + (schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length+k)*this.state.binsPerPixel;
        let localColor = stringToColour((departure.downstream + 1) * (departure.upstream + 1));
        if (!(localColor in colToCoordMappingX)) {
          colToCoordMappingX[localColor] = [this.state.actualWidth + 100, xCoordDeparture]
        } else {
          let colToCoordMappingXArray = colToCoordMappingX[localColor];
          colToCoordMappingXArray[1] = xCoordDeparture;
          colToCoordMappingX[localColor] = colToCoordMappingXArray;
        }
      }
    }
  };

  componentDidMount = () => {
    /* attach listeners to google StreetView */
    this.layerRef.current.getCanvas()._canvas.id = 'cnvs';
  };

  updateHighlightedNode = (linkRect) => {
      this.setState({highlightedLinkId: linkRect})
  };

  render() {
    return (
      <React.Fragment>
        <Stage width={this.state.actualWidth + 20} height={this.state.topOffset + this.state.pathNames.length * this.state.pathsPerPixel}>
          <Layer ref={this.layerRef}>
            {this.state.schematize.map((schematizeComponent, i)=> {
              return (
                  <React.Fragment>
                    <ComponentRect
                        item={schematizeComponent}
                        key={i}
                        x={this.state.leftOffset + (schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset) * this.state.binsPerPixel}
                        y={this.state.topOffset}
                        height={this.state.pathNames.length * this.state.pathsPerPixel}
                        width={((schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length + schematizeComponent.departures.length) * this.state.binsPerPixel}
                        /*numPoints={5}
                        innerRadius={20}
                        outerRadius={40}
                        fill="#89b717"
                        opacity={0.8}
                        draggable
                        rotation={Math.random() * 180}
                        shadowColor="black"
                        shadowBlur={10}
                        shadowOpacity={0.6}
                        onDragStart={this.handleDragStart}
                        onDragEnd={this.handleDragEnd}*/
                    />
{/*                    {schematizeComponent.arrivals.map((linkColumn, j) =>
                        <LinkRect
                            key={"arrival" + i + j}
                            item={linkColumn}
                            pathNames={this.state.pathNames}
                            x={this.state.leftOffset + (schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset + j) * this.state.binsPerPixel}
                            pathsPerPixel={this.state.pathsPerPixel}
                            y={this.state.topOffset}
                            width={this.state.binsPerPixel}
                            number={(linkColumn.downstream + 1) * (linkColumn.upstream + 1)}
                            color={stringToColour((linkColumn.downstream + 1) * (linkColumn.upstream + 1), linkColumn, this.state.highlightedLinkId)}
                            updateHighlightedNode={this.updateHighlightedNode}
                        />
                    )}*/}
                      {schematizeComponent.arrivals.map((linkColumn, j) => {
                        let xCoordArrival = this.state.leftOffset + (schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset + j) * this.state.binsPerPixel;
                        let localColor = stringToColour((linkColumn.downstream + 1) * (linkColumn.upstream + 1), linkColumn, this.state.highlightedLinkId);
                          return <LinkRect
                              key={"arrival" + i + j}
                              item={linkColumn}
                              pathNames={this.state.pathNames}
                              x={xCoordArrival}
                              pathsPerPixel={this.state.pathsPerPixel}
                              y={this.state.topOffset}
                              width={this.state.binsPerPixel}
                              number={(linkColumn.downstream + 1) * (linkColumn.upstream + 1)}
                              color={localColor}
                              updateHighlightedNode={this.updateHighlightedNode}
                          />
                          }
                      )}
                    {/*{schematizeComponent.departures.map((linkColumn, j) =>
                        <LinkRect
                            key={"departure" + i + j}
                            item={linkColumn}
                            pathNames={this.state.pathNames}
                            x={this.state.leftOffset + (schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset + (schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length+j)*this.state.binsPerPixel}
                            pathsPerPixel={this.state.pathsPerPixel}
                            y={this.state.topOffset}
                            width={this.state.binsPerPixel}
                            color={stringToColour((linkColumn.downstream + 1) * (linkColumn.upstream + 1), linkColumn, this.state.highlightedLinkId)}
                            updateHighlightedNode={this.updateHighlightedNode}
                        />
                    )}*/}
                      {schematizeComponent.departures.map((linkColumn, j) => {
                          let localColor = stringToColour((linkColumn.downstream + 1) * (linkColumn.upstream + 1), linkColumn, this.state.highlightedLinkId);
                            return  <LinkRect
                                  key={"departure" + i + j}
                                  item={linkColumn}
                                  pathNames={this.state.pathNames}
                                  x={this.state.leftOffset + (schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset + (schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length+j)*this.state.binsPerPixel}
                                  pathsPerPixel={this.state.pathsPerPixel}
                                  y={this.state.topOffset}
                                  width={this.state.binsPerPixel}
                                  color={localColor}
                                  updateHighlightedNode={this.updateHighlightedNode}
                              />
                      }
                      )}
                  </React.Fragment>
              )}
            )}
            {this.state.schematize.map((schematizeComponent, i)=> {
              return (
                  <React.Fragment>
                    {schematizeComponent.arrivals.map((linkColumn, j) => {
                      const elevation = -15 - (j*this.state.binsPerPixel);
                      const xOffsetGrid = (linkColumn.downstream + (i * this.state.paddingSize) + schematizeComponent.offset +
                          (schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + j) - .75;
                      // const departureX = departure.offset + departure.arrivals.length;
                      const localColor = stringToColourSave((linkColumn.downstream + 1) * (linkColumn.upstream + 1));
                      let departureX = colToCoordMappingX[localColor][1];

                      const arrowXCoord =  1 + this.state.leftOffset + xOffsetGrid*this.state.binsPerPixel;

                      departureX =  departureX - arrowXCoord + 2;

                        const departOrigin = [departureX, 0];
                        const departCorner = [departureX - 2, elevation + 2];
                        let departTop = [departureX-10, elevation];
                        let arriveTop = [10, elevation];
                        let arriveCorner = [1.5, elevation + 1.5]; // 1.5 in from actual corner
                        const arriveCornerEnd = [0,-5];
                        // we ran into a minimal sized arrow
                      if (departureX <= 12) {
                          departTop = [0, elevation + 2];
                          arriveTop = [10 - 10 + 4, elevation + 2];
                          arriveCorner = [0, elevation + 1.5]; // 1.5 in from actual corner
                      }
                      return <ArrowRect
                            key={"arrow" + i+j}
                            x={arrowXCoord}
                            y={this.state.topOffset - 5}
                            points={[
                              departOrigin[0], departOrigin[1],
                              departCorner[0], departCorner[1],
                              departTop[0], departTop[1],
                              arriveTop[0], arriveTop[1],
                              arriveCorner[0], arriveCorner[1],
                              arriveCornerEnd[0], arriveCornerEnd[1],
                              0,0]}
                            width={this.state.binsPerPixel}
                            color={stringToColour((linkColumn.downstream + 1) * (linkColumn.upstream + 1), linkColumn, this.state.highlightedLinkId)}
                        />})}
                  </React.Fragment>
              )
            })}
          </Layer>
        </Stage>
      </React.Fragment>
    );
  }
}
 
render(<App />, document.getElementById('root'));
console.log(colToCoordMappingX);

export default App;
