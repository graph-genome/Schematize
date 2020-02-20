import React from 'react';
import {Observer} from 'mobx-react';

class ControlHeader extends React.Component{
    render() {
        return (
        <div style={{'marginBottom':'15px'}}>
            <a href="#" className="button" id="btn-download">Download</a>
            <span> Use Vertical Compression:
                <CompressedViewSwitch store={this.props.store}/>
            </span>
            <span> Pangenome Position:
                <input type="number"/> -
                <input type="number"/>
            </span>
        </div>
        )
    }
}


class CompressedViewSwitch extends React.Component {
    onToggle() {
        this.props.store.toggleUseVerticalCompression();
    }
    render() {
        return (
            <input
                type="checkbox"
                checked={<Observer>{() => this.props.store.useVerticalCompression}</Observer>}
                onChange={this.onToggle.bind(this)}
            />
        );
    }
}

export default ControlHeader