import React, {useState} from "react";
import {TouchableHighlight, View} from "react-native";
import {Form, Item, Input, Text} from "native-base";
import TextButton from "../components/TextButton";

export default function NewChatScreen({navigation}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [resultsReady, setResultsReady] = useState(false);
  const [searchedUser, setSearchedUser] = useState(null);
  const [isEmail, setIsEmail] = useState(false);

  const handleConnectToUser = async () => {
    const {status} = await window.controller.createNewConnection(searchedUser);

    if (status === "ok") {
      navigation.goBack();
    }
  };

  const handleInvite = async () => {
    navigation.navigate("InvitationScreen", {email: search});
  };

  const handleChange = async (searchString) => {
    setSearch(searchString);

    if (searchString.length > 3) {
      const users = await window.controller.connectedUsersSearch(searchString);
      setResults(users);
      setResultsReady(true);

      if (await window.controller.isEmail(searchString)) {
        const user = await window.controller.getUserByEmail(searchString);
        setIsEmail(true);

        setSearchedUser(user);
      } else {
        setSearchedUser(null);
        setIsEmail(false);
      }
    } else {
      setResults([]);
      setResultsReady(false);
      setSearchedUser(null);
      setIsEmail(false);
    }
  };

  let inviteUser = null;
  const resultBody = null;

  if (isEmail) {
    if (searchedUser) {
      inviteUser = (
        <View>
          <Text>Connect to user: </Text>
          <TextButton title={searchedUser.attributes.email} onPress={handleConnectToUser} />
        </View>);
    } else {
      inviteUser = (
        <View>
          <Text>Invite by email: </Text>
          <TextButton title={search} onPress={handleInvite} />
        </View>
      );
    }
  }

  if (results.length === 0) {
  } else {
    //    body = (<Text>Results!</Text>);
  }

  return (
    <View>
      <Form>
        <Item>
          <Input placeholder="Search by email or name" autoCapitalize="none" onChangeText={handleChange} />
        </Item>
      </Form>
      {inviteUser}
      {resultBody}
    </View>
  );
}
