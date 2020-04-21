import { Layer, Stage } from "react-konva";
import React, { Component } from "react";

import "./App.css";
import PangenomeSchematic from "./PangenomeSchematic";
import ComponentRect, { compress_visible_rows } from "./ComponentRect";
import LinkColumn from "./LinkColumn";
import LinkArrow from "./LinkArrow";
import { calculateLinkCoordinates } from "./LinkRecord";
import NucleotideTooltip from "./NucleotideTooltip";
import ControlHeader from "./ControlHeader";
import { observe } from "mobx";
import { Rect, Text } from "react-konva";

function stringToColor(linkColumn, highlightedLinkColumn) {
  let colorKey = (linkColumn.downstream + 1) * (linkColumn.upstream + 1);
  if (
    highlightedLinkColumn &&
    colorKey ===
      (highlightedLinkColumn.downstream + 1) *
        (highlightedLinkColumn.upstream + 1)
  ) {
    return "black";
  } else {
    return stringToColourSave(colorKey);
  }
}

const stringToColourSave = function (colorKey) {
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
};

class App extends Component {
  layerRef = React.createRef();
  layerRef2 = React.createRef(null);

  constructor(props) {
    super(props);
    this.updateHighlightedNode = this.updateHighlightedNode.bind(this);
    this.state = {
      schematize: [],
      pathNames: [],
      loading: true,
      actualWidth: 1,
      buttonsHeight: 0,
    };
    this.schematic = new PangenomeSchematic({ store: this.props.store }); //Read file, parse nothing
    observe(this.props.store.beginEndBin, this.updateSchematicMetadata.bind(this));
    observe(this.props.store.chunkURLs, this.fetchAllChunks.bind(this));
    //Arrays must be observed directly, simple objects are observed by name
    observe(this.props.store, "pixelsPerRow", this.recalcY.bind(this));
    observe(this.props.store, "useVerticalCompression", this.recalcY.bind(this));
    observe(this.props.store, "useWidthCompression", this.recalcXLayout.bind(this));
    observe(this.props.store, "useConnector", this.recalcXLayout.bind(this));
    observe(this.props.store, "binScalingFactor", this.recalcXLayout.bind(this));
    observe(this.props.store, "pixelsPerColumn", this.recalcXLayout.bind(this));
    observe(this.props.store, "pixelsPerColumn", this.calculateBinWidthOfScreen.bind(this));
  }

  fetchAllChunks() {
    /*Dispatches fetches for all chunk files
    * Read https://github.com/graph-genome/Schematize/issues/22 for details
     */
    console.log("fetchAllChunks", this.props.store.getChunkURLs());
    if (!this.props.store.getChunkURLs()[0]) {
      console.warn("No chunk URL defined.");
      return;
    }
    for (let chunk of this.props.store.chunkURLs) {
      //TODO: conditional on jsonCache not already having chunk
      this.schematic
          .jsonFetch(chunk)
          .then((data) => this.schematic.loadJsonCache(chunk, data))
          .then(this.updateSchematicMetadata.bind(this));
    }
  }

  updateSchematicMetadata() {
    if (this.schematic.processArray()) {
      //parses beginBin to endBin range, returns false if new file needed
      // console.log("#paths: " + this.schematic.pathNames.length);
      // console.log("#bins: " + (this.props.store.endBin - this.props.store.beginBin + 1));
      console.log(
          "updateSchematicMetadata #components: " +
          this.schematic.components.length
      );

      // console.log(this.schematic.components);
      this.setState(
          {
            schematize: this.schematic.components,
            pathNames: this.schematic.pathNames,
          },
          () => {
            this.recalcXLayout();
            this.compressed_row_mapping = compress_visible_rows(this.schematic.components);
            this.maxNumRowsAcrossComponents = this.calcMaxNumRowsAcrossComponents(
                this.schematic.components); // TODO add this to mobx-state-tree
            this.setState({loading: false});
          }
      );
    }
  }

