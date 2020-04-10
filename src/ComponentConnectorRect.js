import React from "react";
import { Rect } from "react-konva";
import PropTypes from "prop-types";

export class ConnectorRect extends React.Component {
  state = {
    color: this.props.color,
  };

  render() {
    return (
      <Rect
        x={this.props.x}
        y={this.props.y}
        width={this.props.width}
        height={this.props.height || 1}
        fill={this.state.color}
      />
    );
  }
}

ConnectorRect.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  store: PropTypes.node,
  color: PropTypes.node,
};

export class MatrixCell extends React.Component {
  onHover() {
    //tooltip: this.props.item.mean_pos
    let tooltipContent = '"';
    tooltipContent += this.props.pathName + '": ';
    const ranges = this.props.item[2];
    for (let j = 0; j < ranges.length; j++) {
      let start = ranges[j][0];
      let end = ranges[j][1];
      if (j === 0) {
        tooltipContent += start + "-" + end;
      } else {
        tooltipContent += "," + start + "-" + end;
      }
    }
    if (this.props.store.metaData.get(this.props.pathName) !== undefined) {
      tooltipContent += " ; " + this.props.store.metaData.get(this.props.pathName).Geo_Location;
    }
    this.props.store.updateCellTooltipContent(tooltipContent); //item[2] is array of ranges
  }

  onLeave() {
    this.props.store.updateCellTooltipContent(""); // we don't want any tooltip displayed if we leave the cell
  }

  render() {
    return (
      <Rect
        x={this.props.x}
        y={this.props.y}
        width={this.props.width}
        height={this.props.height || 1}
        fill={this.props.color}
        onMouseEnter={this.onHover.bind(this)}
        onMouseLeave={this.onLeave.bind(this)}
      />
    );
  }
}

MatrixCell.propTypes = {
  store: PropTypes.object,
  item: PropTypes.node,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  color: PropTypes.node,
  pathName: PropTypes.node,
};
