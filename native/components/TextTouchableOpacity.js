import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Badge, Icon, Text} from 'native-base';

export default function TextTouchableOpacity({badge, badgeProps, onPress, title, ...otherProps}) {
  return (
    <TouchableOpacity
      style={styles.chatOutter}
      onPress={onPress}
      {...otherProps}>
      <View style={styles.centerView}>
        <Text style={styles.text}>{title}</Text>{badge && (<Badge style={styles.badge} {...badgeProps}><Text>{badge}</Text></Badge>)}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    marginLeft: 5,
  },
  chatOutter: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    padding: 15,
    margin: 5,
  },
  text: {
    color: '#000000',
    fontSize: 20,
  },
  centerView: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
  }
});
