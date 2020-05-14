import React from "react";
import { Text } from "react-konva";
import PropTypes from "prop-types";

class ComponentNucleotides extends React.Component {
  renderMatrixRow() {
    const parent = this.props.item;
    const x_val =
      parent.x + parent.arrivals.length * this.props.store.pixelsPerColumn;

    //console.log('x_val: ' + x_val)

    var listOfObjects = [];
    for (var x = 0; x < this.props.item.num_bin; x++) {
      listOfObjects.push(
        <Text
          key={"nuc_text" + x}
          x={x_val + x * this.props.store.pixelsPerColumn}
          y={this.props.store.topOffset - this.props.store.nucleotideHeight}
          text={this.props.nucleotides[x]}
          align="center"
          height={this.props.store.nucleotideHeight}
          width={this.props.store.pixelsPerColumn}
        />
      );
    }
    return listOfObjects;
  }

  render() {
    //console.log('ComponentNucleotides - render')
    return this.renderMatrixRow();

    // TODO: to confirm the elimination of the Rect tag (less tags to render!)
    /*return (
      *<>
        <Rect
            key={"nuc" + this.props.item.x}
            x={this.props.item.x}
            y={this.props.store.topOffset + this.props.store.nucleotideHeight}
            width={this.props.width * this.props.store.pixelsPerColumn}
            height={this.props.height * this.props.store.pixelsPerRow}
        />
        {this.renderMatrixRow()}
      </>

      this.renderMatrixRow()
    );*/
  }
}

ComponentNucleotides.propTypes = {
  store: PropTypes.object,
  item: PropTypes.object,
  width: PropTypes.node,
  height: PropTypes.node,
};

export default ComponentNucleotides;
