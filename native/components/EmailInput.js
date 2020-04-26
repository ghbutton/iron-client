import React from 'react';
import {Input} from 'native-base';
import {Keyboard} from 'react-native';

export default function EmailInput(props) {
  return (
    <Input
      {...props}
      autoCapitalize="none"
      keyboardType="email-address"
      autoCorrect={false}
    />
  );
}
