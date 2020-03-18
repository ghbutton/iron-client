import React from "react";
import {Image, StyleSheet, View} from "react-native";

const logo = require("../static/images/icon.png");
const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  logo: {
    width: 200,
    height: 200,
  },
});


export default function LoadingScreen({navigation}) {
  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={logo}
      />
    </View>
  );
}
