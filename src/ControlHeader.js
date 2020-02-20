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
                <input type="number" defaultValue={this.props.store.beginBin}
                       onChange={this.props.store.updateStart}/>-
                <input type="number" defaultValue={this.props.store.endBin}
                       onChange={this.props.store.updateEnd}/>
            </span>
        </div>
        )
    }
}


class BoundNumberInput extends React.Component {
    handleChange = (e) => {
        this.props.appState.myValue = e.target.value;
    };
    render() {
        const { appState } = this.props;
        return (
            <input  type="number" value={appState.myValue} onChange={this.handleChange} />
        );
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