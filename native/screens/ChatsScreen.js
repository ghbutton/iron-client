import React, {Component, useCallback, useEffect, useState} from 'react';
import {
  FlatList,
  Keyboard,
  NativeEventEmitter,
  NativeModules,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';
import TextButton from '../components/TextButton';
import TextTouchableOpacity from '../components/TextTouchableOpacity';
import {useFocusEffect} from '@react-navigation/native';
import PushNotificationPrompt from '../components/PushNotificationPrompt';

const {EventManager} = NativeModules;

export default function ChatsScreen({navigation}) {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState({});
  const [userDisplay, setUserDisplay] = useState({});
  const [connectionsLoaded, setConnectionsLoaded] = useState(false);

  const handleNewMessage = () => {
    console.log('NEW MESSAGE');
    const [newHasUnreadMessages, newUserDisplay] = userInfo(connectedUsers);
    setUserDisplay(newUserDisplay);
    setHasUnreadMessages(newHasUnreadMessages);
  };

  const handleConnectedUserPress = userId => {
    navigation.navigate('MessagesScreen', {userId: userId});
  };

  const handleNewChat = () => {
    navigation.navigate('NewChatScreen');
  };

  const userInfo = (newConnectedUsers) => {
    const [newHasUnreadMessages, newUserDisplay] = [{}, {}];
    for (let i = 0; i < newConnectedUsers.length; i++) {
      const user = newConnectedUsers[i];
      newUserDisplay[user.id] = window.view.userDisplay(user);
      newHasUnreadMessages[user.id] = window.controller.hasUnreadMessages(
        user.id,
      );
    }
    return [newHasUnreadMessages, newUserDisplay];
  }

  const loadData = async function() {
    console.debug('Loading chats screen data');

    const newConnectedUsers = await window.controller.getConnectedUsers();
    const [newHasUnreadMessages, newUserDisplay] = userInfo(newConnectedUsers);

    setConnectedUsers(newConnectedUsers);
    setUserDisplay(newUserDisplay);
    setHasUnreadMessages(newHasUnreadMessages);
    setConnectionsLoaded(true);
  };

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(EventManager);
    const listenerNewMessage = eventEmitter.addListener(
      'new_message',
      handleNewMessage,
    );

    return function cleanup() {
      listenerNewMessage.remove();
    };
  });
  useFocusEffect(
    // Nesting usecallback here to prevent an infinite loop
    // See: https://reactnavigation.org/docs/use-focus-effect/#how-is-usefocuseffect-different-from-adding-a-listener-for-focus-event
    useCallback(() => {
      loadData();
    }, []),
  );

  return (
    <View>
      <PushNotificationPrompt />
      <TextButton title="+" onPress={handleNewChat} right />
      {connectionsLoaded && connectedUsers.length === 0 ? (
        <Text>No chats.</Text>
      ) : (
        <FlatList
          data={connectedUsers}
          extraData={hasUnreadMessages}
          renderItem={({item: user}) => (
            <TextTouchableOpacity
              onPress={() => handleConnectedUserPress(user.id)}
              title={userDisplay[user.id]}
              badge={hasUnreadMessages[user.id] ? "!" : null}
              badgeProps={{primary: true}}
            />
          )}
        />
      )}
    </View>
  );
}
