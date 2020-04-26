import React from 'react';
import UpdateUserForm from '../components/UpdateUserForm';

export default function NewUserWizardScreen() {
  const successCallback = () => {
    // Refire the logged_in_with_user event to navigate to the chats page
    // Not sure if this is the best way to do this but seems ok for now
    window.controller.emitLoggedIn();
  };

  return <UpdateUserForm successCallback={successCallback} />;
}
