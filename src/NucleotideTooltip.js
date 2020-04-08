import React from "react";
import MouseTooltip from "react-sticky-mouse-tooltip";
import { Observer } from "mobx-react";
import PropTypes from "prop-types";

export default class NucleotideTooltip extends React.Component {
  render() {
    return (
      <MouseTooltip
        visible={true}
        offsetX={15}
        offsetY={-20}
        style={{ background: "white" }}
      >
        <Observer>
          {() => <span>{this.props.store.cellToolTipContent}</span>}
        </Observer>
      </MouseTooltip>
    );
  }
}

NucleotideTooltip.propTypes = {
  store: PropTypes.object,
};
