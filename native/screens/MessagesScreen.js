import React, {Component, useEffect} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  NativeEventEmitter,
  NativeModules,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useHeaderHeight} from '@react-navigation/stack';
import {Button, Icon, Input, Item, Form} from 'native-base';
import TextButton from '../components/TextButton';
import ImagePicker from 'react-native-image-picker';

const {EventManager} = NativeModules;

// const PLING = new Audio();
// PLING.src = "./static/sounds/pling.wav";
// PLING.volume = 0.75;

// The bubbles that appear on the left or the right for the messages.
function MessageBubble({direction, text, onPress}) {
  // These spacers make the message bubble stay to the left or the right, depending on who is speaking, even if the message is multiple lines.
  const leftSpacer = direction === 'left' ? null : <View style={{width: 70}} />;
  const rightSpacer =
    direction === 'left' ? <View style={{width: 70}} /> : null;

  const bubbleStyles =
    direction === 'left'
      ? [styles.messageBubble, styles.messageBubbleLeft]
      : [styles.messageBubble, styles.messageBubbleRight];

  const bubbleTextStyle =
    direction === 'left'
      ? styles.messageBubbleTextLeft
      : styles.messageBubbleTextRight;

  const body = onPress ? (
    <TouchableOpacity onPress={onPress}>
      <Text style={bubbleTextStyle}>{text}</Text>
    </TouchableOpacity>
  ) : (
    <Text style={bubbleTextStyle}>{text}</Text>
  );

  return (
    <View style={{justifyContent: 'space-between', flexDirection: 'row'}}>
      {leftSpacer}
      <View style={bubbleStyles}>{body}</View>
      {rightSpacer}
    </View>
  );
}

export default function MessagesScreen({navigation, route}) {
  const [connectedUser, setConnectedUser] = React.useState(null);
  const [messageString, setMessageString] = React.useState('');
  const [userMessages, setUserMessages] = React.useState([]);
  const [downloads, setDownloads] = React.useState([]);
  const [now, setNow] = React.useState(new Date());
  const [currentUserId, setCurrentUserId] = React.useState(null);
  const [deviceId, setDeviceId] = React.useState(null);

  const headerHeight = useHeaderHeight();

  const connectedUserIdRef = React.useRef(null);

  const handleMessageChange = newMessage => {
    setMessageString(newMessage);
  };

  const options = {
    // dont read data here, will read data later
    noData: true,
    storageOptions: {
      skipBackup: true,
      path: 'images',
    },
    title: 'Send Image',
  };

  const handleImage = async event => {
    ImagePicker.showImagePicker(options, async response => {
      console.log('Response = ', response);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        console.debug('Got an updated photo');
        console.log(response);
        if (response.type === 'image/jpeg' || response.type === 'image/png') {
          const results = await window.controller.uploadFiles(
            connectedUserIdRef.current,
            [response.uri],
          );
        } else {
          // Show some kind of error
        }
      }
    });
  };

  const handleSubmit = async () => {
    if (messageString !== '') {
      await window.controller.sendMessage(
        messageString,
        connectedUserIdRef.current,
      );
      setMessageString('');
    }
  };

  const handleDownload = message => {
    return async function() {
      window.controller.downloadFile(message);
    };
  };

  const handleNewMessage = async () => {
    const newUserMessages = await window.controller.getMessages(
      connectedUserIdRef.current,
    );

    setUserMessages(newUserMessages);
  };

  const init = async () => {
    const newUserMessages = await window.controller.getMessages(
      connectedUserIdRef.current,
    );
    const newDownloads = await window.controller.getDownloads();
    const currentUserId = window.controller.currentUserId();
    const newDeviceId = window.controller.currentDeviceId();

    setCurrentUserId(currentUserId);

    setUserMessages(newUserMessages);
    setDownloads(newDownloads);
    setDeviceId(newDeviceId);
    window.controller.setLastRead(connectedUserIdRef.current);

    // Api call, slow
    const newConnectedUser = await window.controller.getUserById(
      connectedUserIdRef.current,
    );
    if (newConnectedUser) {
      setConnectedUser(newConnectedUser);
    }
  };

  useEffect(() => {
    connectedUserIdRef.current = route.params.userId;

    init();

    // TODO use a constants file for the callback names
    const eventEmitter = new NativeEventEmitter(EventManager);
    const listenerNewMessage = eventEmitter.addListener(
      'new_message',
      handleNewMessage,
    );

    return function cleanup() {
      listenerNewMessage.remove();
    };
  }, [route.params.userId]);

  let date = null;
  let lastMessageFromMe = true;
  const messages = userMessages.map((message, index) => {
    let body = null;
    let hasLink = window.view.messageHasLink(message);

    if (hasLink) {
      body = `Download - ${window.view.messageDisplay(message)}`;
    } else {
      body = window.view.messageDisplay(message);
    }

    const timestamp = window.view.messageTimestamp(message);
    const timestampDisplay = window.view.messageDisplayTimestamp(timestamp);

    const fromMe = window.view.currentUsersMessage(message, currentUserId);
    const messageState = window.view.messageState(message, currentUserId);
    const fromMeSpace =
      (fromMe && !lastMessageFromMe) || (!fromMe && lastMessageFromMe);

    if (fromMeSpace) {
      lastMessageFromMe = fromMe;
    }

    let dateDisplay = null;

    // TODO put this in view logic
    if (timestamp === null) {
    } else if (
      date === null ||
      timestamp.getFullYear() !== date.getFullYear() ||
      timestamp.getMonth() !== date.getMonth() ||
      timestamp.getDate() !== date.getDate()
    ) {
      date = timestamp;
      dateDisplay = window.view.timestampBreakDisplay(date);
    }

    // TODO handle unsent file error
    const style = fromMe ? {alignSelf: 'flex-end'} : {};
    const direction = fromMe ? 'right' : 'left';

    return (
      <MessageBubble
        key={message.id}
        direction={direction}
        text={body}
        onPress={hasLink && handleDownload(message)}
      />
    );
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={headerHeight}>
      {
        // TODO replace title with the recipient's name
      }
      <Text style={styles.header}>
        {connectedUser === null
          ? ''
          : `${window.view.userDisplay(connectedUser)}`}
      </Text>

      <TouchableWithoutFeedback>
        <ScrollView>{messages}</ScrollView>
      </TouchableWithoutFeedback>
      <View style={styles.bottom}>
        <View style={styles.inputContainer}>
          <Input
            placeholder="Message"
            onChangeText={handleMessageChange}
            onBlur={Keyboard.dismiss}
            value={messageString}
          />
          <Button onPress={handleImage}>
            <Icon name="image" />
          </Button>
          <Button onPress={handleSubmit}>
            <Icon name="send" />
          </Button>
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
    textAlign: 'center',
    margin: 10,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    marginTop: 15,
    paddingTop: 5,
    borderTopWidth: 1,
    borderColor: '#CCCCCC',
    borderBottomWidth: 1,
    paddingLeft: 20,
    paddingRight: 20,
  },
  rootError: {
    color: 'red',
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
    flexDirection: 'row',
    flex: 1,
  },

  messageBubbleLeft: {
    backgroundColor: '#d5d8d4',
  },

  messageBubbleTextLeft: {
    color: 'black',
  },

  messageBubbleRight: {
    backgroundColor: '#296394',
  },

  messageBubbleTextRight: {
    color: 'white',
  },
});
