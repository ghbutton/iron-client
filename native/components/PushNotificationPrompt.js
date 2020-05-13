import React, {useEffect} from 'react';

import { Notifications } from 'react-native-notifications';

const requestPermission = async () => {
  // Request permissions on iOS, refresh token on Android
  Notifications.registerRemoteNotifications();

  Notifications.events().registerRemoteNotificationsRegistered((event: Registered) => {
      // TODO: Send the token to my server so it could send back push notifications...
      console.log("Device Token Received", event.deviceToken);
      window.controller.uploadNotificationToken(event.deviceToken);
  });
  Notifications.events().registerRemoteNotificationsRegistrationFailed((event: RegistrationError) => {
    console.log("Failed");
    console.error(event);
  });

}

const configure = async () => {
  // Dont request persmission, will crash on iOS simulator
  if (!await window.controller.isSimulator()) {
    requestPermission();
  }
}

export default function PushNotificationPrompt({}) {
  useEffect(() => {
    configure();
  }, []);
  return null;
}
