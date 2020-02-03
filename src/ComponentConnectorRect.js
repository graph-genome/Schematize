import React from 'react';
import { Rect } from 'react-konva';

class ComponentRect extends React.Component {
    state = {
        color: this.props.color
    };
    render() {
        return (
            <Rect
                x={this.props.x}
                y={this.props.y}
                width={this.props.width}
                height={1}
                fill={this.state.color}
            />
        );
    }
}

export default ComponentRect