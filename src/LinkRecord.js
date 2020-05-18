export class LinkRecord {
  constructor(linkColumn, xCoordArrival = 0, xCoordDeparture = 0, isArrival) {
    this.linkColumn = linkColumn;
    if (linkColumn === undefined) {
      console.log(linkColumn, xCoordArrival, xCoordDeparture);
    }
    this.xArrival = xCoordArrival;
    this.xDepart = xCoordDeparture;
    this.elevation = 10;
    this.isArrival = isArrival;
  }
  distance() {
    return Math.abs(this.xDepart - this.xArrival) || 1;
  }
}

export function calculateLinkCoordinates(
  schematic,
  pixelsPerColumn,
  topOffset,
  useWidthCompression,
  binScalingFactor,
  leftXStart
) {
  //leftXStart is necessary as a method at the moment
  /** calculate the x coordinates of all components
   * calculate the x coordinates of all arrivals and departures */

  /* In this dictionary the key is the global unique paddedKey created by @edgetoKey.
    The value is a list of size 2:
    1. Element: the x-coordinate of the arrival link column
    2. Element: the x-coordinate of the corresponding departure link column */
  let linkToXMapping = {}; //(paddedKey): [arrivalX, departureX]

  for (let i = 0; i < schematic.length; i++) {
    let schematizeComponent = schematic[i];
    //schematizeComponent.relativePixelX = leftXStart(schematizeComponent, i, 0, 0);
    //ARRIVALS: Calculate all X
    for (let j = 0; j < schematizeComponent.arrivals.length; j++) {
      let arrival = schematizeComponent.arrivals[j];
      let xCoordArrival = leftXStart(schematizeComponent, i, 0, j);
      let paddedKey = arrival.key;
      if (!(paddedKey in linkToXMapping)) {
        //place holder value, go as far right as possible
        // TODO place holder value in the same place
        linkToXMapping[paddedKey] = new LinkRecord(
          arrival,
          xCoordArrival,
          xCoordArrival,
          true
        );
      } else {
        linkToXMapping[paddedKey].xArrival = xCoordArrival; // set with real value
      }
    }
    //DEPARTURES: Calculate all X
    for (let k = 0; k < schematizeComponent.departures.length - 1; k++) {
      let departure = schematizeComponent.departures[k];
      let xCoordDeparture = leftXStart(
        schematizeComponent,
        i,
        schematizeComponent.arrivals.length +
          (useWidthCompression
            ? binScalingFactor
            : schematizeComponent.num_bin),
        k
      );
      let paddedKey = departure.key;
      if (!(paddedKey in linkToXMapping)) {
        //place holder value, go as far left as possible
        // linkToXMapping[paddedKey] = [this.state.actualWidth + 100, xCoordDeparture]
        linkToXMapping[paddedKey] = new LinkRecord(
          departure,
          xCoordDeparture,
          xCoordDeparture,
          false
        );
      } else {
        linkToXMapping[paddedKey].xDepart = xCoordDeparture; // set real value
      }
    }
  }
  return calculateLinkElevations(linkToXMapping, pixelsPerColumn, topOffset);
}

function calculateLinkElevations(linkToXmapping, pixelsPerColumn, topOffset) {
  /**Starting with the shortest links, claim a spot of elevation to place the link in.
   * As the links get bigger, you take the max() of the range of the link and add 1.
   * This claims the "air space" for that link to travel through without colliding with anything.
   * The longest link should end up on top.  We'll probably need a "link gutter" maximum to keep
   * this from getting unreasonably tall.**/
  let distanceSortedLinks = Object.values(linkToXmapping).sort(
    (a, b) => a.distance() - b.distance()
  );
  let elevationOccupied = reserveElevationAirSpace(
    distanceSortedLinks,
    pixelsPerColumn,
    topOffset
  );
  let top = Math.max(...elevationOccupied) + pixelsPerColumn * 3;
  return [distanceSortedLinks, top];
}

function reserveElevationAirSpace(
  distanceSortedLinks,
  pixelsPerColumn,
  topOffset
) {
  /* Set up an array of zeros, then gradually fill it with height stacking
   * @Simon this section is largely done, it just needs a sorted distanceSortedLinks as input*/
  let length = Math.max(
    0,
    ...distanceSortedLinks.map((x) => Math.max(x.xDepart, x.xArrival))
  ); //this.props.endBin - this.props.beginBin;
  let elevationOccupied = new Array(length).fill(15);
  for (let record of distanceSortedLinks) {
    let linkBegin = Math.max(0, Math.min(record.xArrival, record.xDepart));
    let linkEnd = Math.max(record.xArrival, record.xDepart, linkBegin + 1);
    let range = elevationOccupied.slice(linkBegin, linkEnd + 1);
    let elevation = range.length ? Math.max(...range) : 10;
    if (isNaN(elevation) || !Number.isFinite(elevation)) {
      console.log(
        "Bad elevation",
        record,
        linkBegin,
        linkEnd,
        range,
        elevationOccupied
      );
    }
    const stillSmall = true; //elevation < topOffset / 3;
    elevation += stillSmall ? pixelsPerColumn : pixelsPerColumn / 4;
    for (let x = linkBegin; x < linkEnd && x < elevationOccupied.length; x++) {
      elevationOccupied[x] = elevation;
    }
    record.elevation = elevation; //storing final value for render
  }
  return elevationOccupied;
}
