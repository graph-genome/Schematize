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
    dots() {
        let alpha = [];
        for(const [i, boolean] of this.props.item.participants.entries()) {
            if (boolean) {
                alpha.push(i)
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
        const contents = this.dots();
        return (
            <>
                {contents.map((content, d) => {
                    return (<Rect
                        key={"dot" + d}
                        x={this.props.x}
                        y={this.props.y + content}
                        width={this.props.width}
                        height={1}
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