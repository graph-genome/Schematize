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
        this.props.store.updateCellTooltipVisibility(true);
        this.props.store.updateCellTooltipContent(this.props.item[2]) //[2] is mean_pos
    }
    onLeave(){
        this.props.store.updateCellTooltipVisibility(false);
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

