import App from "./prototype/App";

export default (pluginManager) => {
  const { jbrequire } = pluginManager;
  const { observer, PropTypes } = jbrequire("mobx-react");
  const React = jbrequire("react");

  // material-ui stuff
  const Icon = jbrequire("@material-ui/core/Icon");
  const IconButton = jbrequire("@material-ui/core/IconButton");
  const { makeStyles } = jbrequire("@material-ui/core/styles");
  const { grey } = jbrequire("@material-ui/core/colors");

  const useStyles = makeStyles((theme) => {
    return {
      root: {
        position: "relative",
        marginBottom: theme.spacing(1),
        overflow: "auto",
        background: "white",
      },
      controls: {
        overflow: "hidden",
        whiteSpace: "nowrap",
        background: grey[200],
        boxSizing: "border-box",
        borderRight: "1px solid #a2a2a2",
        borderBottom: "1px solid #a2a2a2",
      },
    };
  });

  const Controls = observer(({ model }) => {
    const classes = useStyles();
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
    );
  });

  function PangenomeView({ model }) {
    const classes = useStyles();

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
    );
  }

  PangenomeView.propTypes = {
    model: PropTypes.objectOrObservableObject.isRequired,
  };
  return observer(PangenomeView);
};
