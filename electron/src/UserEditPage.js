import React from "react";
import {Link} from "react-router-dom";
import UserEditForm from "./UserEditForm";

function UserEditPage(props) {
  return (
    <div className="userEditPage container">
      <Link className="btn btn-outline-primary" to={"/settings"}>{"< Back"}</Link>
      <h1>Edit User</h1>
      <UserEditForm onSuccessLink={"/settings"} />
   </div>
  );
}

export default UserEditPage;
