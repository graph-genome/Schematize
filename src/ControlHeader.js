import React from "react";
import { Observer } from "mobx-react";
import { httpGetAsync } from "./URL";
import PropTypes from "prop-types";

class ControlHeader extends React.Component {
  shift(percentage) {
    const beginBin = this.props.store.getBeginBin();
    const endBin = this.props.store.getEndBin();
    let size = endBin - beginBin;
    let diff = Math.floor(size * (percentage / 100));
    console.log(endBin + "-" + beginBin + "=" + size + " --> diff: " + diff);
    this.props.store.updateBeginEndBin(beginBin + diff, endBin + diff);
  }

  handleJump() {
    console.log(
      "JUMP: path name: " +
        this.props.store.getPath() +
        " nucleotide position: " +
        this.props.store.getNucPos()
    );
    // I don't know why, but in order for the CORS headers to exchange we need to make a first GET request to "/hi" which will not return anything

    const store = this.props.store;
    const addr = store.pathIndexServerAddress;
    const path_name = store.getPath();
    const nuc_pos = store.getNucPos();
    const binWidth = store.binWidth;

    function handleOdgiServerResponse(result) {
      if (result === "0") {
        alert(
          "The jump query returned 0. Either your path does not exist or your position in the path is wrong. Please try again."
        );
      } else {
        console.log(result);
        // go from nucleotide position to bin
        result = parseInt(result);
        const newBeginBin = Math.ceil(result / binWidth);
        console.log(newBeginBin);
        store.updateBeginEndBin(newBeginBin, store.getEndBin());
      }
    }
    // httpGetAsync(addr + "hi", printResult);
    // httpGetAsync(addr + "5/1", printResult);
    // httpGetAsync(addr + "4/3", printResult);
    httpGetAsync(addr + path_name + "/" + nuc_pos, handleOdgiServerResponse);
  }

  // AG
  change_zoom_level(target) {
    console.log(
      "change_zoom_level: " +
        target.value +
        " ---" +
        target.options[target.selectedIndex].text
    );

    this.props.store.setIndexSelectedZoomLevel(parseInt(target.value));
  }

  decIndexSelectedZoomLevel() {
    let indexSelZoomLevel = this.props.store.indexSelectedZoomLevel;
    if (indexSelZoomLevel > 0) {
      this.props.store.setIndexSelectedZoomLevel(indexSelZoomLevel - 1);
    }
  }

  incIndexSelectedZoomLevel() {
    let indexSelZoomLevel = this.props.store.indexSelectedZoomLevel;
    if (indexSelZoomLevel < this.props.store.availableZoomLevels.length - 1) {
      this.props.store.setIndexSelectedZoomLevel(indexSelZoomLevel + 1);
    }
  }

