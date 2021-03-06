import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {NativeEventEmitter, NativeModules} from 'react-native';
const {EventManager} = NativeModules;
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import { Root } from "native-base";

import ChatsScreen from './screens/ChatsScreen.js';
import ForceUpgradeScreen from './screens/ForceUpgradeScreen.js';
import InvitationScreen from './screens/InvitationScreen.js';
import LoadingScreen from './screens/LoadingScreen.js';
import LoginScreen from './screens/LoginScreen.js';
import LoginVerificationScreen from './screens/LoginVerificationScreen.js';
import NewChatScreen from './screens/NewChatScreen.js';
import NewUserWizardScreen from './screens/NewUserWizardScreen.js';
import MessagesScreen from './screens/MessagesScreen.js';
import SettingsScreen from './screens/SettingsScreen.js';
import UpdateUserScreen from './screens/UpdateUserScreen.js';

import TopLevel from './components/TopLevel.js';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const forceUpgradeState = 'force_upgrade';
const loggedInState = 'logged_in';
const loggedOutState = 'logged_out';
const loadingState = 'loading';
const newUserState = 'new_user';

export default function App() {
  const [state, setState] = React.useState(loadingState);
  const [isDev, setIsDev] = useState(false);

  const loadedNoUser = event => {
    setState(loggedOutState);
  };

  const forceUpgrade = async event => {
    setState(forceUpgradeState);
  };

  const loggedIn = async event => {
    const hasName = await window.controller.currentUserHasName();
    if (hasName) {
      setState(loggedInState);
    } else {
      setState(newUserState);
    }
  };

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(EventManager);
    const listenerNoUser = eventEmitter.addListener(
      'loaded_no_user',
      loadedNoUser,
    );
    const listenerForceUpgrade = eventEmitter.addListener(
      'force_upgrade',
      forceUpgrade,
    );
    const listenerWithUser = eventEmitter.addListener(
      'loaded_with_user',
      loggedIn,
    );
    setIsDev(window.controller.isDev());

    return function cleanup() {
      listenerNoUser.remove();
      listenerWithUser.remove();
    };
  }, []);

  const stylizeHeader = title => {
    let headerStyle = {};
    if (isDev) {
      headerStyle = {backgroundColor: '#f4511e'};
    }
    return {
      headerStyle,
      title,
    };
  };

  const ChatsTab = () => {
    return (
      <Stack.Navigator initialRouteName="ChatsScreen">
        <Stack.Screen
          name="ChatsScreen"
          options={stylizeHeader('Chats')}
          component={ChatsScreen}
        />
        <Stack.Screen
          name="InvitationScreen"
          options={stylizeHeader('Invitation')}
          component={InvitationScreen}
        />
        <Stack.Screen
          name="MessagesScreen"
          options={stylizeHeader('Messages')}
          component={MessagesScreen}
        />
        <Stack.Screen
          name="NewChatScreen"
          options={stylizeHeader('New Chat')}
          component={NewChatScreen}
        />
      </Stack.Navigator>
    );
  };

  const SettingsTab = () => {
    return (
      <Stack.Navigator initialRouteName="SettingsScreen">
        <Stack.Screen
          name="SettingsScreen"
          options={stylizeHeader('Settings')}
          component={SettingsScreen}
        />
        <Stack.Screen
          name="UpdateUserScreen"
          options={stylizeHeader('Update User')}
          component={UpdateUserScreen}
        />
      </Stack.Navigator>
    );
  };

  const navigator = state => {
    switch (state) {
      case forceUpgradeState:
        return (
          <Stack.Navigator
            initialRouteName="ForceUpgradeScreen"
            screenOptions={{headerShown: false}}>
            <Stack.Screen name="ForceUpgradeScreen" component={ForceUpgradeScreen} />
          </Stack.Navigator>
        )
      case loadingState:
        return (
          <Stack.Navigator
            initialRouteName="LoadingScreen"
            screenOptions={{headerShown: false}}>
            <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
          </Stack.Navigator>
        );
      case loggedOutState:
        return (
          <Stack.Navigator initialRouteName="LoginScreen">
            <Stack.Screen
              name="LoginScreen"
              options={stylizeHeader('Login')}
              component={LoginScreen}
            />
            <Stack.Screen
              name="LoginVerificationScreen"
              options={stylizeHeader('Login Verification')}
              component={LoginVerificationScreen}
            />
          </Stack.Navigator>
        );
      case loggedInState:
        return (
          <Tab.Navigator initialRouteName="ChatsTab">
            <Tab.Screen name="Chats" component={ChatsTab} />
            <Tab.Screen name="Settings" component={SettingsTab} />
          </Tab.Navigator>
        );
      case newUserState:
        return (
          <Stack.Navigator initialRouteName="NewUserWizard">
            <Stack.Screen
              name="NewUserWizardScreen"
              options={stylizeHeader('New User')}
              component={NewUserWizardScreen}
            />
          </Stack.Navigator>
        );
    }
  };

  return (
    <NavigationContainer>
      <Root>
        <TopLevel />
        {navigator(state)}
      </Root>
    </NavigationContainer>
  );
}
