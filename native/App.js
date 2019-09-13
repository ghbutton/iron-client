import React from 'react';
import { createBottomTabNavigator, createStackNavigator, createAppContainer } from 'react-navigation';

import ChatsScreen from './components/ChatsScreen.js';
import LoginScreen from './components/LoginScreen.js';
import LoginVerificationScreen from './components/LoginVerificationScreen.js';
import MessagesScreen from './components/MessagesScreen.js';

const AppTabNavigator = createStackNavigator(  {
    ChatsScreen: ChatsScreen,
    LoginScreen: LoginScreen,
    LoginVerificationScreen: LoginVerificationScreen,
    MessagesScreen: MessagesScreen,
  },
  {
    initialRouteName: "ChatsScreen"
  });

export default createAppContainer(AppTabNavigator);
