import React, {useState} from 'react';
import {Keyboard, TouchableHighlight, View} from 'react-native';
import {Form, Item, Input, Label, Text} from 'native-base';

import EmailInput from '../components/EmailInput';
import TextButton from '../components/TextButton';
import TextTouchableOpacity from '../components/TextTouchableOpacity';

export default function NewChatScreen({navigation}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searchedUser, setSearchedUser] = useState(null);
  const [isEmail, setIsEmail] = useState(false);

  const handleConnectToUser = async () => {
    const {status} = await window.controller.createNewConnection(searchedUser);

    if (status === 'ok') {
      navigation.goBack();
    }
  };

  const handleInvite = async () => {
    navigation.navigate('InvitationScreen', {email: search});
  };

  const handleUserChat = (user) => {
      navigation.navigate('MessagesScreen', {userId: user.id});
  }

  const handleChange = async searchString => {
    setSearch(searchString);

    if (searchString.length > 3) {
      const users = await window.controller.connectedUsersSearch(searchString);
      setResults(users);

      if (await window.controller.isEmail(searchString)) {
        const user = await window.controller.getUserByEmail(searchString);
        setIsEmail(true);

        setSearchedUser(user);
      } else {
        setSearchedUser(null);
        setIsEmail(false);
      }
    } else {
      setResults([]);
      setSearchedUser(null);
      setIsEmail(false);
    }
  };

  let inviteUser = null;
  let resultsBody = null;

  if (isEmail) {
    if (searchedUser) {
      inviteUser = (
        <View>
          <Text>Connect to user: </Text>
          <TextButton
            title={searchedUser.attributes.email}
            onPress={handleConnectToUser}
          />
        </View>
      );
    } else {
      inviteUser = (
        <View>
          <Text>Invite by email: </Text>
          <TextButton title={search} onPress={handleInvite} />
        </View>
      );
    }
  }

  if (results.length > 0) {
    resultsBody = results.map((user) => {
      return (<TextTouchableOpacity key={user.id} title={window.view.userDisplay(user)} onPress={() => handleUserChat(user)} />);
    });
  }

  return (
    <View>
      <Form>
        <Item>
          <Label>Search</Label>
          <EmailInput
            placeholder="Email or name"
            onBlur={Keyboard.dismiss}
            autoFocus
            onChangeText={handleChange}
          />
        </Item>
      </Form>
      {inviteUser}
      {resultsBody}
    </View>
  );
}
