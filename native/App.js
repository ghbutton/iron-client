import React, {useEffect} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NativeEventEmitter, NativeModules} from 'react-native';
const { EventManager } = NativeModules;

import ChatsScreen from './components/ChatsScreen.js';
import LoadingScreen from './components/LoadingScreen.js';
import LoginScreen from './components/LoginScreen.js';
import LoginVerificationScreen from './components/LoginVerificationScreen.js';
import MessagesScreen from './components/MessagesScreen.js';

const Stack = createStackNavigator();

export default function App() {
  const [state, setState] = React.useState("loading");

  const loadedNoUser = (event) => {
    setState("logged_out");
  };

  const loggedIn = (event) => {
    setState("logged_in");
  };

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(EventManager);
    const listenerNoUser = eventEmitter.addListener('loaded_no_user', loadedNoUser);
    const listenerLoggedIn = eventEmitter.addListener('logged_in', loggedIn);
    const listenerWithUser = eventEmitter.addListener('loaded_with_user', loggedIn);

    return function cleanup() {
      listenerNoUser.remove();
      listenerLoggedIn.remove();
      listenerWithUser.remove();
    };
  });

  const navigator = (state) => {
    switch(state) {
      case "loading":
        return (
          <Stack.Navigator initialRouteName="LoadingScreen">
            <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
          </Stack.Navigator>
        );
      case "logged_out":
        return(
          <Stack.Navigator initialRouteName="LoginScreen">
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="LoginVerificationScreen" component={LoginVerificationScreen} />
          </Stack.Navigator>
        );
      case "logged_in":
        return(
          <Stack.Navigator initialRouteName="ChatsScreen">
            <Stack.Screen name="ChatsScreen" component={ChatsScreen} />
            <Stack.Screen name="MessagesScreen" component={MessagesScreen} />
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

