import React, {Component, useEffect} from 'react';
import {Button, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';

// const PLING = new Audio();
// PLING.src = "./static/sounds/pling.wav";
// PLING.volume = 0.75;

export default function MessagesScreen(props) {
  const [connectedUser, setConnectedUser] = React.useState(null);
  const [connectedUserId, setConnectedUserId] = React.useState(null);
  const [messageString, setMessageString] = React.useState("");
  const [userMessages, setUserMessages] = React.useState([]);
  const [downloads, setDownloads] = React.useState([]);
  const [now, setNow] = React.useState(new Date());
  const [userId, setUserId] = React.useState(null);
  const [deviceId, setDeviceId] = React.useState(null);

  const handleMessageChange = (newMessage) => {
    setMessageString(newMessage);
  }

  const handleSubmit = () => {
    console.log("SUBMIT");
  }

  useEffect(() => {
    async function init() {
      console.log(props.navigation);
      const newConnectedUserId = props.navigation.getParam("userId", null);
      console.log(newConnectedUserId);
;
      const newUserMessages = await window.controller.getMessages(newConnectedUserId);
      const newDownloads = await window.controller.getDownloads();
      const newUserId = window.controller.currentUserId();
      const newDeviceId = window.controller.currentDeviceId();

      setUserMessages(newUserMessages);
      setConnectedUserId(newConnectedUserId);
      setDownloads(newDownloads);
      setUserId(newUserId);
      setDeviceId(newDeviceId);
      window.controller.setLastRead(connectedUserId);

      //    window.addEventListener("new_message", this.handleNewMessage);
      //    window.addEventListener("new_download", this.handleNewDownload);

      // Api call, slow
      const newConnectedUser = await window.controller.getUserById(newConnectedUserId);
      if (newConnectedUser) {
        setConnectedUser(newConnectedUser);
      }
    }
    init();
  }, []);

    let date = null;
    let lastMessageFromMe = true;
    const messages = userMessages.map((message, index) => {
    let body = null;

    if (window.view.messageHasLink(message)) {
      body = <Text style={styles.saveButtonText}>Download - {window.view.messageDisplay(message)}</Text>
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

    return (
      <Text >{body}</Text>
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
    backgroundColor: '#F5FCFF',
  },
  header: {
    fontSize: 25,
    textAlign: 'center',
    margin: 10,
    fontWeight: 'bold'
  },
  inputContainer: {
    paddingTop: 15
  },
  textInput: {
    borderColor: '#CCCCCC',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    height: 50,
    fontSize: 25,
    paddingLeft: 20,
    paddingRight: 20
  },
  saveButton: {
    borderWidth: 1,
    borderColor: '#007BFF',
    backgroundColor: '#007BFF',
    padding: 15,
    margin: 5
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center'
  },
  rootError: {
    color: 'red',
    fontSize: 20,
  },
});
