import React, {Component, useEffect, useState} from "react";
import {Button, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";

export default function NewUserWizardScreen() {
  const [name, setName] = useState("");
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState({binary: null, extname: ""});
  const [error, setError] = React.useState("");

  const handleSubmit = async (event) => {
    const {status, resp: {message}} = await window.controller.updateUser({name, avatar_binary: avatar.binary, avatar_extname: avatar.extname});

    if (status === "ok") {
      // Refire the logged_in_with_user event to navigate to the chats page
      // Not sure if this is the best way to do this but seems ok for now
      window.controller.emitLoggedIn();
    } else {
      setError(message);
    }
  };

  const uploadImage = async () => {
    const filename = await window.controller.selectFile();
    if (filename !== null) {
      const {status, bytes, extname} = await window.controller.readAvatar(filename);
      if (status === "ok") {
        setAvatar({binary: bytes, extname: extname});
      } else {
        // TODO display error message
      }
    }
  };

  const handleNameChange = (newName) => {
    setName(newName);
  };

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await window.controller.currentUser();

      setUser(currentUser);
      setName(currentUser.attributes.name || "");
      setEmail(currentUser.attributes.email);
    };
    getUser();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Update Information</Text>
      <View style={styles.inputContainer}>
        { error !== "" ? <Text style={styles.rootError}>Error: {error}</Text> : null }
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
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} >
          <Text style={styles.saveButtonText}>Submit</Text>
        </TouchableOpacity>
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