  render() {
    return (
      <div id="button-container">
        <button className="button" id="btn-download">
          Save Image
        </button>
        <input
          type="text"
          defaultValue={this.props.store.jsonName}
          style={{ width: "330px" }}
          onChange={this.props.store.tryJSONpath}
          title={"File:"}
        />
        <span style={{ marginLeft: "30px" }}>
          Bin width:
          <button
            className="button"
            onClick={() => this.decIndexSelectedZoomLevel()}
          >
            -
          </button>
          <select
            id="select_bin_width"
            onChange={(val) => this.change_zoom_level(val.target)}
            value={this.props.store.indexSelectedZoomLevel}
          >
            {this.props.store.availableZoomLevels.map((item, i) => (
              <option key={i} value={i}>
                {item}
              </option>
            ))}
          </select>
          <button
            className="button"
            onClick={() => this.incIndexSelectedZoomLevel()}
          >
            +
          </button>
        </span>

        <span style={{ marginLeft: "30px" }}>
          <button className="button" onClick={() => this.shift(-100)}>
            &lt;&lt;
          </button>
          <button className="button" onClick={() => this.shift(-50)}>
            &lt;
          </button>
          Pangenome Bin Position:
          <Observer>
            {() => (
              <>
                <input
                  type="number"
                  value={this.props.store.beginEndBin[0]} // TODO Get methods don't work here, but I don't know why. Need to ask Robert Buels.
                  onChange={(event) =>
                    this.props.store.updateBeginEndBin(
                      event.target.value,
                      this.props.store.getEndBin()
                    )
                  }
                  style={{ width: "80px" }}
                />
                -
                <input
                  type="number"
                  value={this.props.store.beginEndBin[1]}
                  readOnly
                  style={{ width: "80px" }}
                />
              </>
            )}
          </Observer>
          <button className="button" onClick={() => this.shift(50)}>
            &gt;
          </button>
          <button className="button" onClick={() => this.shift(100)}>
            &gt;&gt;
          </button>
        </span>
        <div className={"row"}>
          Jump to path at nucleotide position:
          <input
            type="string"
            list="path"
            placeholder={"path"}
            onChange={(event) =>
              this.props.store.updatePathNucPos(
                event.target.value,
                this.props.store.getNucPos()
              )
            }
            style={{ width: "80px" }}
          />
          <datalist id="path">
            {this.props.schematic.pathNames.map((item, key) => (
              <option key={key} value={item} />
            ))}
          </datalist>
          -
          <input
            type="number"
            placeholder={"position"}
            onChange={(event) =>
              this.props.store.updatePathNucPos(
                this.props.store.getPath(),
                event.target.value
              )
            }
            style={{ width: "80px" }}
          />
          <span style={{ marginLeft: "2px" }}>
            <button className="button" onClick={() => this.handleJump()}>
              Jump
            </button>
          </span>
        </div>
        <div className={"row"}>
          <span>
            {" "}
            Use Vertical Compression:
            <VerticalCompressedViewSwitch store={this.props.store} />
          </span>
          <span>
            {" "}
            Use Width Compression:
            <WidthCompressedViewSwitch store={this.props.store} />
          </span>
          {this.props.store.useWidthCompression ? (
            <React.Fragment>
              <span>
                {" "}
                Render Connectors:
                <RenderConnectorSwitch store={this.props.store} />
              </span>
              <span>
                {" "}
                Component Width Scaling Factor:
                <Observer>
                  {() => (
                    <input
                      type="number"
                      min={1}
                      value={this.props.store.binScalingFactor}
                      onChange={this.props.store.updateBinScalingFactor}
                      style={{ width: "30px" }}
                    />
                  )}
                </Observer>
              </span>
            </React.Fragment>
          ) : (
            <></>
          )}
          <span>
            {" "}
            Row Height:
            <input
              type="number"
              min={1}
              value={this.props.store.pixelsPerRow}
              onChange={this.props.store.updateHeight}
              style={{ width: "30px" }}
            />
          </span>
          <span>
            {" "}
            Column Width:
            <input
              type="number"
              min={1}
              value={this.props.store.pixelsPerColumn}
              onChange={this.props.store.updateWidth}
              style={{ width: "30px" }}
            />
          </span>
        </div>
      </div>
    );
  }
}

ControlHeader.propTypes = {
  store: PropTypes.object,
};

class VerticalCompressedViewSwitch extends React.Component {
  render() {
    return (
      <Observer>
        {() => (
          <input
            type="checkbox"
            checked={this.props.store.useVerticalCompression}
            onChange={this.props.store.toggleUseVerticalCompression}
          />
        )}
      </Observer>
    );
  }
}

VerticalCompressedViewSwitch.propTypes = {
  store: PropTypes.object,
};

class RenderConnectorSwitch extends React.Component {
  render() {
    return (
      <Observer>
        {() => (
          <input
            type="checkbox"
            checked={this.props.store.useConnector}
            onChange={this.props.store.toggleUseConnector}
          />
        )}
      </Observer>
    );
  }
}

RenderConnectorSwitch.propTypes = {
  store: PropTypes.object,
};

class WidthCompressedViewSwitch extends React.Component {
  render() {
    return (
      <Observer>
        {() => (
          <input
            type="checkbox"
            checked={this.props.store.useWidthCompression}
            onChange={this.props.store.toggleUseWidthCompression}
          />
        )}
      </Observer>
    );
  }
}

WidthCompressedViewSwitch.propTypes = {
  store: PropTypes.object,
};

export default ControlHeader;
