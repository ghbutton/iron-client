import React, {useEffect} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NativeEventEmitter, NativeModules} from 'react-native';
const { EventManager } = NativeModules;

import ChatsScreen from './screens/ChatsScreen.js';
import LoadingScreen from './screens/LoadingScreen.js';
import LoginScreen from './screens/LoginScreen.js';
import LoginVerificationScreen from './screens/LoginVerificationScreen.js';
import MessagesScreen from './screens/MessagesScreen.js';

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
    const listenerWithUser = eventEmitter.addListener('loaded_with_user', loggedIn);

    return function cleanup() {
      listenerNoUser.remove();
      listenerWithUser.remove();
    };
  });

  const navigator = (state) => {
    switch(state) {
      case "loading":
        return (
          <Stack.Navigator initialRouteName="LoadingScreen">
            <Stack.Screen name="LoadingScreen" options={{ title: "Loading" }} component={LoadingScreen} />
          </Stack.Navigator>
        );
      case "logged_out":
        return(
          <Stack.Navigator initialRouteName="LoginScreen">
            <Stack.Screen name="LoginScreen" options={{ title: "Login" }} component={LoginScreen} />
            <Stack.Screen name="LoginVerificationScreen" options={{ title: "Login Verification" }} component={LoginVerificationScreen} />
          </Stack.Navigator>
        );
      case "logged_in":
        return(
          <Stack.Navigator initialRouteName="ChatsScreen">
            <Stack.Screen name="ChatsScreen" options={{ title: "Chats" }} component={ChatsScreen} />
            <Stack.Screen name="MessagesScreen" options={{ title: "Messages" }} component={MessagesScreen} />
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

