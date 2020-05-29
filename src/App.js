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
  areOverlapping,
  arraysEqual,
  calculateEndBinFromScreen,
  stringToColorAndOpacity,
} from "./utilities";

import makeInspectable from "mobx-devtools-mst";

// TO_DO: improve the management of visualzied components
let index_to_component_to_visualize_dict;

class App extends Component {
  layerRef = React.createRef();
  layerRef2 = React.createRef(null);

  // Timer for the LinkArrow highlighting and selection (clicking on it)
  timerHighlightingLink = null;
  timerSelectionLink = null;

  constructor(props) {
    super(props);

    // TODO: Are these 2 instructions necessary?
    //this.updateHighlightedNode = this.updateHighlightedNode.bind(this);
    //this.updateSelectedLink = this.updateSelectedLink.bind(this);

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
    observe(this.props.store, "useWidthCompression", () => {
      this.recalcXLayout();
    });
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

    // For debugging purposes
    makeInspectable(this.props.store);
  }

  prepareWhichComponentsToVisualize() {
    // It prepares a dictionary with the components to visualize. It is improvable putting all the components
    // in a dictionary (this.schematic.components becames a dictionary).

    index_to_component_to_visualize_dict = {};

    for (const schematizeComponent of this.schematic.components) {
      //console.log('PREPARE: ' + schematizeComponent.index + ': [' + schematizeComponent.firstBin + ',' + schematizeComponent.lastBin + '] - ' + schematizeComponent.arrivals.length + ' - ' + schematizeComponent.departures.length)
      if (
        areOverlapping(
          this.props.store.getBeginBin(),
          this.props.store.getEndBin(),
          schematizeComponent.firstBin,
          schematizeComponent.lastBin
        )
      ) {
        index_to_component_to_visualize_dict[
          schematizeComponent.index
        ] = schematizeComponent;
      } else {
        if (Object.keys(index_to_component_to_visualize_dict).length > 0) {
          // The components to visualized was already taken
          break;
        }
      }
    }

    //console.log(this.schematic.components.length)
    //console.log(this.props.store.getBeginBin() + ' - ' + this.props.store.getEndBin())
    //console.log('index_to_component_to_visualize_dict: '  + Object.keys(index_to_component_to_visualize_dict))
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
      this.props.store.getEndBin(),
      selZoomLev,
      this.props.store
    );

    //TODO: commented because maybe it creates problems
    //this.props.store.updateBeginEndBin(beginBin, endBin);

    this.prepareWhichComponentsToVisualize();

    //console.log([selZoomLev, endBin, fileArray, fileArrayFasta]);
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

