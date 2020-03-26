import React, {useState} from "react";
import {View} from "react-native";
import {Form, Item, Input, Label} from "native-base";

import Button from "../components/TextButton";

export default function InvitationScreen({navigation, route}) {
  const email = route.params.email;
  const [name, setName] = useState("");

  const handleNameChange = async (newName) => {
    setName(newName);
  };

  const handleSubmit = async () => {
    const {status} = await window.controller.createNewInvitation(name, email);

    if (status === "ok") {
      navigation.goBack();
    }
  };

  return (
    <View>
      <Form>
        <Item>
          <Label>Name</Label>
          <Input placeholder="Fill in" onChangeText={handleNameChange} autoCapitalize="words" />
        </Item>
        <Item>
          <Label>Email</Label>
          <Input value={email} disabled />
        </Item>
        <Button title="Submit" onPress={handleSubmit} full />
      </Form>
    </View>
  );
}
