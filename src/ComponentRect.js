/* eslint-disable require-jsdoc */
import React from "react";
import {Rect} from "react-konva";
import {ConnectorRect} from "./ComponentConnectorRect";
import {SpanCell} from "./SpanCell";
import PropTypes from "prop-types";
import {sum} from "./utilities";

export function compress_visible_rows(components) {
  /*Returns a Map with key of the original row number and value of the new, compressed row number.
   * Use this for y values of occupancy and LinkColumn cells.  */
  let all_visible = new Set();
  for (let c of components) {
      for (let row of c.occupants) {
          all_visible.add(row);
      }
  }
  let sorted = Array.from(all_visible).sort();
  let row_mapping = {};
  for (let [count, index] of sorted.entries()) {
      row_mapping[index] = count;
  }
  return row_mapping;
}


class ComponentRect extends React.Component {
  state = {
    color: "lightgray",
  };

  handleClick = () => {
    if (this.state.color === "lightgray") {
      this.setState({ color: "lightblue" });
    } else if (this.state.color === "lightblue") {
      this.setState({ color: "lightgray" });
    }
  };

  renderMatrix() {
    let parts = this.props.item.matrix.map((entry, vertical_rank) => {
      let row_n = entry[0];
        return this.renderMatrixRow(entry[1], vertical_rank, row_n);
    });
      this.props.store.updateMaxHeight(this.props.item.occupants.length); //Set max observed occupants in mobx store for render height
    return <>{parts}</>;
  }

    renderMatrixRow(entry, vertical_rank, uncompressed_y) {
        let row = entry[1];
    const parent = this.props.item;
        //https://github.com/graph-genome/Schematize/issues/87
        //Sparse matrix includes the relative columns for each bin inside a component
        //Columns are not necessarily contiguous, but follow the same order as `row`
        let iColumns = entry[0];
        let pixelsX = iColumns.map((cX) => cX * this.props.store.pixelsPerColumn)
        const xBase =
      parent.relativePixelX +
      parent.arrivals.length * this.props.store.pixelsPerColumn;
    let this_y = vertical_rank;
    if (!this.props.store.useVerticalCompression) {
      if (!this.props.compressed_row_mapping.hasOwnProperty(uncompressed_y)) {
        return null; // we need compressed_y and we don't have it.  give up
      }
      this_y = this.props.compressed_row_mapping[uncompressed_y];
    }
        let x = 0;
        return <SpanCell
            key={"occupant" + uncompressed_y + x}
            row={row}
            store={this.props.store}
            pathName={this.props.pathNames[uncompressed_y]}
            x={xBase + pixelsX[x]}
            y={
                this_y * this.props.store.pixelsPerRow +
                this.props.store.topOffset
            }
            rowNumber={uncompressed_y}
            height={this.props.store.pixelsPerRow}
        />
  }

  renderAllConnectors() {
    const departures = this.props.item.departures;
    let connectorsColumn = departures.slice(-1)[0];
    if (connectorsColumn !== undefined) {
      //count starts at the sum(sum(departure columns)) so that it's clear
      // adjacent connectors are alternatives to LinkColumns
      //offset the y to start below link columns when using vertical compression
      let yOffset = departures.slice(0, -1)
          .map((column) => {
            return column.participants.length;
          })
          .reduce(sum, 0); // sum of trues in all columns
      return (
        <>
          {connectorsColumn.participants.map((uncompressed_row) => {
            yOffset++;// only used in vertical compression
            return this.renderComponentConnector(yOffset, uncompressed_row);
          })}
        </>
      );
    } else {
      return null;
    }
  }

  renderComponentConnector(verticalRank, uncompressedRow) {
    let component = this.props.item;
    // x is the (num_bins + num_arrivals + num_departures)*pixelsPerColumn
    const x_val =
      component.relativePixelX +
      (component.arrivals.length +
        (this.props.store.useWidthCompression
          ? this.props.store.binScalingFactor
          : component.num_bin) +
        component.departures.length -
        1) *
        this.props.store.pixelsPerColumn;
    let this_y = verticalRank;
    if (!this.props.store.useVerticalCompression) {
      this_y = this.props.compressed_row_mapping[uncompressedRow];
    }
    return (
      <ConnectorRect
          key={"connector" + uncompressedRow}
          x={x_val}
          y={this.props.store.topOffset + this_y * this.props.store.pixelsPerRow}
          width={this.props.store.pixelsPerColumn} //Clarified and corrected adjacent connectors as based on pixelsPerColumn width #9
          height={this.props.store.pixelsPerRow}
          color={"#464646"}
      />
    );
  }

  render() {
    return (
      <>
        <Rect
          x={this.props.item.relativePixelX}
          y={this.props.store.topOffset}
          key={this.state.key + "R"}
          width={this.props.widthInColumns * this.props.store.pixelsPerColumn}
          height={this.props.height - 2} //TODO: change to compressed height
          fill={this.state.color}
          onClick={this.handleClick}
        />
        {!this.props.store.useWidthCompression ? this.renderMatrix() : null}
        {this.props.store.useConnector ? this.renderAllConnectors() : null}
      </>
    );
  }
}

ComponentRect.propTypes = {
  store: PropTypes.object,
  item: PropTypes.object,
  compressed_row_mapping: PropTypes.object,
  widthInColumns: PropTypes.number,
  height: PropTypes.number,
  pathNames: PropTypes.node,
};

export default ComponentRect;
