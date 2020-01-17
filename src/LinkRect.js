import React from 'react';
import {Rect} from 'react-konva';

class LinkRect extends React.Component {
    /*
    handleClick = () => {
        this.setState({
            color: Konva.Util.getRandomColor()
        });
    };*/

    dots() {
        let alpha = [];
        for(const [i, boolean] of this.props.item.participants.entries()) {
            if (boolean) {
                alpha.push(i)
            }
        }
        return alpha;
    }
    /**/
    componentDidMount() {
        // Create colored list for putting dots on Link rectangle.
        let coloredList = [];
        /** // CONCLUSION: Colored list dots for link column must be calculated in Python segmentation.
        this.props.pathNames.forEach((p_name, i) => {
            coloredList.push(this.props.item.participants.contains(p_name));
        });
        /**/
        this.setState({
            coloredList: coloredList,
            color: this.props.color
        } );
    }/** /
    componentDidUpdate() {
        this.updateCanvas();
    }
    
    updateCanvas() {
        const ctx = this.refs.rect;
        ctx.fillRect(0, 0, 100, 100);
    }/**/
    render() {
            /**/
        const contents = this.dots();
        return (
            <React.Fragment>
                {contents.map((content) => {
                    return (<Rect
                    x={this.props.x}
                    y={this.props.y + content}
                    width={this.props.width}
                    height={1}
                    fill={this.props.color}
                    // onClick={this.handleClick}
                    />)})}
            </React.Fragment>
        );
            /*/
        return (
            <Rect
                x={this.props.x}
                y={this.props.y}
                width={this.props.width}
                height={this.props.item.participants.length * this.props.pathsPerPixel}
                fill={this.props.color}
            />
        );
        /**/
    }
}
export default LinkRect;