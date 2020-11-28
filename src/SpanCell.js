import React from "react";
import {Rect, Text} from "react-konva";
import PropTypes from "prop-types";

export class MatrixCell extends React.Component {
  onHover(event) {
    //tooltip: this.props.item.mean_pos

    // An example: Path_name, Coverage: 0.23, Inversion: 0.0, Pos: 2365-27289

    //TODO: calculate relative X and select item from this.props.range
    let relColumnX = Math.floor(
      Math.max(0, event.evt.layerX - this.props.x) /
        this.props.store.pixelsPerColumn
    );
    //console.log(event, this.props.range, relColumnX);

    let item = this.props.range[
      Math.min(this.props.range.length - 1, relColumnX)
    ];
    let pathName = this.props.pathName.startsWith("NC_045512")
      ? "Reference: " + this.props.pathName
      : this.props.pathName;
    let tooltipContent = '"';
    tooltipContent +=
      pathName +
      '"\nCoverage: ' +
      item[0] +
      "\nInversion: " +
      item[1] +
      "\nPos: ";

    const ranges = item[2];
    for (let j = 0; j < ranges.length; j++) {
      const start = ranges[j][0];
      const end = ranges[j][1];
      let new_content = "";

      if (start === 0) {
        new_content = end + "+";
      } else if (end === 0) {
        new_content = start + "-";
      } else {
        new_content = start + "-" + end;
      }

      if (j > 0) {
        new_content = "," + new_content;
      }

      tooltipContent += new_content;
    }

    if (this.props.store.metaData.get(this.props.pathName) !== undefined) {
      tooltipContent +=
        "\n" + this.props.store.metaData.get(this.props.pathName).Info;
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
          onMouseOver={this.onHover.bind(this)}
          onMouseLeave={this.onLeave.bind(this)}
        />
      );
    } else {
      return null;
    }
  }

    colorByPosition(props) {
        const genomeSize = 2500000; // 150 Megabases
        let ranges = this.props.range[0][2];
        // for (let j = 0; j < ranges.length; j++) {
        const start = ranges[0][0];
        const end = ranges[0][1];
        const percent = end / genomeSize;

        return this.props.store.invertedColorArray[Math.min(10, Math.round(10 * percent))];
        // }
    }

  render() {
    if (this.props.range === undefined || this.props.range.length === 0) {
      return null; //giving up
    }
    const inverted = this.props.range[0][1] > 0.5;
    const copyNumber = this.props.range[0][0];

    let color = this.props.color;

    if (copyNumber > 1 && !inverted) {
      // 11 items is number of colors in copyNumberColorArray
      if (copyNumber < 10) {
        color = this.props.store.copyNumberColorArray[copyNumber];
      } else {
        color = this.props.store.copyNumberColorArray[10];
      }
    }
      color = this.colorByPosition(this.props);

    if (inverted) {
      // 11 items is number of colors in invertedColorArray
      if (copyNumber < 10) {
        color = this.props.store.invertedColorArray[copyNumber];
      } else {
        color = this.props.store.invertedColorArray[10];
      }
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
          onMouseMove={this.onHover.bind(this)}
          onMouseLeave={this.onLeave.bind(this)}
        />
        {this.inversionText(inverted)}
      </>
    );
  }
}

MatrixCell.propTypes = {
  store: PropTypes.object,
  range: PropTypes.object,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  color: PropTypes.node,
  pathName: PropTypes.node,
};

export class SpanCell extends React.Component {
  constructor(props) {
    super(props);
    this.width = props.row.length;
    //https://github.com/graph-genome/Schematize/issues/87
    //Sparse matrix includes the relative columns for each bin inside a component
    //Columns are not necessarily contiguous, but follow the same order as `row`
  }

  render() {
    if (!this.props.row.length || !this.props.iColumns.length) {
      return null;
    }
    let prev = this.props.iColumns[0] - 1;
    let spans = [];
    let newSpan = { width: 0, x: this.props.iColumns[0], range: [] };
    for (let i = 0; i < this.props.iColumns.length; i++) {
      let column = this.props.iColumns[i];
      if (column === prev + 1) {
        //contiguous
        newSpan.width += 1;
        newSpan.range.push(this.props.row[i]);
      } else {
        //non-contiguous
        spans.push(newSpan);
        //create new newSpan
        newSpan = { width: 1, x: column, range: [this.props.row[i]] };
      }
      prev = column;
    }
    spans.push(newSpan);
    return (
      <>
        {spans.map((span) => (
          <MatrixCell
            key={"span" + this.props.rowNumber + "," + span.x}
            range={span.range}
            store={this.props.store}
            pathName={this.props.pathName}
            color={this.props.color}
            x={this.props.x + span.x * this.props.store.pixelsPerColumn}
            y={this.props.y}
            rowNumber={this.props.rowNumber}
            width={span.width * this.props.store.pixelsPerColumn}
            height={this.props.store.pixelsPerRow}
          />
        ))}
      </>
    );
  }
}

MatrixCell.propTypes = {
  row: PropTypes.node,
  iColumns: PropTypes.node,
  parent: PropTypes.object,
  store: PropTypes.object,
  pathName: PropTypes.node,
  y: PropTypes.number,
  rowNumber: PropTypes.number,
  verticalRank: PropTypes.number,
};
