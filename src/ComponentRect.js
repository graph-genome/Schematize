/* eslint-disable require-jsdoc */
import React from "react";
import {Rect} from "react-konva";
import {ConnectorRect} from "./ComponentConnectorRect";
import {SpanCell} from "./SpanCell";
import PropTypes from "prop-types";
import {sum} from "./utilities";

function colorFromStr(colorKey) {
  colorKey = colorKey.toString();
  let hash = 0;
  for (let i = 0; i < colorKey.length; i++) {
    hash = colorKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  let colour = "#";
  for (let j = 0; j < 3; j++) {
    let value = (hash >> (j * 8)) & 0xff;
    colour += ("00" + value.toString(16)).substr(-2);
  }
  return colour;
}

export function compress_visible_rows(components, pathNames, annotationNames) {
  /*Returns a Map with key of the original row number and value of the new, compressed row number.
   * Use this for y values of occupancy and LinkColumn cells.  */
  let all_visible = new Set();
  for (let c of components) {
    for (let row of c.occupants) {
      all_visible.add(row);
    }
  }

  let row_mapping = {};
  let ordered_num_rows = {};
  if (annotationNames.length > 0) {
    let all_annotation_num_rows = new Set();
    for (let annotationName of annotationNames) {
      all_annotation_num_rows.add(pathNames.indexOf(annotationName));
    }

    let row_mapping_high = [];
    let row_mapping_individuals = [];

    const num_row_ref = pathNames.indexOf("NC_045512");

    for (let num_row of all_visible) {
      //console.log(num_row + ' -- ' + pathNames[num_row] + ' ----- ' + all_annotation_num_rows.has(num_row))
      if (num_row !== num_row_ref) {
        if (all_annotation_num_rows.has(num_row)) {
          row_mapping_high.push(num_row);
        } else {
          row_mapping_individuals.push(num_row);
        }
      }
    }

    if (num_row_ref >= 0) {
      row_mapping_high.push(num_row_ref);
    }

    ordered_num_rows = row_mapping_high.concat(row_mapping_individuals);
  } else {
    ordered_num_rows = Array.from(all_visible).sort();
  }
    let fixed_order = ["AT9784_Chr1", "AT7328_Chr1", "AT6906_Chr1", "AT1741.Chr1", "AT6909.Chr1",
        "TAIR10.Chr1", "AT7213.Chr1", "AT5784.Chr1", "AT6911.Chr1", "AT7186.Chr1", "AT6981_Chr1", "AT9518_Chr1",
        "AT5784.Chr2", "AT7213.Chr2", "AT7328_Chr2", "AT1741.Chr2", "AT6909.Chr2", "AT7186.Chr2", "AT6981_Chr2", "AT9518_Chr2",
        "TAIR10.Chr2", "AT6911.Chr2", "AT6906_Chr2", "AT9784_Chr2",
        "AT7328_Chr3", "TAIR10.Chr3", "AT9784_Chr3", "AT9518_Chr3", "AT7213.Chr3", "AT7186.Chr3", "AT6981_Chr3", "AT6911.Chr3",
        "AT6909.Chr3", "AT5784.Chr3", "AT1741.Chr3", "AT6906_Chr3",
        "AT5784.Chr4", "AT6911.Chr4", "AT6906_Chr4", "TAIR10.Chr4", "AT9518_Chr4", "AT7328_Chr4", "AT7213.Chr4",
        "AT7186.Chr4", "AT6981_Chr4", "AT6909.Chr4", "AT1741.Chr4", "AT9784_Chr4",
        "AT9784_Chr5", "AT6981_Chr5", "AT6911.Chr5", "AT7213.Chr5", "AT6906_Chr5", "TAIR10.Chr5", "AT9518_Chr5",
        "AT7328_Chr5", "AT5784.Chr5", "AT7186.Chr5", "AT6909.Chr5", "AT1741.Chr5",
    ];
  for (let [count, index] of ordered_num_rows.entries()) {
      row_mapping[index] = count;//fixed_order.indexOf(pathNames[index]); //count;
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

  renderMatrixRow(entry, verticalRank, uncompressed_y) {
    let this_y = verticalRank;
    if (!this.props.store.useVerticalCompression) {
      if (!this.props.compressed_row_mapping.hasOwnProperty(uncompressed_y)) {
        return null; // we need compressed_y and we don't have it.  give up
      }
      this_y = this.props.compressed_row_mapping[uncompressed_y];
    }

    let pathName = this.props.pathNames[uncompressed_y];
    let rowColor = "#838383";
    if (this.props.store.colorByGeneAnnotation && this.props.store.metaData) {
      let metaData = this.props.store.metaData;
      if (metaData.get(pathName) !== undefined) {
        if (metaData.get(pathName).Color.startsWith("#")) {
          rowColor = metaData.get(pathName).Color;
        } else {
          rowColor = colorFromStr(metaData.get(pathName).Color);
        }
      }
    }

    return (
      <SpanCell
        key={"occupant" + uncompressed_y}
        row={entry[1]}
        iColumns={entry[0]}
        parent={this.props.item}
        store={this.props.store}
        pathName={pathName}
        color={rowColor}
        x={
          this.props.item.relativePixelX +
          this.props.item.arrivals.length * this.props.store.pixelsPerColumn
        }
        y={this_y * this.props.store.pixelsPerRow + this.props.store.topOffset}
        rowNumber={uncompressed_y}
        verticalRank={verticalRank}
      />
    );
  }

  renderAllConnectors() {
    const departures = this.props.item.departures;
    let connectorsColumn = departures.slice(-1)[0];
    if (connectorsColumn !== undefined) {
      //count starts at the sum(sum(departure columns)) so that it's clear
      // adjacent connectors are alternatives to LinkColumns
      //offset the y to start below link columns when using vertical compression
      let yOffset = departures
        .slice(0, -1)
        .map((column) => {
          return column.participants.length;
        })
        .reduce(sum, 0); // sum of trues in all columns
      return (
        <>
          {connectorsColumn.participants.map((uncompressed_row) => {
            yOffset++; // only used in vertical compression
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
        color={"#AAAABE"}
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
          onMouseOver={this.onHover.bind(this)}
          onMouseLeave={this.onLeave.bind(this)}
        />
        {!this.props.store.useWidthCompression ? this.renderMatrix() : null}
        {this.props.store.useConnector ? this.renderAllConnectors() : null}
      </>
    );
  }

  onHover() {
    this.props.store.updateCellTooltipContent(
      "Bin range: " + this.props.item.firstBin + " - " + this.props.item.lastBin
    );
  }

  onLeave() {
    this.props.store.updateCellTooltipContent("");
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
