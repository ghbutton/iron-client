import React from 'react';
import { createBottomTabNavigator, createStackNavigator, createAppContainer } from 'react-navigation';
import LoginScreen from './components/LoginScreen.js';
import LoginVerificationScreen from './components/LoginVerificationScreen.js';

const AppTabNavigator = createStackNavigator(  {
    LoginScreen: LoginScreen,
    LoginVerificationScreen: LoginVerificationScreen,
  },
  {
    initialRouteName: "LoginScreen"
  });

export default createAppContainer(AppTabNavigator);
