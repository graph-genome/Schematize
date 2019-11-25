import Konva from 'konva';
import logo from './logo.svg';
import './App.css';
import schematic from './graphComponent.js'
import ComponentRect from './svgKonvas.js'
import LinkRect from './LinkRect.js'

import { render } from 'react-dom';
import { Stage, Layer, Rect, Text } from 'react-konva';

import React, { Component } from 'react';
//import { SceneCanvas } from 'konva/types/Canvas';

var stringToColour = function(str) {
  str = str.toString()
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
}

class App extends Component {
  layerRef = React.createRef();
  constructor(props) {
    super(props);
/*
    console.log({schematize})
    React.useEffect(() => {
      this.layerRef.current.getCanvas()._canvas.id = 'cnvs';
    }, []);*/
    let binsPerPixel = 1;
    let paddingSize = 2;
    const reducer = (accumulator, currentValue) => accumulator + currentValue;
    let actualWidth = schematic.components.map(component => component.arrivals.length + component.departures.length + component.lastBin - component.firstBin + 1 + paddingSize).reduce(reducer) * binsPerPixel;
    console.log(actualWidth);
    this.state = { 
      schematize: schematic.components, 
      pathNames: schematic.pathNames, 
      paddingSize: paddingSize,
      topOffset: 100,
      leftOffset: 10,
      binsPerPixel: binsPerPixel,
      pathsPerPixel: 2,
      actualWidth: actualWidth
    }
  };

  componentDidMount = () => {
    /* attach listeners to google StreetView */
    this.layerRef.current.getCanvas()._canvas.id = 'cnvs';
  }

  render() {
    return (
      <React.Fragment>
      <Stage width={this.state.actualWidth} height={this.state.topOffset + this.state.pathNames.length * this.state.pathsPerPixel}>
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
                key={"arrival" + i+j}
                item={linkColumn}
                pathNames={this.state.pathNames}
                x={this.state.leftOffset + (schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset + j) * this.state.binsPerPixel}
                pathsPerPixel={this.state.pathsPerPixel}
                y={this.state.topOffset}
                width={this.state.binsPerPixel}
                number={(linkColumn.downstream + 1) * (linkColumn.upstream + 1)}
                color={stringToColour((linkColumn.downstream + 1) * (linkColumn.upstream + 1))}
              />
            )}
            {schematizeComponent.departures.map((linkColumn, j) => 
              <LinkRect 
                key={"departure" + i+j}
                item={linkColumn}
                pathNames={this.state.pathNames}
                x={this.state.leftOffset + (schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset + (schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length+j)*this.state.binsPerPixel}
                pathsPerPixel={this.state.pathsPerPixel}
                y={this.state.topOffset}
                width={this.state.binsPerPixel}
                color={stringToColour((linkColumn.downstream + 1) * (linkColumn.upstream + 1))}

              />
            )}
            </React.Fragment>
            )}
          )}
        </Layer>
      </Stage>
      </React.Fragment>
    );

    // Stage is a div container
    // Layer is actual canvas element (so you may have several canvases in the stage)
    // And then we have canvas shapes inside the Layer
    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <Text text="Try click on rect" />
          <ComponentRect />
        </Layer>
      </Stage>
    );
  }
}
 
render(<App />, document.getElementById('root'));

export default App;
