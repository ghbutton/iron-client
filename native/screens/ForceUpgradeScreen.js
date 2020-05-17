import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {H2} from 'native-base';

export default function ForceUpgradeScreen({navigation}) {
  const styles = StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    },
  });
  return (
    <View style={styles.container}>
      <H2>Force upgrade</H2>
      <Text>There is an important security or API update, please go to the iOS store and update your client</Text>
    </View>
  );
}
