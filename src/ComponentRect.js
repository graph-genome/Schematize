/* eslint-disable require-jsdoc */
import React from "react";
import {Rect} from "react-konva";
import {ConnectorRect, MatrixCell} from "./ComponentConnectorRect";
import PropTypes from "prop-types";
import {sum} from "./utilities";

export function compress_visible_rows(components) {
  /*Returns a Map with key of the original row number and value of the new, compressed row number.
   * Use this for y values of occupancy and LinkColumn cells.  */
  let all_visible = new Set();
  for (let c of components) {
    c.occupants.map((row) => all_visible.add(row));
  }
  let sorted = Array.from(all_visible).sort();
  let row_mapping = {};
  for (let [count, index] of sorted.entries()) {
    row_mapping[count] = index;
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
      let row = entry[1][1];
      return this.renderMatrixRow(row, vertical_rank, row_n);
    });
    this.props.store.updateMaxHeight(this.props.item.matrix.length); //Set max observed occupants in mobx store for render height
    return <>{parts}</>;
  }

  renderMatrixRow(row, vertical_rank, uncompressed_y) {
    const parent = this.props.item;
    const x_val =
      parent.relativePixelX +
      parent.arrivals.length * this.props.store.pixelsPerColumn;
    const width = 1 * this.props.store.pixelsPerColumn;
    let this_y = vertical_rank;
    if (!this.props.store.useVerticalCompression) {
      if (!this.props.compressed_row_mapping.hasOwnProperty(uncompressed_y)) {
        return null; // we need compressed_y and we don't have it.  give up
      }
      this_y = this.props.compressed_row_mapping[uncompressed_y];
    }

    return row.map((cell, x) => {
      if (cell.length) {
        return (
          <>
            <MatrixCell
                key={"occupant" + uncompressed_y + x}
                item={cell}
                store={this.props.store}
                pathName={this.props.pathNames[uncompressed_y]}
                x={x_val + x * this.props.store.pixelsPerColumn}
                y={
                this_y * this.props.store.pixelsPerRow +
                this.props.store.topOffset
              }
                row_number={uncompressed_y}
                width={width}
                height={this.props.store.pixelsPerRow}
            />
          </>
        );
      } else {
        return null;
      }
    });
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
