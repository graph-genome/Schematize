import React, { Component } from 'react';
import { render } from 'react-dom';
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';

class ComponentRect extends React.Component {
  constructor(props) {
    super(props) 
  };
  state = {
    color: 'gray'
  };
  handleClick = () => {
      if (this.state.color == 'gray') { 
        this.setState({color: 'lightgray'}); 
      } else if (this.state.color == 'lightgray') {
        this.setState({color: 'gray'});
      }
  };
  render() {
    return (
      <Rect
        x={this.props.x}
        y={this.props.y}
        width={this.props.width}
        height={this.props.height}
        fill={this.state.color}
        shadowBlur={5}
        onClick={this.handleClick}
      />
    );
  }
}

export default ComponentRect
