import React from 'react';
import { Rect } from 'react-konva';

class ComponentRect extends React.Component {
  state = {
    color: 'lightgray'
  };
  handleClick = () => {
      if (this.state.color === 'lightgray') {
        this.setState({color: 'gray'});
      } else if (this.state.color === 'gray') {
        this.setState({color: 'lightgray'});
      }
  };
  handleMouseOver = () => {
    this.setState({color: 'gray'})
  };
  handleMouseOut = () => {
    this.setState({color: 'lightgray'})
  };
  render() {
    return (
      <Rect
        x={this.props.x}
        y={this.props.y}
        width={this.props.width}
        height={this.props.height}
        fill={this.state.color}
        onClick={this.handleClick}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
      />
    );
  }
}

export default ComponentRect
