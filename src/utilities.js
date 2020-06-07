export const zip = (arr, ...arrs) => {
  /*Credit: https://gist.github.com/renaudtertrais/25fc5a2e64fe5d0e86894094c6989e10*/
  return arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));
};

export function sum(a, b) {
  return a + b;
}

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

export function calculateEndBinFromScreen(
  beginBin,
  selZoomLev,
  store,
  widthInColumns
) {
  //console.log("calculateEndBinFromScreen: widthInColumns --> " + widthInColumns);

  let chunkURLarray = [];
  let fileArrayFasta = [];

  let firstFieldX = -1;

  let level = store.chunkIndex.zoom_levels.get(selZoomLev);
  //this loop will automatically cap out at the last bin of the file
  for (let ichunk = 0; ichunk < level.files.length; ichunk++) {
    // The "x" info is not here
    let chunk = level.files[ichunk];

    //if (areOverlapping(beginBin, endBin, chunk.first_bin, chunk.last_bin)){
    if (chunk.last_bin >= beginBin) {
      const fieldX = store.useWidthCompression ? chunk.compressedX : chunk.x;

      if (firstFieldX === -1) {
        firstFieldX = fieldX;
      }

      /*console.log("fieldX: " + fieldX);
      console.log('fieldX - firstFieldX: ' + (fieldX - firstFieldX))
      console.log("chunk.last_bin: " + chunk.last_bin);*/

      chunkURLarray.push(chunk["file"]);
      if (chunk.fasta !== null) {
        fileArrayFasta.push(chunk.fasta);
      }

      // If the new chunck is outside the windows, the chunk-pushing is over
      if (fieldX - firstFieldX >= widthInColumns) {
        break;
      }
    }
  }

  // store.updateBeginEndBin(b, b + widthInColumns);
  //TODO the logic in let width = could be much more complex by looking at
  //width of components and whether various settings are on.  The consequence
  //of overestimating widthInColumns is to make the shift buttons step too big
  return [chunkURLarray, fileArrayFasta];
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
