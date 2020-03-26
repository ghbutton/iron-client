
import React, {Component, useCallback, useEffect, useState} from "react";
import {AppState, FlatList, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import Button from "../components/TextButton";
import {useFocusEffect} from "@react-navigation/native";

export default function ChatsScreen({navigation}) {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState({});
  const [userDisplay, setUserDisplay] = useState({});
  const [connectionsLoaded, setConnectionsLoaded] = useState(false);

  const handleNewMessage = () => {
    console.log("NEW MESSAGE");
  };

  const handleConnectedUserPress = (userId) => {
    navigation.navigate("MessagesScreen", {userId: userId});
  };

  const handleNewChat = () => {
    navigation.navigate("NewChatScreen");
  };

  const loadData = async function() {
    console.debug("Loading chats screen data");

    const newConnectedUsers = await window.controller.getConnectedUsers();
    const [newHasUnreadMessages, newUserDisplay] = [{}, {}];
    for (let i = 0; i < newConnectedUsers.length; i++) {
      const user = newConnectedUsers[i];
      newUserDisplay[user.id] = window.view.userDisplay(user);
      newHasUnreadMessages[user.id] = window.controller.hasUnreadMessages(user.id);
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
      <Button title="+" onPress={handleNewChat} right />
      { (connectionsLoaded && connectedUsers.length === 0) ?
        <Text>No chats.</Text> :
            <FlatList
              data={connectedUsers}
              renderItem={ ({item: user}) =>
                <TouchableOpacity style={styles.saveButton} onPress={() => handleConnectedUserPress(user.id)} >
                  <Text style={styles.saveButtonText}>{userDisplay[user.id]}</Text>
                </TouchableOpacity>
              }
            />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    paddingTop: 15,
  },
  textInput: {
    borderColor: "#CCCCCC",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    height: 50,
    fontSize: 25,
    paddingLeft: 20,
    paddingRight: 20,
  },
  saveButton: {
    borderWidth: 1,
    borderColor: "#007BFF",
    backgroundColor: "#007BFF",
    padding: 15,
    margin: 5,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    textAlign: "center",
  },
  rootError: {
    color: "red",
    fontSize: 20,
  },
});
