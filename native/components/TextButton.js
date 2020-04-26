import React from 'react';
import {Button, Text} from 'native-base';

export default function TextButton(props) {
  const {title, right, full} = props;

  let newProps = {};
  if (right) {
    newProps = {style: {alignSelf: 'flex-end'}};
  } else if (full) {
    newProps = {full: 1};
  } else {
    newProps = {style: {alignSelf: 'flex-start'}};
  }

  // This style prevents the button from being full width
  // style={{alignSelf: 'flex-start'}}

  return (
    <Button {...newProps} {...props}>
      <Text>{title}</Text>
    </Button>
  );
}
