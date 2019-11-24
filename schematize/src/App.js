import Konva from 'konva';
import logo from './logo.svg';
import './App.css';
import schematize from './graphComponent.js'
import ComponentRect from './svgKonvas.js'

import { render } from 'react-dom';
import { Stage, Layer, Rect, Text } from 'react-konva';

import React, { Component } from 'react';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { schematize, paddingSize: 1 }
    console.log({schematize})
  };
  render() {
    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          {schematize.map((schematizeComponent, i)=> (
            <ComponentRect
              item={schematizeComponent}
              key={i}
              x={schematizeComponent.firstBin + (i * this.state.paddingSize) + schematizeComponent.offset}
              y={100}
              height={100}
              width={(schematizeComponent.lastBin - schematizeComponent.firstBin + 1) + schematizeComponent.arrivals.length + schematizeComponent.departures.length}
              numPoints={5}
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
              onDragEnd={this.handleDragEnd}
            />
          ))}
        </Layer>
      </Stage>
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
