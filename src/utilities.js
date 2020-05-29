export function arraysEqual(A, B) {
  return (
    (A.length === 0 && B.length === 0) ||
    (A.length === B.length && A.every((e) => B.indexOf(e) > -1))
  );
}

export function areOverlapping(startA, endA, startB, endB) {
  if (startB < startA) {
    return endB >= startA;
  } else if (startB > startA) {
    return startB <= endA;
  } else {
    return true;
  }
}

export function calculateEndBinFromScreen(beginBin, endBin, selZoomLev, store) {
  /*let deviceWidth = 1920; // TODO: get width from browser
  let widthInCells = deviceWidth / store.pixelsPerColumn;*/
  let chunkURLarray = [];
  let fileArrayFasta = [];

  let currEnd = endBin;
  /*let currEnd = beginBin + 1;
  let workingWidth = 0;*/
  //this loop will automatically cap out at the last bin of the file
  let level = store.chunkIndex.zoom_levels.get(selZoomLev);
  for (let ichunk = 0; ichunk < level.files.length; ichunk++) {
    // The "x" info is not here
    let chunk = level.files[ichunk];
    //if ((beginBin >= chunk.first_bin && beginBin <= chunk.last_bin) || (endBin >= chunk.first_bin & endBin <= chunk.last_bin)) {
    if (areOverlapping(beginBin, endBin, chunk.first_bin, chunk.last_bin)) {
      // TO_DO: future releases will visualzied partial chuncks
      /*let width =
        chunk["last_bin"] -
        chunk["first_bin"] +
        chunk["component_count"] +
        chunk["link_count"];
      let columnsLeftToAdd = widthInCells - workingWidth;
      workingWidth += width;
      console.log('workingWidth ' + workingWidth)*/

      chunkURLarray.push(chunk["file"]);
      if (chunk.fasta !== null) {
        fileArrayFasta.push(chunk.fasta);
      }
      /*if (workingWidth > widthInCells) {
        // fractional chunk to add, could cut a Component in half
        let density = (chunk["last_bin"] - chunk["first_bin"]) / width;
        currEnd = Math.round(columnsLeftToAdd * density);
        // currEnd = chunk["last_bin"];
        break;
      }*/
    }
  }

  // store.updateBeginEndBin(b, b + widthInCells);
  //TODO the logic in let width = could be much more complex by looking at
  //width of components and whether various settings are on.  The consequence
  //of overestimating widthInCells is to make the shift buttons step too big
  return [currEnd, chunkURLarray, fileArrayFasta];
}

export function range(start, end) {
  return [...Array(1 + end - start).keys()].map((v) => start + v);
}

export function stringToColorAndOpacity(
  linkColumn,
  highlightedLinkColumn,
  selectedLink
) {
  const whichLinkToConsider = selectedLink
    ? selectedLink
    : highlightedLinkColumn;

  const colorKey = (linkColumn.downstream + 1) * (linkColumn.upstream + 1);
  if (whichLinkToConsider) {
    // When the mouse in on a Link, all the other ones will become gray and fade out
    let matchColor =
      (whichLinkToConsider.downstream + 1) * (whichLinkToConsider.upstream + 1);
    // Check if the mouse in on a Link (highlightedLinkColumn) or if a Link was clicked (selectedLink)
    if ((!highlightedLinkColumn && !selectedLink) || colorKey === matchColor) {
      return [
        stringToColourSave(colorKey),
        1.0,
        highlightedLinkColumn || selectedLink ? "black" : null,
      ];
    } else {
      return ["gray", 0.3, null];
    }
  } else {
    return [stringToColourSave(colorKey), 1.0, null];
  }
}

export function stringToColourSave(colorKey) {
  colorKey = colorKey.toString();
  let hash = 0;
  for (let i = 0; i < colorKey.length; i++) {
    hash = colorKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  let colour = "#";
  for (let j = 0; j < 3; j++) {
    const value = (hash >> (j * 8)) & 0xff;
    colour += ("00" + value.toString(16)).substr(-2);
  }
  return colour;
}
