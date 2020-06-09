[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

This [project](https://graph-genome.github.io//project.html#teamwork-documents) was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Getting Started


```bash
git clone https://github.com/graph-genome/Schematize
cd Schematize
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

## JBrowse2 Integration

The whole code in this repository is integrated as a submodule in [GMOD](http://gmod.org/wiki/Main_Page)'s
 [JBrowse-Components](https://github.com/GMOD/jbrowse-components). 
 We are currently stashing our code @https://github.com/graph-genome/jbrowse-components/tree/pangenome_group_testing.
 
 In order to get the plugin in JBrowse-Web to run, execute the following
 steps:
 
 Clone the JBrowse-Components repository:
 
 `git clone --recurse-submodules -b pangenome_group_testing git@github.com:graph-genome/jbrowse-components.git`

Install dependencies:
 
 `cd jbrowse-components/`
 
 `yarn`
 
 Start the development server (it takes some time until it is up...):
 
 `(cd packages/jbrowse-web/ && yarn start)`
 
 Navigate to `File` -> `New pangenome view`. Now you have a PangenomeView track running in JBrowse2!
 
 ### Developer Notes

 All test files must be copied to `jbrowse-components/packages/jbrowse-web/test_data`. 
 In `jbrowse-components/packages/pangenome-view/src/PangenomeView/components/prototype/src/PangenomeSchematic.js` change path `data` to path `test_data` so that we point to the currect folder for our data to load.
