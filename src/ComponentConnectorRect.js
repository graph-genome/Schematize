import React from "react";
import { Rect, Text } from "react-konva";
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

    // An example: Path_name, Coverage: 0.23, Inversion: 0.0, Pos: 2365-27289

    let tooltipContent = '"';
    tooltipContent +=
      this.props.pathName +
      '"\nCoverage: ' +
      this.props.item[0] +
      "\nInversion: " +
      this.props.item[1] +
      "\nPos: ";

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
    this.props.store.updateCellTooltipContent(tooltipContent); //item[2] is array of ranges
  }

  onLeave() {
    this.props.store.updateCellTooltipContent(""); // we don't want any tooltip displayed if we leave the cell
  }

  /**Reduced number of Text elements generated for inversions,
   * mouse events restored**/
  inversionText(inverted) {
    if (this.props.store.pixelsPerRow > 9 && inverted) {
      return (
        <Text
          x={this.props.x}
          y={this.props.y}
          width={this.props.width}
          height={this.props.height || 1}
          align={"center"}
          verticalAlign={"center"}
          text={inverted ? "<" : " "}
          onMouseEnter={this.onHover.bind(this)}
          onMouseLeave={this.onLeave.bind(this)}
        />
      );
    } else {
      return null;
    }
  }
  render() {
    const inverted = this.props.item[1] > 0.5;

    let color = "#838383";

    if (inverted) {
      color = "#DE4B39";
    }

    if (this.props.item[0] > 1) {
      color = "#6A6A6A";
    }

    // TODO: if possible, use HTML/CSS to write the '<', avoiding the <Text />s rendering, therefore improving the performance
    return (
      <>
        <Rect
          x={this.props.x}
          y={this.props.y}
          width={this.props.width}
          height={this.props.height || 1}
          fill={color}
          onMouseEnter={this.onHover.bind(this)}
          onMouseLeave={this.onLeave.bind(this)}
        ></Rect>
        {this.inversionText(inverted)}
      </>
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
