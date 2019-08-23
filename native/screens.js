import {Navigation} from 'react-native-navigation';

export function registerScreens() {
  Navigation.registerComponent('LoginScreen', () => require('./components/LoginScreen').default);
  Navigation.registerComponent('LoginValidationScreen', (sc) => require('./components/LoginValidationScreen').default);
}
