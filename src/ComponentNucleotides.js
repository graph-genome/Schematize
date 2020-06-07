import React from "react";
import { Text } from "react-konva";
import PropTypes from "prop-types";

class ComponentNucleotides extends React.Component {
  renderMatrixRow() {
    const parent = this.props.item;
    const x_val =
      parent.relativePixelX +
      parent.arrivals.length * this.props.store.pixelsPerColumn;

    //console.log('x_val: ' + x_val)

    var listOfObjects = [];
    for (var x = 0; x < this.props.item.num_bin; x++) {
      listOfObjects.push(
        <Text
          key={"nuc_text" + x}
          x={x_val + x * this.props.store.pixelsPerColumn}
          y={this.props.store.topOffset - this.props.store.pixelsPerColumn}
          text={this.props.nucleotides[x]}
          align="center"
          height={this.props.store.pixelsPerColumn}
          width={this.props.store.pixelsPerColumn}
          fontSize={this.props.store.pixelsPerColumn + 2}
        />
      );
    }
    return listOfObjects;
  }

  render() {
    //console.log('ComponentNucleotides - render')
    return this.renderMatrixRow();
  }
}

ComponentNucleotides.propTypes = {
  store: PropTypes.object,
  item: PropTypes.object,
};

export default ComponentNucleotides;
