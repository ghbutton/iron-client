import React, {Component, useEffect} from "react";
import {Button, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";

export default function LoginScreen({navigation}) {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const handleEmailChange = (newEmail) => {
    setEmail(newEmail);
  };

  const handleSubmit = async () => {
    const {status, resp} = await window.controller.sendVerificationCode(email);
    if (status === "ok") {
      navigation.navigate("LoginVerificationScreen", {email: email});
    } else {
      setError(resp.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Login</Text>
      <View style={styles.inputContainer}>
        { error !== "" ? <Text style={styles.rootError}>Error: {error}</Text> : null }
        <TextInput
          style={styles.textInput}
          placeholder="Email Address"
          maxLength={50}
          onBlur={Keyboard.dismiss}
          value={email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize = "none"
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