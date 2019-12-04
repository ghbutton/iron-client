import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import UserAvatar from "./UserAvatar";

function UserEditPage(props) {
  const [name, setName] = useState("");
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState({binary: null, extname: ""});

  const handleSubmit = async (event) => {
    event.preventDefault();
    const {status}= await window.controller.updateUser({name, avatar_binary: avatar.binary, avatar_extname: avatar.extname});

    if (status === "ok") {
      props.history.push("/settings");
    }
  };

  const uploadImage = async () => {
    const filename = await window.controller.selectFile();
    if (filename !== null) {
      const {status, bytes, extname} = await window.controller.readAvatar(filename);
      if (status === "ok") {
        setAvatar({binary: bytes, extname: extname});
      } else {
        // TODO display error message
      }
    }
  };

  const handleChange = async (event) => {
    if (event.target.name === "name") {
      setName(event.target.value);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await window.controller.currentUser();

      setUser(currentUser);
      setName(currentUser.attributes.name || "");
      setEmail(currentUser.attributes.email);
    };
    getUser();
  }, []);

  return (
    <div className="userEditPage container">
      <Link className="btn btn-outline-primary" to={"/settings"}>{"< Back"}</Link>
      <h1>Edit User</h1>
      <UserAvatar user={user}/>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" value={name} placeholder="Full name" name="name" onChange={handleChange} required/>
        </div>

        <div className="form-group">
          <input type="text" name="email" value={email} disabled/>
        </div>

        <button type="button" className="btn btn-outline-success upload-button footer-padding" onClick={uploadImage}>Pick Image</button>

        <input type="submit" className="btn btn-primary" value="Submit" />
      </form>
    </div>
  );
}

export default UserEditPage;
