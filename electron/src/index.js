import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import view from './common/view.js';
import controller from './common/controller.js';

// Setup
window.view = view;
window.apiCallbacks = {};
window.controller = controller;

async function init() {
  await controller.init();
  ReactDOM.render(<App/>, document.getElementById('root'));
  await controller.connectToServer();
}

init();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
