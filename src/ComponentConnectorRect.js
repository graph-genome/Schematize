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
    this.props.store.updateCellTooltipContent(tooltipContent); //item[2] is array of ranges
  }

  onLeave() {
    this.props.store.updateCellTooltipContent(""); // we don't want any tooltip displayed if we leave the cell
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

    const LessThanSign = () => {
      if (!inverted) {
        return null;
      }

      return (
        <Text
          x={this.props.x}
          y={this.props.y}
          align="center"
          verticalAlign="center"
          text="<"
        />
      );
    };

    return (
      <>
        <Rect
          x={this.props.x}
          y={this.props.y}
          width={this.props.width}
          height={this.props.height || 1}
          label={"c"}
          fill={color}
          onMouseEnter={this.onHover.bind(this)}
          onMouseLeave={this.onLeave.bind(this)}
        />
        <LessThanSign />
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
