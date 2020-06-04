import React from "react";
import { Arrow } from "react-konva";
import PropTypes from "prop-types";

function isInfinity(n) {
  return !Number.isFinite(n);
}

class LinkArrow extends React.Component {
  /** Serves as a contract to store visual layout information**/
  constructor(props) {
    super(props);
    this.arrowXCoord = null;
    this.points = [];
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
  }
  componentDidUpdate() {
    //this.calculatePoints();
  }

  calculatePoints() {
    /*Translates the LinkRecord coordinates into pixels and defines the curve shape.
     * I've spent way too long fiddling with these numbers at different pixelsPerColumn
     * I suggest you don't fiddle with them unless you plan on nesting the React
     * Components to ensure that everything is relative coordinates.*/
    let link = this.props.link;
    this.arrowXCoord = this.props.link.xArrival;
    let absDepartureX = this.props.link.xDepart;
    // put in relative coordinates to arriving LinkColumn
    let departureX =
      absDepartureX - this.arrowXCoord + this.props.store.pixelsPerColumn / 2;
    let arrX = this.props.store.pixelsPerColumn / 2;
    let bottom = -2; //-this.props.store.pixelsPerColumn;
    let turnDirection = departureX < 0 ? -1 : 1;
    const departOrigin = [departureX, this.props.store.pixelsPerColumn - 2];
    const departCorner = [departureX - turnDirection, -link.elevation + 2];
    let departTop = [departureX - turnDirection * 6, -link.elevation];
    let arriveTop = [arrX + turnDirection * 6, -link.elevation];
    let arriveCorner = [arrX + turnDirection, -link.elevation + 2]; // 1.5 in from actual corner
    const arriveCornerEnd = [arrX, -5];
    this.points = [
      departOrigin[0],
      departOrigin[1],
      departCorner[0],
      departCorner[1],
      departTop[0],
      departTop[1],
      arriveTop[0],
      arriveTop[1],
      arriveCorner[0],
      arriveCorner[1],
      arriveCornerEnd[0],
      arriveCornerEnd[1],
      arrX,
      -1,
    ];
    if (Math.abs(departureX) <= this.props.store.pixelsPerColumn) {
      // FIXME Small distances, usually self loops
      if (link.isArrival) {
        this.points = [
          arrX,
          -10, //-link.elevation - 4,
          arrX,
          bottom,
        ];
      } else {
        this.points = [
          departOrigin[0],
          bottom + this.props.store.pixelsPerColumn,
          departOrigin[0],
          -5,
        ]; //-link.elevation-this.props.store.pixelsPerColumn*2,];
      }
    }
    if (this.points.some(isNaN) || this.points.some(isInfinity)) {
      console.log("Some points are NaN: " + this.points);
    }
  }

  render() {
    // if(this.arrowXCoord === null){
    this.calculatePoints();
    // }
    /*upstream={this.props.upstream}
        downstream={this.props.downstream}
        */

    return (
      <Arrow
        x={this.arrowXCoord}
        y={this.props.store.topOffset - 10}
        width={this.props.store.pixelsPerColumn}
        points={this.points}
        bezier={false}
        strokeWidth={this.props.store.pixelsPerColumn}
        fill={this.props.color}
        stroke={this.props.color}
        opacity={this.props.opacity}
        stroke-opacity={this.props.opacity}
        pointerLength={1}
        pointerWidth={1}
        tension={1 / 3}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
        onClick={this.handleClick}
        // lineCap={'round'}
      />
    );
  }

  handleMouseOver = () => {
    this.props.updateHighlightedNode(this.props.link.linkColumn);
  };
  handleMouseOut = () => {
    this.props.updateHighlightedNode(null);
  };
  handleClick = (event) => {
    console.log("Click", event, this.props.link);

    this.props.updateSelectedLink(this.props.link.linkColumn);
  };
}

LinkArrow.propTypes = {
  store: PropTypes.object,
  link: PropTypes.object,
  color: PropTypes.node,
};

export default LinkArrow;
