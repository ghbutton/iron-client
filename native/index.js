/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import controller from './common/controller.js';

window.controller = controller;
controller.asyncCall();

AppRegistry.registerComponent(appName, () => App);
