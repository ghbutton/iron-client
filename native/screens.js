import {Navigation} from 'react-native-navigation';

export function registerScreens() {
  Navigation.registerComponent('Home', () => require('./components/LoginScreen').default);
  Navigation.registerComponent('Initializing', (sc) => require('./components/LoginValidationScreen').default);
}
