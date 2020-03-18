import React, {Component, useEffect, useState} from "react";
import {Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import ImagePicker from 'react-native-image-picker';
import UserAvatar from "./UserAvatar";
import Button from "./Button";

export default function UpdateUserForm({successCallback}) {
  const [name, setName] = useState("");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState({binary: null, extname: ""});
  const [error, setError] = React.useState("");
  const [photoUploaded, setPhotoUploaded] = React.useState(false);

  const handleSubmit = async (event) => {
    const {status, resp: {message}} = await window.controller.updateUser({name, avatar_binary: avatar.binary, avatar_extname: avatar.extname});

    if (status === "ok") {
      successCallback();
    } else {
      setError(message);
    }
  };

  const options = {
    title: 'Update Image',
    storageOptions: {
      skipBackup: true,
      path: 'images',
    },
  };

  const handleUpdatePhoto = async(event) => {
    ImagePicker.showImagePicker(options, (response) => {
      console.log('Response = ', response);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        // TODO resize before uploading to server
        // https://github.com/bamlab/react-native-image-resizer
        console.debug("Got an updated photo")
        if(response.type === "image/jpeg") {
          setAvatar({binary: response.data, extname: ".jpg"});
          setPhotoUploaded(true);
        } else if (response.type === "image/png") {
          setAvatar({binary: response.data, extname: ".png"});
          setPhotoUploaded(true);
        }
      }
    });
  };

  const handleNameChange = (newName) => {
    setName(newName);
  };

  const getData = async () => {
    console.debug("Getting data for update user form");
    const currentUser = await window.controller.currentUser();

    setUser(currentUser);
    setName(currentUser.attributes.name || "");
    setEmail(currentUser.attributes.email);
  }

  useEffect(() => {
    getData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Update Information</Text>
      <View style={styles.inputContainer}>
        { error !== "" ? <Text style={styles.rootError}>Error: {error}</Text> : null }
        <UserAvatar user={user} />
        <TextInput
          style={styles.textInput}
          placeholder="Email Address"
          maxLength={50}
          value={email}
          editable={false}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Name"
          maxLength={50}
          onBlur={Keyboard.dismiss}
          value={name}
          onChangeText={handleNameChange}
        />
        <Button light onPress={handleUpdatePhoto} title={ photoUploaded ? "Ready for submission" : "Update Photo" } disabled={ photoUploaded } />
        <Button primary onPress={handleSubmit} title={"Submit"} />
      </View>
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
    color: "#000000",
  },
  rootError: {
    color: "red",
    fontSize: 20,
  },
});
