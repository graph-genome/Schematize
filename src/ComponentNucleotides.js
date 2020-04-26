/* eslint-disable require-jsdoc */
import React from "react";
import { Rect, Text } from "react-konva";
import PropTypes from "prop-types";

class ComponentNucleotides extends React.Component {
  renderMatrix() {
    let count = 0;
    let parts = this.props.item.matrix.map((row, row_n) => {
      if (row.length) {
        count++;

        // AG: important, to avoid many unnecessary operations, improving the performance
        if (count === 1) {
          return this.renderMatrixRow(row, count, row_n);
        }
      }

      return null;
    });

    return <>{parts}</>;
  }

  renderMatrixRow(row, count, row_n) {
    //console.log('renderMatrixRow - count: ' + count + "; row_n: " + row_n)

    const parent = this.props.item;
    const x_val =
      parent.x + parent.arrivals.length * this.props.store.pixelsPerColumn;
    const width = 1 * this.props.store.pixelsPerColumn;

    // AG: info for debugging
    /*console.log('parent-offset: ' + parent.offset)
    console.log('parent-index: ' + parent.index)
    console.log('parent-arrivals: ' + parent.arrivals)
    console.log('parent-departures: ' + parent.departures)
    console.log('parent-matrix: ' + parent.matrix)
    console.log('parent-num_bin: ' + parent.num_bin)

    console.log('x_val: ' + x_val)
    console.log(parent.firstBin + '---------'+ parent.lastBin)
    console.log(this.props.first_bin + ' ..... ' + this.props.last_bin)
    console.log(parent.firstBin - this.props.first_bin)
    console.log(parent.lastBin - this.props.first_bin)*/

    // AG: this.props.first_bin to manage the offset in the sequence string,
    // without loading the entire sequence from all the chunks
    const letter = this.props.nucleotides.slice(
      parent.firstBin - this.props.first_bin,
      parent.lastBin - this.props.first_bin + 1
    );

    return row.map((cell, x) => {
      if (cell.length) {
        //console.log("letter: " + letter + "; count: " + count + "; row_n: " + row_n + "; x: " + x)

        return (
          <>
            {x < letter.length && letter[x] ? (
              <Text
                x={x_val + x * this.props.store.pixelsPerColumn}
                y={
                  this.props.store.topOffset - this.props.store.nucleotideHeight
                }
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
    //console.log('ComponentNucleotides - render')
    return (
      <>
        <Rect
          x={this.props.item.x}
          y={this.props.store.topOffset + this.props.store.nucleotideHeight}
          width={this.props.width * this.props.store.pixelsPerColumn}
          height={this.props.height * this.props.store.pixelsPerRow}
          //fill={this.state.color}
        />
        {this.renderMatrix()}
      </>
    );
  }
}

ComponentNucleotides.propTypes = {
  store: PropTypes.object,
  item: PropTypes.object,
  compressed_row_mapping: PropTypes.object,
  width: PropTypes.node,
  height: PropTypes.node,
  pathNames: PropTypes.node,
};

export default ComponentNucleotides;
