/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import {AppRegistry} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {registerScreens} from './screens';
import {name as appName} from './app.json';
import controller from './common/controller.js';

window.controller = controller;

async function init() {
  await controller.init();
  await controller.connectToServer();
}

console.log("Init");

init();
registerScreens();
Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setRoot({
    root: {
      component: {
        name: 'LoginScreen'
      }
    },
  });
});
