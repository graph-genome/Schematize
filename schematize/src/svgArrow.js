import React, { Component } from 'react';
import { render } from 'react-dom';
import { Stage, Layer, Rect, Text, Line, Arrow } from 'react-konva';
import Konva from 'konva';

class ArrowRect extends React.Component {
  constructor(props) {
    super(props) 
  };
  render() {
    return (
      <Arrow
        x={this.props.x}
        y={this.props.y}
	points={this.props.points}
        strokewidth={this.props.width}
	fill={this.props.color}
	stroke={this.props.stroke}
	pointerLength={this.props.pointerLength}
	pointerWidth={this.props.pointerWidth}
      />
    );
  }
}

export default ArrowRect
