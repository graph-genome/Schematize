import { Layer, Stage, Text } from "react-konva";
import React, { Component } from "react";

import "./App.css";
import PangenomeSchematic from "./PangenomeSchematic";
import ComponentRect, { compress_visible_rows } from "./ComponentRect";
import ComponentNucleotides from "./ComponentNucleotides";
import LinkColumn from "./LinkColumn";
import LinkArrow from "./LinkArrow";
import { calculateLinkCoordinates } from "./LinkRecord";
import NucleotideTooltip from "./NucleotideTooltip";
import ControlHeader from "./ControlHeader";
import { observe } from "mobx";
import {
  arraysEqual,
  calculateEndBinFromScreen,
  stringToColorAndOpacity,
} from "./utilities";

import makeInspectable from "mobx-devtools-mst";

class App extends Component {
  layerRef = React.createRef();
  layerRef2 = React.createRef(null);
  timerHighlightingLink = null;
  timerSelectionLink = null;

  constructor(props) {
    super(props);

    this.updateHighlightedNode = this.updateHighlightedNode.bind(this);
    this.updateSelectedLink = this.updateSelectedLink.bind(this);

    this.state = {
      schematize: [],
      pathNames: [],
      actualWidth: 1,
      buttonsHeight: 0,
    };
    this.schematic = new PangenomeSchematic({ store: this.props.store }); //Read file, parse nothing

    /* == State control flow --> redundancies here can waste processing time
    * STEP #1: whenever jsonName changes, loadIndexFile
    * STEP #2: chunkIndex contents loaded
    * STEP #3: with new chunkIndex, this.openRelevantChunksFromIndex()
    * STEP #4: Set switchChunkURLs
    * STEP #5: once ChunkURLs are listed, go fetchAllChunks
    * STEP #6: fetched chunks go into loadJsonCache
    * STEP #7: JsonCache causes processArray to update chunksProcessed
    * STEP #8: chunksProcessed finishing triggers updateSchematicMetadata with final rendering info for this loaded chunks
      * STEP #9: reserveAirspace
      * STEP #10: calcMaxNumRowsAcrossComponents
    //TODO: separate processArray into its  own observer
    * STEP #11: Y values calculated, trigger do the render
    * */

    //Arrays must be observed directly, simple objects are observed by name
    //STEP #5: once ChunkURLs are listed, go fetchAllChunks
    observe(this.props.store.chunkURLs, this.fetchAllChunks.bind(this));

    // observe(this.props.store, "pixelsPerRow", this.recalcY.bind(this));
    observe(
      this.props.store,
      "useVerticalCompression",
      this.updateSchematicMetadata.bind(this)
    );
    observe(
      this.props.store,
      "useWidthCompression",
      this.recalcXLayout.bind(this)
    );
    observe(this.props.store, "useConnector", this.recalcXLayout.bind(this)); //TODO faster rerender
    observe(this.props.store, "pixelsPerColumn", this.recalcXLayout.bind(this)); //TODO faster rerender
    observe(this.props.store, "pixelsPerRow", this.recalcY.bind(this)); //TODO faster rerender

    //STEP #8: chunksProcessed finishing triggers updateSchematicMetadata with final
    // rendering info for this loaded chunks
    observe(
      this.props.store.chunksProcessed,
      this.updateSchematicMetadata.bind(this)
    );

    //STEP #11: Y values calculated, trigger do the render
    observe(this.props.store, "loading", this.render.bind(this));

    //STEP #3: with new chunkIndex, openRelevantChunksFromIndex
    observe(
      this.props.store,
      "chunkIndex",
      this.openRelevantChunksFromIndex.bind(this)
    );

    observe(
      this.props.store,
      "indexSelectedZoomLevel",
      this.openRelevantChunksFromIndex.bind(this) // Whenever the selected zoom level changes
    );
    observe(
      this.props.store.beginEndBin, //user moves start position
      //This following part is important to scroll right and left on browser
      this.openRelevantChunksFromIndex.bind(this)
    );

    makeInspectable(this.props.store);
  }

