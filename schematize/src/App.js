import Konva from 'konva';
import logo from './logo.svg';
import './App.css';
import schematize from './graphComponent.js'
import ComponentRect from './svgKonvas.js'
import LinkRect from './LinkRect.js'

import { render } from 'react-dom';
import { Stage, Layer, Rect, Text } from 'react-konva';

import React, { Component } from 'react';

class App extends Component {
  layerRef = React.createRef();
  constructor(props) {
    super(props);
/*
    console.log({schematize})
    React.useEffect(() => {
      this.layerRef.current.getCanvas()._canvas.id = 'cnvs';
    }, []);*/
    this.state = { schematize, paddingSize: 1}
  };
  componentDidMount = () => {
    /* attach listeners to google StreetView */
    this.layerRef.current.getCanvas()._canvas.id = 'cnvs';
   }


  render() {
    return (
      <React.Fragment>
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer ref={this.layerRef}>
          {schematize.map((schematizeComponent, i)=> {
            return (
              <React.Fragment>
            <ComponentRect
              item={schematizeComponent}
              key={i}
              x={schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset}
              y={100}
              height={120}
              width={(schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length + schematizeComponent.departures.length}
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
                key={i+j}
                x={schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset + j}
                height={linkColumn.participants.length}
                y={100}
                width={1}
                color={"yellow"}
              />
            )}
            {schematizeComponent.departures.map((linkColumn, j) => 
              <LinkRect 
                key={i+j}
                x={schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset + (schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length+j}
                height={linkColumn.participants.length}
                y={100}
                width={1}
                color={"blue"}
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
