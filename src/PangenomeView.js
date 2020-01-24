import App from './prototype/App'

export default pluginManager => {
    const { jbrequire } = pluginManager
    const { getRoot } = jbrequire('mobx-state-tree')
    const { observer, PropTypes } = jbrequire('mobx-react')
    const React = jbrequire('react')
    const { useState } = jbrequire('react')

    // material-ui stuff
    const Button = jbrequire('@material-ui/core/Button')
    const Container = jbrequire('@material-ui/core/Container')
    const FormControl = jbrequire('@material-ui/core/FormControl')
    const FormGroup = jbrequire('@material-ui/core/FormGroup')
    const FormLabel = jbrequire('@material-ui/core/FormLabel')
    const Grid = jbrequire('@material-ui/core/Grid')
    const Icon = jbrequire('@material-ui/core/Icon')
    const IconButton = jbrequire('@material-ui/core/IconButton')
    const MenuItem = jbrequire('@material-ui/core/MenuItem')
    const Select = jbrequire('@material-ui/core/Select')
    const ToggleButton = jbrequire('@material-ui/lab/ToggleButton')
    const { makeStyles } = jbrequire('@material-ui/core/styles')
    const { grey } = jbrequire('@material-ui/core/colors')

    const { ResizeHandle } = jbrequire('@gmod/jbrowse-core/ui')
    const { assembleLocString, getSession } = jbrequire('@gmod/jbrowse-core/util')
    const { readConfObject } = jbrequire('@gmod/jbrowse-core/configuration')

    const useStyles = makeStyles(theme => {
        return {
            root: {
                position: 'relative',
                marginBottom: theme.spacing(1),
                overflow: 'auto',
                background: 'white',
            },
            controls: {
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                background: grey[200],
                boxSizing: 'border-box',
                borderRight: '1px solid #a2a2a2',
                borderBottom: '1px solid #a2a2a2',
            },
        }
    })

    const Controls = observer(({ model }) => {
        const classes = useStyles()
        return (
            <div className={classes.controls}>
                {model.hideCloseButton ? null : (
                    <IconButton
                        onClick={model.closeView}
                        className={classes.iconButton}
                        title="close this view"
                        data-testid="pangenome_close_view"
                        color="secondary"
                    >
                        <Icon fontSize="small">close</Icon>
                    </IconButton>
                )}
            </div>
        )
    })

    function PangenomeView({ model }) {
        const classes = useStyles()

        return (
            <div
                className={classes.root}
                style={{
                    width: model.width,
                    height: model.height,
                }}
                data-testid={model.id}
            >
                <Controls model={model} />
                <App model={model} />
            </div>
        )
    }

    PangenomeView.propTypes = {
        model: PropTypes.objectOrObservableObject.isRequired,
    }
    return observer(PangenomeView)
}