  /** Compares bin2file @param indexContents with the beginBin and EndBin.
   * It finds the appropriate chunk URLS from the index and updates
   * switchChunkURLs which trigger json fetches for the new chunks. **/
  openRelevantChunksFromIndex() {
    console.log(
      "STEP #3: with new chunkIndex, this.openRelevantChunksFromIndex()"
    );

    if (
      this.props.store.chunkIndex === null ||
      !this.props.store.chunkIndex.zoom_levels.keys()
    ) {
      return; //before the class is fully initialized
    }
    const beginBin = this.props.store.getBeginBin();

    // With new chunkIndex, it sets the available zoom levels
    this.props.store.setAvailableZoomLevels(
      this.props.store.chunkIndex["zoom_levels"].keys()
    );
    const selZoomLev = this.props.store.getSelectedZoomLevel();
    let [endBin, fileArray, fileArrayFasta] = calculateEndBinFromScreen(
      beginBin,
      selZoomLev,
      this.props.store
    );
    //TODO: commented because maybe it creates problems
    //this.props.store.updateBeginEndBin(beginBin, endBin);

    console.log([selZoomLev, endBin, fileArray, fileArrayFasta]);
    let URLprefix =
      process.env.PUBLIC_URL +
      "test_data/" +
      this.props.store.jsonName +
      "/" +
      selZoomLev +
      "/";
    fileArray = fileArray.map((filename) => {
      return URLprefix + filename;
    });
    fileArrayFasta = fileArrayFasta.map((filename) => {
      return URLprefix + filename;
    });

    this.props.store.switchChunkFastaURLs(fileArrayFasta);

    // If there are no new chunck, it has only to recalcualte the X layout
    if (!this.props.store.switchChunkURLs(fileArray)) {
      this.recalcXLayout();
    }
  }

  fetchAllChunks() {
    /*Dispatches fetches for all chunk files
     * Read https://github.com/graph-genome/Schematize/issues/22 for details
     */
    console.log("STEP #5: once ChunkURLs are listed, go fetchAllChunks");
    console.log("fetchAllChunks", this.props.store.chunkURLs);
    if (!this.props.store.chunkURLs.get(0)) {
      console.warn("No chunk URL defined.");
      return;
    }
    for (let chunkPath of this.props.store.chunkURLs) {
      //TODO: conditional on jsonCache not already having chunk
      console.log("fetchAllChunks - START reading: " + chunkPath);
      this.schematic.jsonFetch(chunkPath).then((data) => {
        console.log("fetchAllChunks - END reading: " + chunkPath);
        this.schematic.loadJsonCache(chunkPath, data);
      });
    }
  }

  updateSchematicMetadata() {
    if (
      arraysEqual(this.props.store.chunkURLs, this.props.store.chunksProcessed)
    ) {
      console.log(
        "updateSchematicMetadata #components: " +
          this.schematic.components.length
      );
      console.log(
        "STEP #8: chunksProcessed finishing triggers updateSchematicMetadata with final rendering info for this loaded chunks"
      );

      // console.log(this.schematic.components);
      this.setState(
        {
          schematize: this.schematic.components,
          pathNames: this.schematic.pathNames,
        },
        () => {
          this.recalcXLayout();

          this.compressed_row_mapping = compress_visible_rows(
            this.schematic.components
          );
          this.maxNumRowsAcrossComponents = this.calcMaxNumRowsAcrossComponents(
            this.schematic.components
          ); // TODO add this to mobx-state-tree
          this.props.store.setLoading(false);
        }
      );
    }
  }

