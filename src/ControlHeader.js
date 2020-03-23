import React from 'react';
import {Observer} from 'mobx-react';
import {httpGetAsync} from './URL';

class ControlHeader extends React.Component{
    shift(percentage){
        const beginBin = this.props.store.getBeginBin();
        const endBin = this.props.store.getEndBin();
        let size = endBin - beginBin;
        let diff = Math.floor(size * (percentage / 100));
        console.log("Diff: " + diff);
        this.props.store.updateBeginEndBin(beginBin + diff,
            endBin + diff);
    }

    handleJump() {
        console.log("JUMP: path name: " + this.props.store.getPath() + " nucleotide position: " + this.props.store.getNucPos());
        // I don't know why, but in order for the CORS headers to exchange we need to make a first GET request to "/hi" which will not return anything

        const store = this.props.store;
        const addr = store.pathIndexServerAddress;
        const path_name = store.getPath();
        const nuc_pos = store.getNucPos();
        const binWidth = store.binWidth;

        function handleOdgiServerResponse(result) {
            if (result === "0") {
                alert("The jump query returned 0. Either your path does not exist or your position in the path is wrong. Please try again.")
            }
            console.log(result);
            // go from nucleotide position to bin
            result = parseInt(result);
            const newBeginBin = Math.ceil(result / binWidth);
            console.log(newBeginBin);
            store.updateBeginEndBin(newBeginBin, store.getEndBin());
        }
        // httpGetAsync(addr + "hi", printResult);
        // httpGetAsync(addr + "5/1", printResult);
        // httpGetAsync(addr + "4/3", printResult);
        httpGetAsync(addr + path_name + "/" + nuc_pos, handleOdgiServerResponse);
    }

    render() {
        return (
        <div style={{'marginBottom':'15px'}}>
            <button className="button" id="btn-download">Save Image</button>
            <input type="text" defaultValue={this.props.store.jsonName} style={{width: '330px'}}
                onChange={this.props.store.tryJSONpath} title={"File:"}/>
            <span style={{'marginLeft': '30px'}}>
                <button className="button" onClick={()=>this.shift(-100)}>
                    &lt;&lt;
                </button>
                <button className="button" onClick={()=>this.shift(-50)}>
                    &lt;
                </button>
                Pangenome Bin Position:
                <Observer>{() => <>
                <input type="number" value={this.props.store.beginEndBin[0]} // TODO Get methods don't work here, but I don't know why. Need to ask Robert Buels.
                       onChange={(event)=>this.props.store.updateBeginEndBin(event.target.value, this.props.store.getEndBin())}
                       style={{width: '80px'}}/>-
                <input type="number" value={this.props.store.beginEndBin[1]}
                       onChange={(event)=>this.props.store.updateBeginEndBin(this.props.store.getBeginBin(),event.target.value)}
                       style={{width: '80px'}}/>
                </>}</Observer>
                <button className="button" onClick={()=>this.shift(50)}>
                    &gt;
                </button>
                <button className="button" onClick={()=>this.shift(100)}>
                    &gt;&gt;
                </button>
            </span>
            <div className={'row'}>
                Jump to path at nucleotide position:
                <input type="string"
                       placeholder={"path"}
                       onChange={(event)=>this.props.store.updatePathNucPos(event.target.value, this.props.store.getNucPos())}
                       style={{width: '80px'}}/>
                -

                <input type="number"
                       placeholder={"position"}
                       onChange={(event)=>this.props.store.updatePathNucPos(this.props.store.getPath(), event.target.value)}
                       style={{width: '80px'}}/>
                <span style={{'marginLeft': '2px'}}>
                    <button className="button" onClick={() => this.handleJump()}>
                    Jump
                    </button>
                </span>
            </div>
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