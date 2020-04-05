/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import App from './App';
import controller from './common/controller.js';
import view from './common/view.js';

window.controller = controller;
window.view = view;

async function init() {
  await controller.init();
  await controller.connectToServer();
}

AppRegistry.registerComponent(appName, () => App);

init();