  recalcXLayout() {
    console.log("recalcXLayout");

    // In this way the updated relativePixelX information is available everywhere for the rendering
    for (const [
      i,
      schematizeComponent,
    ] of this.schematic.components.entries()) {
      schematizeComponent.relativePixelX = this.leftXStart(
        schematizeComponent,
        i,
        0,
        0
      );
    }

    const sum = (accumulator, currentValue) => accumulator + currentValue;
    const columnsInComponents = this.schematic.components
      .map(
        (component) =>
          component.arrivals.length +
          (component.departures.length - 1) +
          (this.props.store.useWidthCompression
            ? this.props.store.binScalingFactor + 1
            : component.num_bin)
      )
      .reduce(sum, 0);
    const paddingBetweenComponents =
      this.props.store.pixelsPerColumn * this.schematic.components.length;
    const actualWidth =
      columnsInComponents * this.props.store.pixelsPerColumn +
      paddingBetweenComponents;
    this.setState({
      actualWidth: actualWidth,
    });
    const [links, top] = calculateLinkCoordinates(
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
    // forceUpdate() doesn't work with callback function
    this.setState({ highlightedLink: null }); // nothing code to force update.
  }

  calcMaxNumRowsAcrossComponents(components) {
    let maxNumberRowsInOneComponent = 0;
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const occupants = component.occupants;
      const numberOccupants = occupants.filter(Boolean).length;
      maxNumberRowsInOneComponent = Math.max(
        numberOccupants,
        maxNumberRowsInOneComponent
      );
    }

    return maxNumberRowsInOneComponent;
  }

  visibleHeightPixels() {
    if (
      this.props.store.useVerticalCompression ||
      !this.compressed_row_mapping
    ) {
      // this.state.schematize.forEach(value => Math.max(value.occupants.filter(Boolean).length, maxNumberRowsInOneComponent));
      if (this.maxNumRowsAcrossComponents === undefined) {
        this.maxNumRowsAcrossComponents = this.calcMaxNumRowsAcrossComponents(
          this.schematic.components
        );
      }
      console.log(
        "maxNumRowsAcrossComponents",
        this.maxNumRowsAcrossComponents
      );

      return (
        (this.maxNumRowsAcrossComponents + 2.5) * this.props.store.pixelsPerRow
      );
    } else {
      return (
        //TODO: NOTE that Object.keys is wrong if you change compressed_row_mapping to a mobx object
        (Object.keys(this.compressed_row_mapping).length + 0.25) *
        this.props.store.pixelsPerRow
      );
    }
  }

  componentDidMount = () => {
    let buttonContainerDiv = document.getElementById("button-container");
    let clientHeight = buttonContainerDiv.clientHeight;

    const arrowsDiv = document.getElementsByClassName("konvajs-content")[0];
    arrowsDiv.style.position = "relative";

    this.setState({ buttonsHeight: clientHeight });

    this.layerRef.current.getCanvas()._canvas.id = "cnvs";
    this.layerRef.current.getCanvas()._canvas.position = "relative";

    this.layerRef2.current.getCanvas()._canvas.id = "arrow";
    this.layerRef2.current.getCanvas()._canvas.position = "relative";
    //this.layerRef2.current.getCanvas()._canvas.style.top = "95px";
    /*if(this.props.store.useVerticalCompression) {
      this.props.store.resetRenderStats(); //FIXME: should not require two renders to get the correct number
    }*/
  };

  // Now it is wrapped in the updateHighlightedNode() function
  _updateHighlightedNode = (linkRect) => {
    this.setState({ highlightedLink: linkRect });
    this.recalcXLayout();
  };

  // Wrapper function to wrap the logic (no link selected and time delay)
  updateHighlightedNode = (linkRect) => {
    // The highlighting has to work only if there isn't any selected link
    if (!this.state.selectedLink) {
      if (linkRect != null) {
        // It comes from an handleMouseOver event

        clearTimeout(this.timerHighlightingLink);

        // To avoid unnecessary rendering when linkRect is still the this.state.highlightedLink link.
        if (this.state.highlightedLink !== linkRect) {
          // This ES6 syntaxt avoid to pass the result of the callback to setTimeoutwork.
          // It works because the ES6 arrow function does not change the context of this.
          this.timerHighlightingLink = setTimeout(
            () => {
              this._updateHighlightedNode(linkRect);
            },
            600 // TODO: value to tune. Create a config file where all these hard-coded settings will be
          );
        }
      } else {
        // It comes from an handleMouseOut event

        clearTimeout(this.timerHighlightingLink);

        // To avoid unnecessary rendering when linkRect == null and this.state.highlightedLink is already null for any reason.
        if (this.state.highlightedLink != null) {
          this.timerHighlightingLink = setTimeout(
            () => {
              this._updateHighlightedNode(linkRect);
            },
            600 // TODO: value to tune. Create a config file where all these hard-coded settings will be
          );
        }
      }
    }
  };

