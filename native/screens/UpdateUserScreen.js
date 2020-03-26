import React from "react";
import UpdateUserForm from "../components/UpdateUserForm";

export default function UpdateUserScreen({navigation}) {
  const successCallback = () => {
    console.debug("Update user screen success");
    navigation.goBack();
  };

  return (
    <UpdateUserForm successCallback={successCallback} />
  );
}
