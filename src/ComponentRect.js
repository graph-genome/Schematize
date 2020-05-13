/* eslint-disable require-jsdoc */
import React from "react";
import { Rect } from "react-konva";
import { MatrixCell, ConnectorRect } from "./ComponentConnectorRect";
import PropTypes from "prop-types";

const zip = (arr, ...arrs) => {
  /*Credit: https://gist.github.com/renaudtertrais/25fc5a2e64fe5d0e86894094c6989e10*/
  return arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));
};

export function compress_visible_rows(components) {
  /*Returns a Map with key of the original row number and value of the new, compressed row number.
   * Use this for y values of occupancy and LinkColumn cells.  */
  let rows_present = find_rows_visible_in_viewport(components);
  let row_mapping = {};
  let rows_encountered = 0;
  for (let i = 0; i < rows_present.length; i++) {
    if (rows_present[i]) {
      row_mapping[i] = rows_encountered;
      rows_encountered++;
    }
  }
  return row_mapping;
}

function find_rows_visible_in_viewport(components) {
  /*The only components passed to this method are the components on the screen.
   * This returns a boolean list of which rows are on the screen. */
  // let rows_present = new Array(components[0].occupants.length).fill(false);
  if (components.length) {
    let per_row = zip(...components.map((x) => x.occupants));
    let rows_present = per_row.map((row) => row.some((x) => x));
    return rows_present;
  } else {
    return [false];
  }
}

function sum(a, b) {
  return a + b;
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
    let count = 0;
    let parts = this.props.item.matrix.map((row, row_n) => {
      if (row.length) {
        count++;
        return this.renderMatrixRow(row, count, row_n);
      } else {
        return null;
      }
    });
    this.props.store.updateMaxHeight(count); //Set max observed occupants in mobx store for render height
    return <>{parts}</>;
  }

  renderMatrixRow(row, count, row_n) {
    const parent = this.props.item;
    const x_val =
      parent.x + parent.arrivals.length * this.props.store.pixelsPerColumn;
    const width = 1 * this.props.store.pixelsPerColumn;
    let this_y = count;
    if (!this.props.store.useVerticalCompression) {
      if (!this.props.compressed_row_mapping.hasOwnProperty(row_n)) {
        return null; // we need compressed_y and we don't have it.  give up
      }
      this_y = this.props.compressed_row_mapping[row_n];
    }

    return row.map((cell, x) => {
      if (cell.length) {
        return (
          <>
            <MatrixCell
              key={"occupant" + row_n + x}
              item={cell}
              store={this.props.store}
              pathName={this.props.pathNames[row_n]}
              x={x_val + x * this.props.store.pixelsPerColumn}
              y={
                this_y * this.props.store.pixelsPerRow +
                this.props.store.topOffset
              }
              row_number={row_n}
              width={width}
              height={this.props.store.pixelsPerRow}
              color={"#838383"}
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
      let count = 0;
      if (departures.length > 1) {
        count += departures
          .slice(0, -1)
          .map((column) => {
            return column.participants.reduce(sum);
          })
          .reduce(sum); // sum of trues in all columns
      }
      return (
        <>
          {connectorsColumn.participants.map((useConnector, j) => {
            if (useConnector) {
              count++;
              return this.renderComponentConnector(useConnector, count, j);
            } else {
              return null;
            }
          })}
        </>
      );
    } else {
      return null;
    }
  }
  renderComponentConnector(useConnector, count, j) {
    let component = this.props.item;
    // x is the (num_bins + num_arrivals + num_departures)*pixelsPerColumn
    const x_val =
      component.x +
      (component.arrivals.length +
        (this.props.store.useWidthCompression
          ? this.props.store.binScalingFactor
          : component.num_bin) +
        component.departures.length -
        1) *
        this.props.store.pixelsPerColumn;
    let this_y = count;
    if (!this.props.store.useVerticalCompression) {
      this_y = this.props.compressed_row_mapping[j];
    }
    return (
      <ConnectorRect
        key={"connector" + j}
        x={x_val}
        y={this.props.store.topOffset +
          this_y * this.props.store.pixelsPerRow}
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
          x={this.props.item.x}
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