  updateSelectedLink = (linkRect, newBeginBin, newEndBin) => {
    console.log("updateSelectedLink");

    const [beginBin, endBin] = this.props.store.beginEndBin;

    // if (linkRect !== this.state.selectedLink) //else it is a re-clik on the same link, so do nothing here
    // TODO: simplify this part, avoiding operations if the arrow is already visibile in the screen
    let update_state = false;
    if (!(beginBin <= newBeginBin && newEndBin <= endBin)) {
      console.log("updateSelectedLink - NewBeginEndBin");

      this.props.store.updateBeginEndBin(newBeginBin, newEndBin);
      update_state = true;
    }

    clearTimeout(this.timerHighlightingLink);

    // Update the rendering if it is selected a new arrow (or deselected the last one) or
    // if the range in changed (clicking on a new arrow or recliking on the same one)
    if (linkRect !== this.selectedLink || update_state) {
      console.log("updateSelectedLink - NewSelection");

      this.setState({
        highlightedLink: linkRect,
        selectedLink: linkRect,
      });
    }

    // Auto de-selection after a delay
    if (linkRect) {
      console.log("Timer deselection");

      // Eventually restart the timer if it was already ongoing
      clearTimeout(this.timerSelectionLink);

      this.timerSelectionLink = setTimeout(
        () => {
          const [beginBin, endBin] = this.props.store.beginEndBin;
          this.updateSelectedLink(null, beginBin, endBin);
        },
        5000 // TODO: to tune. Create a config file where all these hard-coded settings will be
      );
    }
  };

  leftXStart(schematizeComponent, i, firstDepartureColumn, j) {
    /*
    Return the x coordinate pixel that starts the LinkColumn at i, j
    
    If this.props.store.useWidthCompression is false:
    - "schematizeComponent.columnX - this.props.store.beginColumnX" calculates the offset of the current chunk respect to the first chunk loaded
    - "this.props.store.getBeginBin() - this.props.store.chunkBeginBin":" calculates the offset of the current visualized window respect to the starting bin coordinate
    */

    let previousColumns = !this.props.store.useWidthCompression
      ? schematizeComponent.columnX -
        this.props.store.beginColumnX -
        (this.props.store.getBeginBin() - this.props.store.chunkBeginBin - 1)
      : schematizeComponent.columnX -
        this.props.store.beginColumnX +
        (schematizeComponent.index - this.schematic.components[0].index) - //* this.props.store.binScalingFactor -
        (this.props.store.getBeginBin() - this.props.store.chunkBeginBin - 1);

    let pixelsFromColumns =
      (previousColumns + firstDepartureColumn + j) *
      this.props.store.pixelsPerColumn;

    /*console.log(i, firstDepartureColumn, j)
    console.log('previousColumns (' + previousColumns + ') = columnX (
    ' + schematizeComponent.columnX + ') - beginColumnX (' + this.props.store.beginColumnX + ')
     - (getBeginBin (' + this.props.store.getBeginBin() + ') -
     chunkBeginBin (' + this.props.store.chunkBeginBin + ') - 1)')
    console.log('pixelsFromColumns: ' + pixelsFromColumns)*/

    return pixelsFromColumns + i * this.props.store.pixelsPerColumn;
  }

