import React from "react";
import {Rect, Text} from "react-konva";
import PropTypes from "prop-types";

class ComponentNucleotides extends React.Component {
  renderMatrix() {
    //console.log("ComponentNucleotides: " + this.props.nucleotides);

    let count = 0;
    let parts = this.props.item.matrix.map((row, row_n) => {
      //console.log('row.length: ' + row.length)
      if (row.length) {
        count++;

        // TO_DO: why is this checks needed?
        // To avoid many unnecessary operations, improving the performance
        if (count === 1) {
          return this.renderMatrixRow(row, row_n);
        }
      }

      return null;
    });

    return <>{parts}</>;
  }

  renderMatrixRow(row, row_n) {
    const parent = this.props.item;
    const x_val =
      parent.x + parent.arrivals.length * this.props.store.pixelsPerColumn;
    const width = 1 * this.props.store.pixelsPerColumn;

    //console.log('renderMatrixRow - row_n: ' + row_n)
    //console.log('x_val: ' + x_val)

    return row.map((cell, x) => {
      if (cell.length) {
        //console.log("this.props.nucleotides: " + this.props.nucleotides + "; x: " + x)

        return (
          <>
            <Text
              x={x_val + x * this.props.store.pixelsPerColumn}
              y={this.props.store.topOffset - this.props.store.nucleotideHeight}
              text={this.props.nucleotides[x]}
              align="center"
              height={this.props.store.nucleotideHeight}
              width={width}
            />
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
            key={"nuc" + this.props.item.x}
            x={this.props.item.x}
            y={this.props.store.topOffset + this.props.store.nucleotideHeight}
            width={this.props.width * this.props.store.pixelsPerColumn}
            height={this.props.height * this.props.store.pixelsPerRow}
        />
        {this.renderMatrix()}
      </>
    );
  }
}

ComponentNucleotides.propTypes = {
  store: PropTypes.object,
  item: PropTypes.object,
  width: PropTypes.node,
  height: PropTypes.node,
};

export default ComponentNucleotides;
