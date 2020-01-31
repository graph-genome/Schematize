import React from 'react';
import { Rect } from 'react-konva';
import ComponentConnectorRect from "./ComponentConnectorRect";

export function find_rows_visible_in_viewport(components, beginBin, endBin){

}

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

  renderOccupants(occupant, i, j) {
    const parent = this.props.item;
    const x_val = this.props.x + (parent.arrivals.length * this.props.binsPerPixel);
    const width = parent.leftPadding() * this.props.binsPerPixel - (parent.arrivals.length * this.props.binsPerPixel);
    if (occupant) {
      return <ComponentConnectorRect
          key={"occupant" + i + j}
          x={x_val}
          y={j}
          width={width}
      />
    } else {
      return null
    }
  };

  render() {
    return (
        <>
            <Rect
                x={this.props.x}
                y={this.props.y}
                width={this.props.width * this.props.binsPerPixel}
                height={this.props.height * this.props.pathsPerPixel} //TODO: change to compressed height
                fill={this.state.color}
                onClick={this.handleClick}
                onMouseOver={this.handleMouseOver}
                onMouseOut={this.handleMouseOut}>
            </Rect>
            {this.props.item.occupants.map(
                (occupant, j) => {
                    return this.renderOccupants(occupant, 'i', j);
                })
            }
        </>
    );
  }
}

export default ComponentRect