  renderComponent(schematizeComponent, i, pathNames) {
    return (
      <>
        <ComponentRect
          store={this.props.store}
          item={schematizeComponent}
          key={"r" + i}
          height={this.visibleHeightPixels()}
          widthInColumns={
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
    const xCoordArrival = this.leftXStart(
      schematizeComponent,
      i,
      firstDepartureColumn,
      j
    );
    const [localColor, localOpacity, localStroke] = stringToColorAndOpacity(
      linkColumn,
      this.state.highlightedLink,
      this.state.selectedLink
    );
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
        opacity={localOpacity}
        stroke={localStroke}
        updateHighlightedNode={this.updateHighlightedNode}
        compressed_row_mapping={this.compressed_row_mapping}
      />
    );
  }

  renderLink(link) {
    const [localColor, localOpacity] = stringToColorAndOpacity(
      link.linkColumn,
      this.state.highlightedLink,
      this.state.selectedLink
    );

    return (
      <LinkArrow
        store={this.props.store}
        key={"arrow" + link.linkColumn.key}
        link={link}
        color={localColor}
        opacity={localOpacity}
        updateHighlightedNode={this.updateHighlightedNode}
        updateSelectedLink={this.updateSelectedLink}
      />
    );
  }

  renderNucleotidesSchematic = () => {
    if (
      !this.props.store.loading &&
      // The conditions on binWidht and useWidthCompression are lifted here,
      // avoiding any computation if nucleotides have not to be visualized.
      this.props.store.getBinWidth() === 1 &&
      !this.props.store.useWidthCompression &&
      this.props.store.pixelsPerColumn >= 10 &&
      this.schematic.nucleotides.length > 0
    ) {
      //console.log('renderNucleotidesSchematic - START')
      return this.schematic.components.map((schematizeComponent, i) => {
        //TODO: question if this.props.store.chunkBeginBin is necessary
        const nucleotides_slice = this.schematic.nucleotides.slice(
          schematizeComponent.firstBin - this.props.store.chunkBeginBin,
          schematizeComponent.lastBin - this.props.store.chunkBeginBin + 1
        );

        //console.log("nucleotides_slice: " + nucleotides_slice);

        return (
          <React.Fragment key={"nt" + i}>
            <ComponentNucleotides
              store={this.props.store}
              item={schematizeComponent}
              key={i}
              // They are passed only the nucleotides associated to the current component
              nucleotides={nucleotides_slice}
            />
          </React.Fragment>
        );
      });
    }
  };

  renderSchematic() {
    console.log("renderSchematic");

    if (this.props.store.loading) {
      return;
    }

    return this.schematic.components.map((schematizeComponent, i) => {
      return (
        <React.Fragment key={"f" + i}>
          {this.renderComponent(schematizeComponent, i, this.state.pathNames)}
        </React.Fragment>
      );
    });
  }

  renderSortedLinks() {
    if (this.props.store.loading) {
      return;
    }

    return this.distanceSortedLinks.map((record, i) => {
      return this.renderLink(record);
    });
  }

  loadingMessage() {
    if (this.props.store.loading) {
      return (
        <Text
          y={100}
          fontSize={60}
          width={300}
          align="center"
          text="Loading..."
        />
      );
    }
  }

  render() {
    console.log("Start render");

    return (
      <>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: "2",
            background: "white",

            // To keep the matrix under the container with the vertical scrolling
            // when the matrix is larger than the page
            width: this.state.actualWidth + 60,

            // To avoid width too low with large bin_width
            minWidth: "100%",
          }}
        >
          <ControlHeader store={this.props.store} schematic={this.schematic} />

          <Stage
            x={this.props.store.leftOffset}
            y={this.props.topOffset}
            width={this.state.actualWidth + 60}
            height={this.props.store.topOffset}
          >
            <Layer ref={this.layerRef2}>
              {this.renderSortedLinks()}
              {this.renderNucleotidesSchematic()}
            </Layer>
          </Stage>
        </div>

        <Stage
          x={this.props.store.leftOffset} // removed leftOffset to simplify code. Relative coordinates are always better.
          y={-this.props.store.topOffset} // For some reason, I have to put this, but I'd like to put 0
          width={this.state.actualWidth + 60}
          height={
            this.visibleHeightPixels() + this.props.store.nucleotideHeight
          }
        >
          <Layer ref={this.layerRef}>
            {this.loadingMessage()}
            {this.renderSchematic()}
          </Layer>
        </Stage>

        <NucleotideTooltip store={this.props.store} />
      </>
    );
  }
}

// render(<App />, document.getElementById('root'));

export default App;
