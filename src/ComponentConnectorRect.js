import React from 'react';
import { Rect } from 'react-konva';

class ComponentRect extends React.Component {
    state = {
        color: 'darkslategrey'
    };
    render() {
        return (
            <Rect
                x={this.props.x}
                y={this.props.y}
                width={this.props.width}
                height={this.props.height}
                fill={this.state.color}
            />
        );
    }
}

export default ComponentRect