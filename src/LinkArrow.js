import React  from 'react';
import {Arrow} from 'react-konva';

function edgeToKey(downstream, upstream) {
    //FIXME: Check if this is being used
    /**downstream and upstream are always in the same orientation regardless of if it is a
     * departing LinkColumn or an arriving LinkColumn.**/
    return String(downstream).padStart(13, '0') + String(upstream).padStart(13, '0');
}

export class LinkRecord {
    constructor( xCoordArrival=0, xCoordDeparture=0){
        this.xArrival = xCoordArrival;
        this.xDepart = xCoordDeparture;
    }
    distance(){
        return Math.abs(this.xDepart - this.xArrival) || 1;
    }
}

class LinkArrow extends React.Component {
    /** Serves as a contract to store visual layout information**/
    constructor(props) {
        super(props);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
    }
    render() {
        return (
            <Arrow
                upstream={this.props.upstream}
                downstream={this.props.downstream}
                x={this.props.x}
                y={this.props.y}
                bezier={false}
                points={this.props.points}
                strokeWidth={this.props.width}
                fill={this.props.color}
                stroke={this.props.color}
                pointerLength={1}
                pointerWidth={1}
                tension={1/3}
                onMouseOver={this.handleMouseOver}
                onMouseOut={this.handleMouseOut}
                // lineCap={'round'}
            />
        );
    }

    handleMouseOver = () => {
        this.props.updateHighlightedNode(this.props.item)
    };
    handleMouseOut = () => {
        this.props.updateHighlightedNode(null)
    };
}

export default LinkArrow
