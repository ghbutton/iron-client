import React, {Component, useCallback, useEffect, useState} from 'react';
import {
  AppState,
  FlatList,
  Keyboard,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';
import TextButton from '../components/TextButton';
import TextTouchableOpacity from '../components/TextTouchableOpacity';
import {useFocusEffect} from '@react-navigation/native';
import PushNotificationPrompt from '../components/PushNotificationPrompt';

export default function ChatsScreen({navigation}) {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState({});
  const [userDisplay, setUserDisplay] = useState({});
  const [connectionsLoaded, setConnectionsLoaded] = useState(false);

  const handleNewMessage = () => {
    console.log('NEW MESSAGE');
  };

  const handleConnectedUserPress = (userId) => {
    navigation.navigate('MessagesScreen', {userId: userId});
  };

  const handleNewChat = () => {
    navigation.navigate('NewChatScreen');
  };

  const loadData = async function() {
    console.debug('Loading chats screen data');

    const newConnectedUsers = await window.controller.getConnectedUsers();
    const [newHasUnreadMessages, newUserDisplay] = [{}, {}];
    for (let i = 0; i < newConnectedUsers.length; i++) {
      const user = newConnectedUsers[i];
      newUserDisplay[user.id] = window.view.userDisplay(user);
      newHasUnreadMessages[user.id] = window.controller.hasUnreadMessages(
        user.id,
      );
    }

    setUserDisplay(newUserDisplay);
    setConnectedUsers(newConnectedUsers);
    setHasUnreadMessages(newHasUnreadMessages);
    setConnectionsLoaded(true);
  };

  useFocusEffect(
    // Nesting usecallback here to prevent an infinite loop
    // See: https://reactnavigation.org/docs/use-focus-effect/#how-is-usefocuseffect-different-from-adding-a-listener-for-focus-event
    useCallback(() => {
      loadData();
    }, []),
  );

  useEffect(() => {
    // AppState.addEventListener("new_message", handleNewMessage);

    return function cleanup() {
      // you need to unbind the same listener that was binded.
      //      AppState.removeEventListener("new_message", handleNewMessage);
    };
  }, []);

  return (
    <View>
      <PushNotificationPrompt/>
      <TextButton title="+" onPress={handleNewChat} right />
      {connectionsLoaded && connectedUsers.length === 0 ? (
        <Text>No chats.</Text>
      ) : (
        <FlatList
          data={connectedUsers}
          renderItem={({item: user}) => (
            <TextTouchableOpacity onPress={() => handleConnectedUserPress(user.id)} title={userDisplay[user.id]} />
          )}
        />
      )}
    </View>
  );
}

