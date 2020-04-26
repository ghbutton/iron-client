import React from 'react';
import {Image, StyleSheet, View} from 'react-native';

const logo = require('../static/images/icon.png');
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  logo: {
    height: 200,
    width: 200,
    resizeMode: 'contain',
  },
});

export default function LoadingScreen({navigation}) {
  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={logo} />
    </View>
  );
}
