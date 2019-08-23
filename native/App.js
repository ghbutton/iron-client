/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component, useEffect} from 'react';
import {Button, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import { Navigation } from 'react-native-navigation';

Navigation.registerComponent(`LoginScreen`, () => LoginScreen);

Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setRoot({
    root: {
      component: {
        name: 'LoginScreen'
      }
    }
  });
});

export default function App() {
}
