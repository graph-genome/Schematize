

export function calculateEndBinFromScreen(beginBin, chunkIndex, selZoomLev, store)
{
    let deviceWidth = 1920; // TODO: get width from browser
    let widthInCells = deviceWidth / store.pixelsPerColumn;
    let chunkURLarray = [];
    let fileArrayFasta = [];
    let initialized = false;

    let currEnd = beginBin + 1;
    let workingWidth = 0;
    //this loop will automatically cap out at the last bin of the file
    for (let chunk of chunkIndex["zoom_levels"][selZoomLev]["files"]) {
        if(chunk.last_bin >= beginBin) { //don't start until viewport starts
            if (!initialized) {
                store.setBeginColumnX(chunk.x); //TODO calculate partial chunk X
                // To know which region the chunks cover
                store.setChunkBeginEndBin(chunk.first_bin);
                initialized = true;
            }
            let width = chunk["last_bin"] - chunk["first_bin"] +
                chunk["component_count"] + chunk["link_count"];
            let columnsLeftToAdd = widthInCells - workingWidth;
            workingWidth += width;
            chunkURLarray.push(chunk["file"]);
            if("fasta" in chunk){
                fileArrayFasta.push(chunk["fasta"]);
            }
            if(workingWidth > widthInCells){
                // fractional chunk to add, could cut a Component in half
                let density = (chunk["last_bin"] - chunk["first_bin"]) / width;
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
    return [currEnd, chunkURLarray, fileArrayFasta];
}