    // If there are no new chunck, it has only to recalculate the X layout
    if (!this.props.store.switchChunkURLs(fileArray)) {
      this.recalcXLayout();
    }
  }

  fetchAllChunks() {
    /*Dispatches fetches for all chunk files
     * Read https://github.com/graph-genome/Schematize/issues/22 for details
     */
    console.log("STEP #5: once ChunkURLs are listed, go fetchAllChunks");
    //console.log("fetchAllChunks", this.props.store.chunkURLs);
    if (!this.props.store.chunkURLs.get(0)) {
      console.warn("No chunk URL defined.");
      return;
    }
    for (let chunkPath of this.props.store.chunkURLs) {
      //TODO: conditional on jsonCache not already having chunk
      //console.log("fetchAllChunks - START reading: " + chunkPath);
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

      this.prepareWhichComponentsToVisualize();

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

    // The actualWidth is calculated on the visualized components
    const columnsInComponents = Object.values(
      index_to_component_to_visualize_dict
    )
      .map(
        (component) =>
          component.arrivals.length +
          component.departures.length +
          (this.props.store.useWidthCompression
            ? this.props.store.binScalingFactor
            : component.num_bin)
      )
      .reduce(sum, 0);

    //TO_DO: to remove?
    /*const paddingBetweenComponents =
      this.props.store.pixelsPerColumn * this.schematic.components.length;*/
    const actualWidth = columnsInComponents * this.props.store.pixelsPerColumn;
    //+ paddingBetweenComponents;
    this.setState({
      actualWidth: actualWidth,
    });
    const [links, top] = calculateLinkCoordinates(
      this.schematic.components,
      this.props.store.pixelsPerColumn,
      this.props.store.topOffset,
      this.props.store.useWidthCompression,
      this.props.store.binScalingFactor,
      this.leftXStart.bind(this),
      index_to_component_to_visualize_dict
    );
    this.distanceSortedLinks = links;
    this.props.store.updateTopOffset(parseInt(top));
  }

  recalcY() {
    // forceUpdate() doesn't work with callback function
    this.setState({ highlightedLink: null }); // nothing code to force update.
  }

  calcMaxNumRowsAcrossComponents(components) {
    let lengths = components.map((x) => {
      return x.occupants.length;
    });
    return Math.max(...lengths); //this should likely be faster than doing a search for true values
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
      /*console.log(
        "maxNumRowsAcrossComponents",
        this.maxNumRowsAcrossComponents
      );*/

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
    /*let buttonContainerDiv = document.getElementById("button-container");
    let clientHeight = buttonContainerDiv.clientHeight;

    const arrowsDiv = document.getElementsByClassName("konvajs-content")[0];
    arrowsDiv.style.position = "relative";

    this.setState({ buttonsHeight: clientHeight });

    this.layerRef.current.getCanvas()._canvas.id = "cnvs";
    this.layerRef.current.getCanvas()._canvas.position = "relative";

    this.layerRef2.current.getCanvas()._canvas.id = "arrow";
    this.layerRef2.current.getCanvas()._canvas.position = "relative";*/
    //this.layerRef2.current.getCanvas()._canvas.style.top = "95px";
    /*if(this.props.store.useVerticalCompression) {
      this.props.store.resetRenderStats(); //FIXME: should not require two renders to get the correct number
    }*/
  };

  // Now it is wrapped in the updateHighlightedNode() function
  _updateHighlightedNode = (linkRect) => {
    this.setState({ highlightedLink: linkRect });
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

  updateSelectedLink = (linkRect) => {
    console.log("updateSelectedLink");

    let update_state = false;

    if (linkRect) {
      //TO_DO: lift down this logic when it will be visualized partial chunks (or
      // pass info about the visualized chunks to the LinkArrow tags)
      const [bin1, bin2] = [linkRect.upstream, linkRect.downstream].sort(
        function (a, b) {
          return a - b;
        }
      );

      /*console.log([linkRect.upstream, linkRect.downstream])
      console.log(bin1, bin2)*/

      const last_bin_last_visualized_component = Object.values(
        index_to_component_to_visualize_dict
      ).slice(-1)[0].lastBin;
      // if (linkRect !== this.state.selectedLink) //else it is a re-clik on the same link, so do nothing here

      const [beginBin, endBin] = this.props.store.beginEndBin;
      if (bin1 < beginBin || bin2 > last_bin_last_visualized_component) {
        console.log("updateSelectedLink - NewBeginEndBin");

        const end_closer = Math.abs(beginBin - bin1) < Math.abs(endBin - bin2);

        let [newBeginBin, newEndBin] = this.props.store.beginEndBin;
        if (!end_closer) {
          [newBeginBin, newEndBin] = [bin1, bin1 + (endBin - beginBin)];
        } else {
          [newBeginBin, newEndBin] = [bin2 - (endBin - beginBin), bin2];
        }

        this.props.store.updateBeginEndBin(newBeginBin, newEndBin);
        update_state = true;
      }
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
          this.updateSelectedLink(null);
        },
        5000 // TODO: to tune. Create a config file where all these hard-coded settings will be
      );
    }
  };

  leftXStart(schematizeComponent, i, firstDepartureColumn, j) {
    // Avoid calling the function too early or for not visualized components
    if (!(schematizeComponent.index in index_to_component_to_visualize_dict)) {
      return;
    }

    /*
    Return the x coordinate pixel that starts the LinkColumn at i, j
    
    - "schematizeComponent.columnX - first_visualized_component.columnX" calculates the offset of the current component respect to the first visualized component
    - "first_visualized_component.arrivals.length + (this.props.store.getBeginBin() - first_visualized_component.firstBin": to hide the arrow on the left
    - "(schematizeComponent.index - this.schematic.components[0].index" calculates the number of padding white columns
    */

    /* console.log('schematizeComponent.columnX ' + schematizeComponent.columnX)
    console.log('schematizeComponent.relativePixelX ' + schematizeComponent.relativePixelX)
    console.log('first_visualized_component.columnX ' + first_visualized_component.columnX)
    console.log('first_visualized_component.arrivals.length ' + first_visualized_component.arrivals.length)
    console.log('first_visualized_component.firstBin ' + first_visualized_component.firstBin)
    console.log('schematizeComponent.firstBin ' + schematizeComponent.firstBin)*/
    /*console.log(
      "this.schematic.components[0].index: " +
        this.schematic.components[0].index
    );
    console.log(
      "first_visualized_component.index: " + first_visualized_component.index
    );*/

    const first_visualized_component = Object.values(
      index_to_component_to_visualize_dict
    )[0];

    const column_shift = !this.props.store.useWidthCompression
      ? first_visualized_component.firstBin === this.props.store.getBeginBin()
        ? 0
        : first_visualized_component.arrivals.length +
          (this.props.store.getBeginBin() - first_visualized_component.firstBin)
      : 0; // When only rearrangements are shown, the width does not correspond to the number of bin, so for now we avoid any shifting

    const previousColumns =
      schematizeComponent.getColumnX(this.props.store.useWidthCompression) -
      first_visualized_component.getColumnX(
        this.props.store.useWidthCompression
      ) -
      column_shift -
      (schematizeComponent.index - this.schematic.components[0].index);

    const pixelsFromColumns =
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
        if (schematizeComponent.index in index_to_component_to_visualize_dict) {
          // The dummy component (firstBin and lastBin equal to 0) is not loaded in this.schematic.components, but there is a nucleotide for it in the FASTA file.
          // If the first component has firstBin == 1, then in the FASTA there is a nucleotide not visualized, so the shift start from 0, and not 1
          const nt_shift =
            this.schematic.components[0].firstBin === 1
              ? 0
              : this.schematic.components[0].firstBin;

          const nucleotides_slice = this.schematic.nucleotides.slice(
            schematizeComponent.firstBin - nt_shift,
            schematizeComponent.lastBin - nt_shift + 1
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
        } else {
          return null;
        }
      });
    }
  };

  renderSchematic() {
    console.log("renderSchematic");

    if (this.props.store.loading) {
      return;
    }

    return this.schematic.components.map((schematizeComponent, i) => {
      if (schematizeComponent.index in index_to_component_to_visualize_dict) {
        return (
          <React.Fragment key={"f" + i}>
            {this.renderComponent(schematizeComponent, i, this.state.pathNames)}
          </React.Fragment>
        );
      } else {
        return null;
      }
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
          key="loading"
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

    //console.log('renderNucleotidesSchematic - START')

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
            width: this.state.actualWidth,

            // To avoid width too low with large bin_width
            minWidth: "100%",
          }}
        >
          <ControlHeader store={this.props.store} schematic={this.schematic} />

          <Stage
            x={this.props.store.leftOffset}
            y={this.props.topOffset}
            width={this.state.actualWidth}
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
          width={this.state.actualWidth}
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
