import React from "react";
import {Image, View} from "react-native";

export default function UserAvatar({user}) {
  return (user && (
    <View>
      { user.attributes.avatar_extname === ".jpg" && (
        <Image style={{width: 200, height: 200}} source={{uri: `data:image/jpg;base64, ${user.attributes.avatar_binary}`}} />
      )}
      { user.attributes.avatar_extname === ".png" && (
        <Image style={{width: 200, height: 200}} source={{uri: `data:image/png;base64, ${user.attributes.avatar_binary}`}} />
      )}
    </View>
  ));
}
