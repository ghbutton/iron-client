import React, {Component, useEffect} from 'react';
import {Keyboard, StyleSheet, Text, View} from 'react-native';
import {H1, Form, Item, Input, Label} from 'native-base';
import TextButton from '../components/TextButton';
import {Typography} from '../styles';

export default function LoginVerificationScreen({navigation, route}) {
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');

  const handleCodeChange = newCode => {
    setCode(newCode);
  };

  const handleSubmit = async () => {
    const {status, resp} = await window.controller.login(email, code);

    if (status === 'ok') {
      window.controller.reset();
    } else {
      setError(resp.message);
    }
  };

  useEffect(() => {
    const navEmail = route.params.email;
    setEmail(navEmail);
  }, [route.params.email]);

  return (
    <View>
      <H1>Email Verification</H1>
      <Form>
        {error !== '' ? (
          <Text style={Typography.error}>Error: {error}</Text>
        ) : null}
        <Item>
          <Label>Email</Label>
          <Input value={email} editable={false} />
        </Item>
        <Item>
          <Label>Verification code</Label>
          {/* verification codes are full capitalized */}
          <Input
            onChangeText={handleCodeChange}
            value={code}
            autoCapitalize="characters"
            onBlur={Keyboard.dismiss}
            autoFocus
            autoCorrect={false}
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
