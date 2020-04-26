import React, {Component, useEffect} from 'react';
import {Keyboard, StyleSheet, Text, View} from 'react-native';
import {H1, Form, Item, Label} from 'native-base';

import EmailInput from '../components/EmailInput';
import TextButton from '../components/TextButton';
import {Typography} from '../styles';

export default function LoginScreen({navigation}) {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const handleEmailChange = newEmail => {
    setEmail(newEmail);
  };

  const handleSubmit = async () => {
    const {status, resp} = await window.controller.sendVerificationCode(email);
    if (status === 'ok') {
      navigation.navigate('LoginVerificationScreen', {email: email});
    } else {
      setError(resp.message);
    }
  };

  return (
    <View>
      <H1>Login</H1>
      <Form>
        {error !== '' ? (
          <Text style={Typography.error}>Error: {error}</Text>
        ) : null}
        <Item>
          <Label>Email</Label>
          <EmailInput
            onChangeText={handleEmailChange}
            onBlur={Keyboard.dismiss}
            value={email}
            autoFocus
          />
        </Item>
        <TextButton
          primary
          onPress={handleSubmit}
          title={'Submit'}
          full
          style={styles.marginTop}
        />
      </Form>
    </View>
  );
}

const styles = StyleSheet.create({
  marginTop: {
    marginTop: 15,
  },
});
