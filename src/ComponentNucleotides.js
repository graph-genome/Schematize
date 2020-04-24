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

    const letter = this.props.nucleotides.slice(
      parent.firstBin - 1,
      parent.endBin
    );

    return row.map((cell, x) => {
      if (cell.length) {
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
    if (
      this.props.store.binWidth === 1 &&
      !this.props.store.useWidthCompression
    ) {
      return (
        <>
          <Rect
            x={this.props.item.x}
            y={this.props.store.topOffset + this.props.store.nucleotideHeight}
            width={this.props.width * this.props.store.pixelsPerColumn}
            height={this.props.height * this.props.store.pixelsPerRow} //TODO: change to compressed height
            //fill={this.state.color}
          />
          {!this.props.store.useWidthCompression ? this.renderMatrix() : null}
        </>
      );
    } else {
      return null;
    }
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
