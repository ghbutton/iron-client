import React, {useEffect} from 'react';

import {Notifications} from 'react-native-notifications';

const configure = () => {
  Notifications.events().registerNotificationReceivedForeground(
    (
      notification: Notification,
      completion: (response: NotificationCompletion) => void,
    ) => {
      console.log('Notification Received - Foreground', notification.payload);
      console.log(notification);

      // Calling completion on iOS with `alert: true` will present the native iOS inApp notification.
      completion({alert: true, sound: true, badge: true});
    },
  );

  Notifications.events().registerNotificationOpened(
    (
      notification: Notification,
      completion: () => void,
      action: NotificationActionResponse,
    ) => {
      console.log('Notification opened by device user', notification.payload);
      console.log(
        `Notification opened with an action identifier: ${
          action.identifier
        } and response text: ${action.text}`,
      );
      completion();
    },
  );

  // Background doesn't work on wix / push notifications for now: https://github.com/wix/react-native-notifications/pull/587/files
};

export default function TopLevel({}) {
  useEffect(() => {
    configure();
  }, []);
  return null;
}
