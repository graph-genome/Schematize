

export function calculateEndBinFromScreen(beginBin, chunkIndex, selZoomLev, pixelsPerColumn)
{
    let deviceWidth = 1920; // TODO: get width from browser
    let widthInCells = deviceWidth / pixelsPerColumn;
    let chunkURLarray = []

    let currEnd = beginBin + 1;
    let workingWidth = 0;
    //this loop will automatically cap out at the last bin of the file
    for (let chunk of chunkIndex["zoom_levels"][selZoomLev]["files"]) {
        if(chunk.first_bin >= beginBin){ //don't start until viewport starts
            let width = chunk["last_bin"] - chunk["first_bin"] +
                chunk["component_count"] + chunk["link_count"];
            workingWidth += width;
            chunkURLarray.push(chunk["file"]);
            if(workingWidth > widthInCells){
                // fractional chunk to add, could cut a Component in half
                let columnsLeftToAdd = widthInCells - workingWidth;
                let density = chunk["last_bin"] - chunk["first_bin"] / width;
                currEnd = Math.round(columnsLeftToAdd * density);
                // currEnd = chunk["last_bin"];
                break;
            }
        }
    }

    // store.updateBeginEndBin(b, b + widthInCells);
    //TODO the logic in let width = could be much more complex by looking at
    //width of components and whether various settings are on.  The consequence
    //of overestimating widthInCells is to make the shift buttons step too big
    return [currEnd, chunkURLarray];
}
