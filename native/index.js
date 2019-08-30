/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import App from './App';
import LoginScreen from './components/LoginScreen.js';
import controller from './common/controller.js';

window.controller = controller;

async function init() {
  await controller.init();
  await controller.connectToServer();
}

AppRegistry.registerComponent(appName, () => App);

init();
