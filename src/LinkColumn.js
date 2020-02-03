import React from 'react';
import {Rect} from 'react-konva';


class LinkColumn extends React.Component {
    constructor(props) {
        super(props);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
    }
    handleMouseOver(){
        this.props.updateHighlightedNode(this.props.item)
    }
    handleMouseOut(){
        this.props.updateHighlightedNode(null)
    }
    linkCells() {
        let alpha = [];
        for(const [i, boolean] of this.props.item.participants.entries()) {
            if (boolean && this.props.compressed_row_mapping.hasOwnProperty(i)) {
                let row = this.props.compressed_row_mapping[i] * this.props.store.pixelsPerRow;
                if(row !== undefined){ // it's possible a row didn't have enough coverage but still created a Link
                    alpha.push(row) //relative compressed Y coordinate
                }
            }
        }
        return alpha;
    }
    componentDidMount() {
        this.setState({
            color: this.props.color,
        } );
    }
    render() {
        const contents = this.linkCells();
        return (
            <>
                {contents.map((y_coord, d) => {
                    return (<Rect
                        key={"dot" + d}
                        x={this.props.x}
                        y={this.props.store.topOffset + y_coord}
                        width={this.props.store.pixelsPerColumn}
                        height={this.props.store.pixelsPerRow}
                        fill={this.props.color}
                        // onClick={this.handleClick}
                        onMouseOver={this.handleMouseOver}
                        onMouseOut={this.handleMouseOut}
                    />)})}
            </>
        );
    }
}
export default LinkColumn;