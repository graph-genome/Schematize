import React, { Component } from 'react';
import { render } from 'react-dom';
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';

class LinkRect extends React.Component {
    constructor(props) {
        super(props)
        let index = 0;
        let coloredList = [];

        // Create colored list for putting dots on Link rectangle.
        /*
        props.item.participants.forEach((item, i) => {
            while(item !== props.pathNames[index]) {
                index += 1;
                coloredList.push(false)
            }
            coloredList.push(true)
            index += 1
        })
        while(index < props.pathNames.length) {
            index += 1
            coloredList.push(false)
        }
        */
        this.state = {
            coloredList: coloredList,
            color: this.props.color
        } 
    };
    handleClick = () => {
        this.setState({
            color: Konva.Util.getRandomColor()
        });
    };
                    /*/
            {this.state.coloredList.map((boolean, i) => {if (boolean) { return(
            <Rect
                x={this.props.x}
                y={this.props.y + i}
                width={this.props.width}
                height={1}
                fill={this.state.color}
                onClick={this.handleClick}
            />)

            }})}
            /*/
    render() {
        return (
                <Rect
                    x={this.props.x}
                    y={this.props.y}
                    width={this.props.width}
                    height={this.props.pathNames.length}
                    fill={this.state.color}
                />
        );
    }
}
export default LinkRect;