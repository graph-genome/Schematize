import './App.css';
import schematic from './graphComponent.js'
import ComponentRect from './svgKonvas.js'
import LinkRect from './LinkRect.js'
import ArrowRect from './svgArrow.js'

import { render } from 'react-dom';
import { Stage, Layer } from 'react-konva';

import React, { Component } from 'react';

var stringToColour = function(str, linkColumn, highlightedLinkColumn) {
  if (highlightedLinkColumn && (linkColumn.downstream + 1) * (linkColumn.upstream + 1) 
      === (highlightedLinkColumn.downstream + 1) * (highlightedLinkColumn.upstream + 1)) {
    return 'black';
  } else {
    str = str.toString();
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '#';
    for (var j = 0; j < 3; j++) {
        var value = (hash >> (j * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
  }
};

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
    let paddingSize = 1;
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
                  {schematizeComponent.arrivals.map((linkColumn, j) => 
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
                  )}
                  {schematizeComponent.departures.map((linkColumn, j) => 
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
                  )}
                </React.Fragment>
              )}
            )}
            {this.state.schematize.map((schematizeComponent, i)=> {
              return (
                  <React.Fragment>
                    {schematizeComponent.departures.map((linkColumn, j) => {

                      var xOffsetGrid = (linkColumn.upstream + (i * this.state.paddingSize) + schematizeComponent.offset +
                          (schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length+j);

                      return <ArrowRect
                            key={"arrow" + i+j}
                            //                    x={1 + this.state.leftOffset + (schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset + (schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length+j)*this.state.binsPerPixel}
                            x={1 + this.state.leftOffset + xOffsetGrid*this.state.binsPerPixel}
                            y={this.state.topOffset - 5}
                            //                    points={[this.state.departureDict[schematizeComponent.departures.downstream], this.state.topOffset - 2, this.state.arrivalDict[[schematizeComponent.departures.upstream], this.state.topOffset - 2]}
                            points={[0,-5,
//                    this.state.leftOffset + (schematizeComponent.lastBin + (i * this.state.paddingSize) + schematizeComponent.offset) * this.state.binsPerPixel,
//                    this.state.leftOffset + (linkColumn.uptream + (i * this.state.paddingSize) + schematizeComponent.offset + (schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length)*this.state.binsPerPixel,
0,//                               this.state.leftOffset + (linkColumn.downtream + (i * this.state.paddingSize) + schematizeComponent.offset + (schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length)*this.state.binsPerPixel,
//                    this.state.leftOffset + (linkColumn.upstream + (linkColumn.upstream * this.state.paddingSize) + schematizeComponent.offset + (schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length+j)*this.state.binsPerPixel,
                              5]}
                            //                    points={[this.state.leftOffset + (linkColumn.downstream + (i * this.state.paddingSize) + schematizeComponent.offset + (schematizeComponent.lastBin - schematizeComponent.firstBin + 1))*this.state.binsPerPixel, this.state.topOffset - 2, this.state.leftOffset + linkColumn.downstream, this.state.topOffset - 2]}
                            strokewidth={3}
                            color={stringToColour((linkColumn.downstream + 1) * (linkColumn.upstream + 1))}
                            pointerLength={5}
                            pointerWidth={5}
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

export default App;
