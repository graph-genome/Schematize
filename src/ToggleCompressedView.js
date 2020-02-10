import React from 'react';
import {Observer} from 'mobx-react';

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

export default CompressedViewSwitch