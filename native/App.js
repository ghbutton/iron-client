import React, {useEffect} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NativeEventEmitter, NativeModules} from 'react-native';
const { EventManager } = NativeModules;
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ChatsScreen from './screens/ChatsScreen.js';
import LoadingScreen from './screens/LoadingScreen.js';
import LoginScreen from './screens/LoginScreen.js';
import LoginVerificationScreen from './screens/LoginVerificationScreen.js';
import NewUserWizardScreen from './screens/NewUserWizardScreen.js';
import MessagesScreen from './screens/MessagesScreen.js';
import SettingsScreen from './screens/SettingsScreen.js';
import UpdateUserScreen from './screens/UpdateUserScreen.js';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const loggedInState = "logged_in";
const loggedOutState = "logged_out";
const loadingState = "loading";
const newUserState = "new_user";

export default function App() {
  const [state, setState] = React.useState(loadingState);

  const loadedNoUser = (event) => {
    setState(loggedOutState);
  };

  const loggedIn = async (event) => {
    const hasName = await window.controller.currentUserHasName();
    if (hasName) {
      setState(loggedInState);
    } else {
      setState(newUserState);
    }
  };

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(EventManager);
    const listenerNoUser = eventEmitter.addListener('loaded_no_user', loadedNoUser);
    const listenerWithUser = eventEmitter.addListener('loaded_with_user', loggedIn);

    return function cleanup() {
      listenerNoUser.remove();
      listenerWithUser.remove();
    };
  });

  const ChatsTab = () => {
    return (
      <Stack.Navigator initialRouteName="ChatsScreen">
        <Stack.Screen name="ChatsScreen" options={{ title: "Chats" }} component={ChatsScreen} />
        <Stack.Screen name="MessagesScreen" options={{ title: "Messages" }} component={MessagesScreen} />
      </Stack.Navigator>
    )
  }

  const SettingsTab = () => {
    return (
      <Stack.Navigator initialRouteName="SettingsScreen">
        <Stack.Screen name="SettingsScreen" options={{ title: "Settings" }} component={SettingsScreen} />
        <Stack.Screen name="UpdateUserScreen" options={{ title: "Update User" }} component={UpdateUserScreen} />
      </Stack.Navigator>
    )
  }

  const navigator = (state) => {
    switch(state) {
      case loadingState:
        return (
          <Stack.Navigator initialRouteName="LoadingScreen">
            <Stack.Screen name="LoadingScreen" options={{ title: "Loading" }} component={LoadingScreen} />
          </Stack.Navigator>
        );
      case loggedOutState:
        return(
          <Stack.Navigator initialRouteName="LoginScreen">
            <Stack.Screen name="LoginScreen" options={{ title: "Login" }} component={LoginScreen} />
            <Stack.Screen name="LoginVerificationScreen" options={{ title: "Login Verification" }} component={LoginVerificationScreen} />
          </Stack.Navigator>
        );
      case loggedInState:
        return(
          <Tab.Navigator initialRouteName="ChatsTab">
            <Tab.Screen name="Chats" component={ChatsTab} />
            <Tab.Screen name="Settings" component={SettingsTab} />
          </Tab.Navigator>
        );
      case newUserState:
        return(
          <Stack.Navigator initialRouteName="NewUserWizard">
            <Stack.Screen name="NewUserWizardScreen" options={{ title: "New User" }} component={NewUserWizardScreen} />
          </Stack.Navigator>
        );

    }
  }

  return (
    <NavigationContainer>
      { navigator(state) }
    </NavigationContainer>
  );
}

