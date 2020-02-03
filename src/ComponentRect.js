import React from 'react';
import { Rect } from 'react-konva';
import ComponentConnectorRect from "./ComponentConnectorRect";

const zip = (arr, ...arrs) => {
  /*Credit: https://gist.github.com/renaudtertrais/25fc5a2e64fe5d0e86894094c6989e10*/
  return arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));
}

export function compress_visible_rows(components){
  /*Returns a Map with key of the original row number and value of the new, compressed row number.
  * Use this for y values of occupancy and LinkColumn cells.  */
  let rows_present = find_rows_visible_in_viewport(components);
  let row_mapping = {};
  let rows_encountered = 0;
  for (let i = 0; i < rows_present.length; i++) {
    if(rows_present[i]){
      row_mapping[i] = (rows_encountered);
      rows_encountered++;
    }
  }
  return row_mapping;
}

function find_rows_visible_in_viewport(components){
  /*The only components passed to this method are the components on the screen.
  * This returns a boolean list of which rows are on the screen. */
  // let rows_present = new Array(components[0].occupants.length).fill(false);
  let per_row = zip(...components.map((x)=> x.occupants))
  let rows_present = per_row.map((row, i) => row.some(x=>x))
  return rows_present;
}

class ComponentRect extends React.Component {
  state = {
    color: 'lightgray'
  };
  handleClick = () => {
    if (this.state.color === 'lightgray') {
      this.setState({color: 'gray'});
    } else if (this.state.color === 'gray') {
      this.setState({color: 'lightgray'});
    }
  };
  handleMouseOver = () => {
    this.setState({color: 'gray'})
  };
  handleMouseOut = () => {
    this.setState({color: 'lightgray'})
  };

  renderOccupants(occupant, i, j) {
    const parent = this.props.item;
    const x_val = this.props.x + (parent.arrivals.length * this.props.pixelsPerColumn);
    const width = (parent.leftPadding() - parent.arrivals.length) * this.props.pixelsPerColumn;
    if (occupant) {
      return <ComponentConnectorRect
          key={"occupant" + i + j}
          x={x_val}
          y={this.props.compressed_row_mapping[j] * this.props.pixelsPerRow + this.props.y}
          width={width}
          height={this.props.pixelsPerRow}
          color={'#838383'}
      />
    } else {
      return null
    }
  };

  renderAllConnectors(){
    let connectorsColumn = this.props.item.departures.slice(-1)[0]
    if(connectorsColumn !== undefined){
      return (<>
        {connectorsColumn.participants.map(
            (entry, j) => {
              return this.renderComponentConnector(entry, j)
            }
        )}
      </>)
    }else{
      return null;
    }
  }

  renderComponentConnector(useConnector, j) {
    let component = this.props.item
    // x is the (num_bins + num_arrivals + num_departures)*pixelsPerColumn
    if (useConnector) {
      const x_val = this.props.x + (component.leftPadding() + component.departures.length-1) * this.props.pixelsPerColumn;
      return <ComponentConnectorRect
          key={"occupant" + j}
          x={x_val}
          y={this.props.y + this.props.compressed_row_mapping[j] * this.props.pixelsPerRow}
          width={this.props.paddingColumns * this.props.pixelsPerColumn} //Clarified and corrected adjacent connectors as based on paddingColumns width #9
          height={this.props.pixelsPerRow}
          color={'#464646'}
      />
    } else {
      return null
    }
  }

  render() {
    return (
        <>
          <Rect
              x={this.props.x}
              y={this.props.y}
              width={this.props.width * this.props.pixelsPerColumn}
              height={this.props.height * this.props.pixelsPerRow} //TODO: change to compressed height
              fill={this.state.color}
              onClick={this.handleClick}
              onMouseOver={this.handleMouseOver}
              onMouseOut={this.handleMouseOut}>
          </Rect>
          {this.props.item.occupants.map(
              (occupant, j) => {
                return this.renderOccupants(occupant, 'i', j);
              })
          }
          {this.renderAllConnectors()}
        </>
    );
  }
}

export default ComponentRect