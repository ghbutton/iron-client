import React, {Component, useEffect} from "react";
import {Keyboard, KeyboardAvoidingView, NativeEventEmitter, NativeModules, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View} from "react-native";
import {useHeaderHeight} from "@react-navigation/stack";
import {Input, Item, Form} from "native-base";
import Button from "../components/TextButton";

const {EventManager} = NativeModules;

// const PLING = new Audio();
// PLING.src = "./static/sounds/pling.wav";
// PLING.volume = 0.75;

// The bubbles that appear on the left or the right for the messages.
function MessageBubble(props) {
  // These spacers make the message bubble stay to the left or the right, depending on who is speaking, even if the message is multiple lines.
  const leftSpacer = props.direction === "left" ? null : <View style={{width: 70}}/>;
  const rightSpacer = props.direction === "left" ? <View style={{width: 70}}/> : null;

  const bubbleStyles = props.direction === "left" ? [styles.messageBubble, styles.messageBubbleLeft] : [styles.messageBubble, styles.messageBubbleRight];

  const bubbleTextStyle = props.direction === "left" ? styles.messageBubbleTextLeft : styles.messageBubbleTextRight;

  return (
    <View style={{justifyContent: "space-between", flexDirection: "row"}}>
      {leftSpacer}
      <View style={bubbleStyles}>
        <Text style={bubbleTextStyle}>
          {props.text}
        </Text>
      </View>
      {rightSpacer}
    </View>
  );
}

export default function MessagesScreen({navigation, route}) {
  const [connectedUser, setConnectedUser] = React.useState(null);
  const [messageString, setMessageString] = React.useState("");
  const [userMessages, setUserMessages] = React.useState([]);
  const [downloads, setDownloads] = React.useState([]);
  const [now, setNow] = React.useState(new Date());
  const [userId, setUserId] = React.useState(null);
  const [deviceId, setDeviceId] = React.useState(null);

  const headerHeight = useHeaderHeight();

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
    const style = fromMe ? {alignSelf: "flex-end"} : {};
    const direction = fromMe ? "right" : "left";

    return (
      <MessageBubble key={message.id} direction={direction} text={body}/>
    );
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : null} keyboardVerticalOffset={headerHeight}>
      {
      // TODO replace title with the recipient's name
      }
      <Text style={styles.header}>{connectedUser === null ? "" : `${window.view.userDisplay(connectedUser)}`}</Text>

      <TouchableWithoutFeedback>
        <ScrollView>
          {messages}
        </ScrollView>
      </TouchableWithoutFeedback>
      <View style={styles.bottom} >
        <View style={styles.inputContainer}>
          <Input placeholder="Message" onChangeText={handleMessageChange} onBlur={Keyboard.dismiss} value={messageString} />
          <Button title="Send" onPress={handleSubmit} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bottom: {
    marginBottom: 10,
  },
  container: {
    flex: 1,
  },
  header: {
    fontSize: 25,
    textAlign: "center",
    margin: 10,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    marginTop: 15,
    paddingTop: 5,
    borderTopWidth: 1,
    borderColor: "#CCCCCC",
    borderBottomWidth: 1,
    paddingLeft: 20,
    paddingRight: 20,
  },
  rootError: {
    color: "red",
    fontSize: 20,
  },

  // MessageBubble
  messageBubble: {
    borderRadius: 5,
    marginTop: 8,
    marginRight: 10,
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    flex: 1,
  },

  messageBubbleLeft: {
    backgroundColor: "#d5d8d4",
  },

  messageBubbleTextLeft: {
    color: "black",
  },

  messageBubbleRight: {
    backgroundColor: "#296394",
  },

  messageBubbleTextRight: {
    color: "white",
  },
});
