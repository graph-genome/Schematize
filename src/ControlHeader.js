import React from 'react';
import {Observer} from 'mobx-react';

class ControlHeader extends React.Component{
    shift(diff){
        this.props.store.updateStartAndEnd(this.props.store.beginBin + diff,
            this.props.store.endBin + diff);
    }
    render() {
        return (
        <div style={{'marginBottom':'15px'}}>
            <button className="button" id="btn-download">Save Image</button>
            <input type="text" defaultValue={this.props.store.jsonName} style={{width: '330px'}}
                onChange={this.props.store.tryJSONpath} title={"File:"}/>
            <span style={{'marginLeft': '30px'}}>
                <button className="button" onClick={()=>this.shift(-20)}>⮜</button>
                <button className="button" onClick={()=>this.shift(-10)}>⮘</button>
                Pangenome Position:
                <Observer>{() => <>
                <input type="number" value={this.props.store.beginBin}
                       onChange={(event)=>this.props.store.updateStartAndEnd(event.target.value, this.props.store.endBin)}
                       style={{width: '80px'}}/>-
                <input type="number" value={this.props.store.endBin}
                       onChange={(event)=>this.props.store.updateStartAndEnd(this.props.store.beginBin,event.target.value)}
                       style={{width: '80px'}}/>
                </>}</Observer>
                <button className="button" onClick={()=>this.shift(10)}>⮚</button>
                <button className="button" onClick={()=>this.shift(20)}>⮞</button>
            </span>
            <div className={'row'}>
                <span> Use Vertical Compression:
                    <CompressedViewSwitch store={this.props.store}/>
                </span>
                <span> Row Height:
                    <input type="number" min={1} value={this.props.store.pixelsPerRow}
                           onChange={this.props.store.updateHeight} style={{width: '30px'}}/>
                </span>
                <span> Column Width:
                    <input type="number" min={1} value={this.props.store.pixelsPerColumn}
                           onChange={this.props.store.updateWidth} style={{width: '30px'}}/>
                </span>
            </div>
        </div>
        )
    }
}

class CompressedViewSwitch extends React.Component {
    render() {
        return (
            <input
                type="checkbox"
                value={<Observer>{() => this.props.store.useVerticalCompression}</Observer>}
                onChange={this.props.store.toggleUseVerticalCompression}
            />
        );
    }
}

export default ControlHeader