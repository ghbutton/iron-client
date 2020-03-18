import React from "react";
import { Button, Text } from 'native-base';

export default function CustomButton(props) {
  const {title} = props;

  return(
    <Button full {...props} >
      <Text>{title}</Text>
    </Button>
  )
}