  recalcXLayout() {
    console.log("recalcXLayout");
    const sum = (accumulator, currentValue) => accumulator + currentValue;
    let columnsInComponents = this.schematic.components.map(
        (component) =>
            component.arrivals.length +
            (component.departures.length - 1) +
            (this.props.store.useWidthCompression
                ? this.props.store.binScalingFactor
                : component.lastBin - component.firstBin) +
            1
    ).reduce(sum, 0);
    let paddingBetweenComponents = this.props.store.pixelsPerColumn * this.schematic.components.length;
    let actualWidth = columnsInComponents * this.props.store.pixelsPerColumn + paddingBetweenComponents;
    this.setState({
      actualWidth: actualWidth,
    });
    let [links, top] = calculateLinkCoordinates(
      this.schematic.components,
      this.props.store.pixelsPerColumn,
      this.props.store.topOffset,
      this.props.store.useWidthCompression,
      this.props.store.binScalingFactor,
      this.leftXStart.bind(this)
    );
    this.distanceSortedLinks = links;
    this.props.store.updateTopOffset(parseInt(top));
  }

  recalcY() {
    //forceUpdate() doesn't work with callback function
    this.setState({ highlightedLink: null }); //nothing code to force update.
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      this.props.store.getBeginBin() !== prevProps.store.getBeginBin() ||
      this.props.store.getEndBin() !== prevProps.store.getEndBin()
    ) {
      this.updateSchematicMetadata();
    }
  }

  calcMaxNumRowsAcrossComponents(components) {
    let maxNumberRowsInOneComponent = 0;
    for (let i = 0; i < components.length; i++) {
      let component = components[i];
      let occupants = component.occupants;
      let numberOccupants = occupants.filter(Boolean).length;
      maxNumberRowsInOneComponent = Math.max(
          numberOccupants,
          maxNumberRowsInOneComponent
      );
    }
    console.log(
      "Max number of rows across components: " + maxNumberRowsInOneComponent
    );

    return maxNumberRowsInOneComponent;
  }

  visibleHeight() {
    if (
      this.props.store.useVerticalCompression ||
      !this.compressed_row_mapping
    ) {
      // this.state.schematize.forEach(value => Math.max(value.occupants.filter(Boolean).length, maxNumberRowsInOneComponent));
      return (
        (this.maxNumRowsAcrossComponents + 2.5) * this.props.store.pixelsPerRow
      );
    } else {
      return (
        (Object.keys(this.compressed_row_mapping).length + 0.25) *
        this.props.store.pixelsPerRow
      );
    }
  }

  calculateBinWidthOfScreen(){
    let deviceWidth = 1920;// TODO: get width from browser
    let widthInCells = deviceWidth / this.props.store.pixelsPerColumn;
    // let paddingBetweenComponents = this.props.store.pixelsPerColumn * 20; //guessing number of components
    let b = this.props.store.getBeginBin();
    this.props.store.updateBeginEndBin(b, b + widthInCells);
    //TODO the logic here could be much more complex by looking at the average pixel
    //width of components and whether vaious settings are on.  The consequence
    //of overestimating widthInCells is to make the shift buttons step too big
  }

  UNSAFE_componentWillMount() {
    this.updateSchematicMetadata();
  }

  componentDidMount = () => {
    var clientHeight = document.getElementById("button-container").clientHeight;
    const arrowsDiv = document.getElementsByClassName("konvajs-content")[1];
    arrowsDiv.style.position = "fixed";
    arrowsDiv.style.top = "95px";
    this.setState({ buttonsHeight: clientHeight });
    this.layerRef.current.getCanvas()._canvas.id = "cnvs";
    this.layerRef2.current.getCanvas()._canvas.id = "arrow";
    this.layerRef2.current.getCanvas()._canvas.style.position = "fixed";
    this.layerRef2.current.getCanvas()._canvas.style.top = "95px";
    /*        if(this.props.store.useVerticalCompression) {
            this.props.store.resetRenderStats(); //FIXME: should not require two renders to get the correct number
        }*/
  };

  updateHighlightedNode = (linkRect) => {
    this.setState({ highlightedLink: linkRect });
    this.recalcXLayout();
    // this.props.store.updateHighlightedLink(linkRect); // TODO this does not work, ask Robert about it
  };

  leftXStart(schematizeComponent, i, firstDepartureColumn, j) {
    /* Return the x coordinate pixel that starts the LinkColumn at i, j*/
    let previousColumns = !this.props.store.useWidthCompression
        ? schematizeComponent.firstBin -
        this.props.store.getBeginBin() +
        schematizeComponent.offset
        : schematizeComponent.offset +
        (schematizeComponent.index - this.schematic.components[0].index) *
        this.props.store.binScalingFactor;
    let pixelsFromColumns =
        (previousColumns + firstDepartureColumn + j) *
        this.props.store.pixelsPerColumn;
    return pixelsFromColumns + i * this.props.store.pixelsPerColumn;
  }

  renderComponent(schematizeComponent, i, pathNames) {
    return (
      <>
        <ComponentRect
          store={this.props.store}
          item={schematizeComponent}
          key={i}
          height={this.visibleHeight()}
          width={
            schematizeComponent.arrivals.length +
            (this.props.store.useWidthCompression
              ? this.props.store.binScalingFactor
              : schematizeComponent.num_bin) +
            (schematizeComponent.departures.length - 1)
          }
          compressed_row_mapping={this.compressed_row_mapping}
          pathNames={pathNames}
        />

        {schematizeComponent.arrivals.map((linkColumn, j) => {
          return this.renderLinkColumn(
            schematizeComponent,
            i,
            0,
            j,
            linkColumn
          );
        })}
        {schematizeComponent.departures.slice(0, -1).map((linkColumn, j) => {
          let leftPad =
            schematizeComponent.arrivals.length +
            (this.props.store.useWidthCompression
              ? this.props.store.binScalingFactor
              : schematizeComponent.num_bin);
          return this.renderLinkColumn(
            schematizeComponent,
            i,
            leftPad,
            j,
            linkColumn
          );
        })}
      </>
    );
  }

  renderLinkColumn(
    schematizeComponent,
    i,
    firstDepartureColumn,
    j,
    linkColumn
  ) {
    let xCoordArrival = this.leftXStart(
      schematizeComponent,
      i,
      firstDepartureColumn,
      j
    );
    let localColor = stringToColor(linkColumn, this.state.highlightedLink);
    return (
      <LinkColumn
        store={this.props.store}
        key={"departure" + i + j}
        item={linkColumn}
        pathNames={this.state.pathNames}
        x={xCoordArrival}
        pixelsPerRow={this.props.store.pixelsPerRow}
        width={this.props.store.pixelsPerColumn}
        color={localColor}
        updateHighlightedNode={this.updateHighlightedNode}
        compressed_row_mapping={this.compressed_row_mapping}
      />
    );
  }

  renderLink(link) {
    return (
      <LinkArrow
        store={this.props.store}
        key={"arrow" + link.linkColumn.key}
        link={link}
        color={stringToColor(link.linkColumn, this.state.highlightedLink)}
        updateHighlightedNode={this.updateHighlightedNode}
      />
    );
  }

  renderSchematic() {
    if (this.state.loading) {
      return;
    }
    return this.schematic.components.map((schematizeComponent, i) => {
      return (
        <React.Fragment key={"f" + i}>
          {this.renderComponent(schematizeComponent, i, this.state.pathNames)}
        </React.Fragment>
      );
    });
  };

  renderSortedLinks() {
    if (this.state.loading) {
      return;
    }

    return this.distanceSortedLinks.map((record, i) => {
      return this.renderLink(record);
    });
  };

  loadingMessage() {
      if (this.state.loading) {
          return <Text y={100} fontSize={60} width={300}
                       align="center" text="Loading..."/>
      }
  }

  render() {
    console.log("Start render");
    return (
      <>
        <ControlHeader store={this.props.store} schematic={this.schematic} />
        <Stage
          x={this.props.store.leftOffset}
          y={this.state.buttonsHeight} //removed leftOffset to simplify code.  Relative coordinates are always better.
          width={this.state.actualWidth + 60}
          height={this.props.store.topOffset + this.visibleHeight()}
        >
          <Layer ref={this.layerRef}>
              {this.loadingMessage()}
              {this.renderSchematic()}</Layer>
        </Stage>
        <Stage
          x={this.props.store.leftOffset}
          y={this.props.topOffset}
          width={this.state.actualWidth + 60}
          height={this.props.store.topOffset}
        >
          <Layer ref={this.layerRef2}>
            <Rect
              x={-20}
              y={-this.state.buttonsHeight + 15}
              width={this.state.actualWidth + 20}
              height={this.props.store.topOffset + this.state.buttonsHeight}
              fill="white"
            />
            {this.renderSortedLinks()}
          </Layer>
        </Stage>
        <NucleotideTooltip store={this.props.store} />
      </>
    );
  }
}

// render(<App />, document.getElementById('root'));

export default App;
