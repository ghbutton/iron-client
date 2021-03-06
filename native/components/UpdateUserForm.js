import React, {useEffect, useState} from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import {Container, Header, Content, Form, Item, Input} from 'native-base';

import UserAvatar from './UserAvatar';
import TextButton from './TextButton';

export default function UpdateUserForm({successCallback}) {
  const [name, setName] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState({binary: null, extname: ''});
  const [error, setError] = React.useState('');
  const [photoUploaded, setPhotoUploaded] = React.useState(false);

  const handleSubmit = async event => {
    const {
      status,
      resp: {message},
    } = await window.controller.updateUser({
      name,
      avatar_binary: avatar.binary,
      avatar_extname: avatar.extname,
    });

    if (status === 'ok') {
      successCallback();
    } else {
      setError(message);
    }
  };

  const options = {
    title: 'Update Image',
  };

  const handleImage = async (event) => {
    ImagePicker.showImagePicker(options, async (response) => {
      console.log('Response = ', response);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        let format = null;
        if (response.type === 'image/png') {
          format = "PNG";
        } else if (response.type === 'image/jpeg') {
          format = "JPEG";
        } else {
          // TODO Show error to user
        }

        // Server limit is 300x300 so we will set 600x600 and the server can downsize the rest
        const resizedImage = await ImageResizer.createResizedImage(response.uri, 600, 600, format, 100);
        const {status, bytes, extname} =  await window.controller.readAvatar(resizedImage.uri);
        setAvatar({binary: bytes, extname});
        setPhotoUploaded(true);
      }
    });
  };

  const handleNameChange = newName => {
    setName(newName);
  };

  const getData = async () => {
    console.debug('Getting data for update user form');
    const currentUser = await window.controller.currentUser();

    setUser(currentUser);
    setName(currentUser.attributes.name || '');
    setEmail(currentUser.attributes.email);
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Update Information</Text>
      <Form>
        {error !== '' ? (
          <Text style={styles.rootError}>Error: {error}</Text>
        ) : null}
        <UserAvatar user={user} />
        <Item>
          <Input placeholder="Email Address" disabled={true} value={email} />
        </Item>
        <Item last>
          <Input
            placeholder="Name"
            value={name}
            onChangeText={handleNameChange}
          />
        </Item>
        <TextButton
          light
          onPress={handleImage}
          title={photoUploaded ? 'Ready for submission' : 'Update Photo'}
          disabled={photoUploaded}
        />
        <TextButton primary onPress={handleSubmit} title={'Submit'} />
      </Form>
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
    fontWeight: 'bold',
  },
  inputContainer: {
    paddingTop: 15,
  },
  textInput: {
    borderColor: '#CCCCCC',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    height: 50,
    fontSize: 25,
    paddingLeft: 20,
    paddingRight: 20,
    color: '#000000',
  },
  rootError: {
    color: 'red',
    fontSize: 20,
  },
});
