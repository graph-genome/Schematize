import React, { Component } from 'react';
import { render } from 'react-dom';
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';

class LinkRect extends React.Component {
    constructor(props) {
        super(props) 
    };
    state = {
        color: 'yellow'
    };
    handleClick = () => {
        this.setState({
            color: Konva.Util.getRandomColor()
        });
    };
    render() {
        return (
        <Rect
            x={this.props.x}
            y={this.props.y}
            width={this.props.width}
            height={this.props.height}
            fill={this.props.color}
            shadowBlur={5}
            onClick={this.handleClick}
        />
        );
    }
}
export default LinkRect;