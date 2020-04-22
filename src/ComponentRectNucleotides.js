/* eslint-disable require-jsdoc */
import React from "react";
import { Rect, Text } from "react-konva";
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
    Nucleotides: [],
  };

  renderMatrix() {
    let count = 0;
    let nucleotides = [];
    let parts = this.props.item.matrix.map((row, row_n) => {
      if (row.length) {
        count++;
        // let currentNucs = this.chooseNucleotides(this.props.item);
        // if (nucleotides[this.props.item.x] === undefined) {
        //   nucleotides.push(currentNucs);
        // }
        return this.renderMatrixRow(row, count, row_n);
      } else {
        return null;
      }
    });
    // console.log(nucleotides);
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

    const letter = this.props.nucleotides.slice(
      parent.firstBin - 1,
      parent.endBin
    );

    return row.map((cell, x) => {
      if (cell.length) {
        return (
          <>
            {letter[x] ? (
              <Text
                x={x_val + x * this.props.store.pixelsPerColumn}
                y={this.props.store.topOffset}
                text={letter[x]}
                align="center"
                height={this.props.store.nucleotideHeight}
                width={width}
              />
            ) : null}
          </>
        );
      } else {
        return null;
      }
    });
  }

  render() {
    return (
      <>
        <Rect
          x={this.props.item.x}
          y={this.props.store.topOffset + this.props.store.nucleotideHeight}
          width={this.props.width * this.props.store.pixelsPerColumn}
          height={this.props.height * this.props.store.pixelsPerRow} //TODO: change to compressed height
          //fill={this.state.color}
        ></Rect>
        {!this.props.store.useWidthCompression ? this.renderMatrix() : null}
      </>
    );
  }
}

ComponentRect.propTypes = {
  store: PropTypes.object,
  item: PropTypes.object,
  compressed_row_mapping: PropTypes.object,
  width: PropTypes.node,
  height: PropTypes.node,
  pathNames: PropTypes.node,
};

export default ComponentRect;
