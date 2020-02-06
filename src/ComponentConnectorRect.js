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
    render() {
        return (
            <Rect
                data-tip='123,456' data-for='nucleotide_pos'
                x={this.props.x}
                y={this.props.y}
                width={this.props.width}
                height={this.props.height || 1}
                fill={this.props.color}
            />
        );
    }
}

