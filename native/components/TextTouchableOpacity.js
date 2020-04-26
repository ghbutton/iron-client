import React from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {Text} from 'native-base';

export default function TextButton(props) {
  const {onPress, title, ...otherProps} = props;
  return (
    <TouchableOpacity
      style={styles.chatOutter}
      onPress={onPress}
      {...otherProps}
    >
      <Text style={styles.saveButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chatOutter: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    padding: 15,
    margin: 5,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 20,
    textAlign: 'center',
  },
});
