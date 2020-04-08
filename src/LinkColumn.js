import React from "react";
import { Rect } from "react-konva";
import PropTypes from "prop-types";

class LinkColumn extends React.Component {
  constructor(props) {
    super(props);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
  }
  handleMouseOver() {
    this.props.updateHighlightedNode(this.props.item);
  }
  handleMouseOut() {
    this.props.updateHighlightedNode(null);
  }
  linkCells() {
    let alpha = [];
    let count = 1; // Link columns appear to be 1 higher than occupants and conncetors
    for (const [i, isPresent] of this.props.item.participants.entries()) {
      if (isPresent) {
        let this_y = count++;
        if (!this.props.store.useVerticalCompression) {
          if (!this.props.compressed_row_mapping.hasOwnProperty(i)) {
            continue; //we're stuck: we need row_mapping but it's not present
          }
          this_y = this.props.compressed_row_mapping[i];
        }
        let row = this_y * this.props.store.pixelsPerRow;
        alpha.push(row); //relative compressed Y coordinate
      }
    }
    return alpha;
  }
  componentDidMount() {
    this.setState({
      color: this.props.color,
    });
  }
  render() {
    const contents = this.linkCells();
    return (
      <>
        {contents.map((y_coord, d) => {
          return (
            <Rect
              key={"dot" + d}
              x={this.props.x}
              y={this.props.store.topOffset + y_coord}
              width={this.props.store.pixelsPerColumn}
              height={this.props.store.pixelsPerRow}
              fill={this.props.color}
              // onClick={this.handleClick}
              onMouseOver={this.handleMouseOver}
              onMouseOut={this.handleMouseOut}
            />
          );
        })}
      </>
    );
  }
}

LinkColumn.propTypes = {
  store: PropTypes.object,
  item: PropTypes.object,
  updateHighlightedNode: PropTypes.func,
  compressed_row_mapping: PropTypes.object,
  x: PropTypes.node,
  column: PropTypes.node,
  color: PropTypes.node,
};

export default LinkColumn;
