import React, {Component, useEffect} from "react";
import {Button, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {NativeEventEmitter, NativeModules} from "react-native";
const {EventManager} = NativeModules;

// const PLING = new Audio();
// PLING.src = "./static/sounds/pling.wav";
// PLING.volume = 0.75;

export default function MessagesScreen({navigation, route}) {
  const [connectedUser, setConnectedUser] = React.useState(null);
  const [messageString, setMessageString] = React.useState("");
  const [userMessages, setUserMessages] = React.useState([]);
  const [downloads, setDownloads] = React.useState([]);
  const [now, setNow] = React.useState(new Date());
  const [userId, setUserId] = React.useState(null);
  const [deviceId, setDeviceId] = React.useState(null);

  const connectedUserIdRef = React.useRef(null);

  const handleMessageChange = (newMessage) => {
    setMessageString(newMessage);
  };

  const handleSubmit = async () => {
    if (messageString !== "") {
      await window.controller.sendMessage(messageString, connectedUserIdRef.current);
      setMessageString("");
    }
  };

  const handleNewMessage = async () => {
    const newUserMessages = await window.controller.getMessages(connectedUserIdRef.current);

    setUserMessages(newUserMessages);
  };

  const init = async () => {
    const newUserMessages = await window.controller.getMessages(connectedUserIdRef.current);
    const newDownloads = await window.controller.getDownloads();
    const newUserId = window.controller.currentUserId();
    const newDeviceId = window.controller.currentDeviceId();

    setUserId(newUserId);

    setUserMessages(newUserMessages);
    setDownloads(newDownloads);
    setDeviceId(newDeviceId);
    window.controller.setLastRead(connectedUserIdRef.current);

    // Api call, slow
    const newConnectedUser = await window.controller.getUserById(connectedUserIdRef.current);
    if (newConnectedUser) {
      setConnectedUser(newConnectedUser);
    }
  };

  useEffect(() => {
    connectedUserIdRef.current = route.params.userId;

    init();

    // TODO use a constants file for the callback names
    const eventEmitter = new NativeEventEmitter(EventManager);
    const listenerNewMessage = eventEmitter.addListener("new_message", handleNewMessage);

    return function cleanup() {
      listenerNewMessage.remove();
    };
  }, []);

  let date = null;
  let lastMessageFromMe = true;
  const messages = userMessages.map((message, index) => {
    let body = null;

    if (window.view.messageHasLink(message)) {
      body = <Text style={styles.saveButtonText}>Download - {window.view.messageDisplay(message)}</Text>;
    } else {
      body = window.view.messageDisplay(message);
    }

    const timestamp = window.view.messageTimestamp(message);
    const timestampDisplay = window.view.messageDisplayTimestamp(timestamp);

    const fromMe = window.view.currentUsersMessage(message, userId);
    const messageState = window.view.messageState(message, userId);
    const fromMeSpace = (fromMe && !lastMessageFromMe) || (!fromMe && lastMessageFromMe);

    if (fromMeSpace) {
      lastMessageFromMe = fromMe;
    }

    let dateDisplay = null;

    // TODO put this in view logic
    if (timestamp === null) {
    } else if (date === null || timestamp.getFullYear() !== date.getFullYear() || timestamp.getMonth() !== date.getMonth() || timestamp.getDate() !== date.getDate()) {
      date = timestamp;
      dateDisplay = window.view.timestampBreakDisplay(date);
    }

    // TODO handle unsent file error
    const style = fromMe ? {alignSelf: 'flex-end'} : {}

    return (
      <Text key={message.id} style={style}>{body}</Text>
    );
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{connectedUser === null ? "" : `${window.view.userDisplay(connectedUser)}`}</Text>

      <View>
        {messages}
      </View>
      <TextInput
        style={styles.textInput}
        placeholder="Message"
        maxLength={50}
        onBlur={Keyboard.dismiss}
        value={messageString}
        onChangeText={handleMessageChange}
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
        <Text style={styles.saveButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 45,
    backgroundColor: "#F5FCFF",
  },
  header: {
    fontSize: 25,
    textAlign: "center",
    margin: 10,
    fontWeight: "bold",
  },
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
