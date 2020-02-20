import React from 'react';
import { Rect } from 'react-konva';

export class ConnectorRect extends React.Component {
    state = {
        color: this.props.color
    };
    render() {
        return (
            <Rect
                x={this.props.x}
                y={this.props.y}
                width={this.props.width}
                height={this.props.height || 1}
                fill={this.state.color}
            />
        );
    }
}


export class MatrixCell extends React.Component {
    onHover(){
        //tooltip: this.props.item.mean_pos
        this.props.store.updateCellTooltipContent(
            '"'+ this.props.pathName + '": '+ this.props.item[2] +
             ' - '+ this.props.item[3]) //[2] is first, [3] last
    }
    onLeave(){
        this.props.store.updateCellTooltipContent("") // we don't want any tooltip displayed if we leave the cell
    }
    render() {
        return (
            <Rect
                x={this.props.x}
                y={this.props.y}
                width={this.props.width}
                height={this.props.height || 1}
                fill={this.props.color}
                onMouseEnter={this.onHover.bind(this)}
                onMouseLeave={this.onLeave.bind(this)}
            />
        );
    }
}

