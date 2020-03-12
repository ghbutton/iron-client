import React from "react";
import UserEditForm from "./UserEditForm";

function UserEditWizardPage(props) {
  return (
    <div className="userEditWizardPage container">
      <h1>Edit User</h1>
      <UserEditForm onSuccessLink={"/chats"} />
    </div>
  );
}

export default UserEditWizardPage;
