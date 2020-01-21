import React  from 'react';
import {Arrow} from 'react-konva';

class LinkArrow extends React.Component {
  render() {
    return (
      <Arrow
        upstream={this.props.upstream}
        downstream={this.props.downstream}
        x={this.props.x}
        y={this.props.y}
        bezier={false}
	    points={this.props.points}
        strokeWidth={this.props.width}
	    fill={this.props.color}
	    stroke={this.props.color}
	    pointerLength={1}
	    pointerWidth={1}
        tension={1/3}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
        // lineCap={'round'}
      />
    );
  }
    constructor(props) {
        super(props);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
    }
    handleMouseOver = () => {
        this.props.updateHighlightedNode(this.props.item)
    };
    handleMouseOut = () => {
        this.props.updateHighlightedNode(null)
    };
}

export default LinkArrow
