import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";

function UserEditPage(props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const {status}= await window.controller.updateUser({name});

    if (status === "ok") {
      props.history.push("/settings");
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

      setName(currentUser.attributes.name || "");
      setEmail(currentUser.attributes.email);
    };
    getUser();
  }, []);

  return (
    <div className="userEditPage container">
      <Link className="btn btn-outline-primary" to={"/settings"}>{"< Back"}</Link>
      <h1>Edit User</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" value={name} placeholder="Full name" name="name" onChange={handleChange} required/>
        </div>

        <div className="form-group">
          <input type="text" name="email" value={email} disabled/>
        </div>

        <input type="submit" className="btn btn-primary" value="Submit" />
      </form>
    </div>
  );
}

export default UserEditPage;
