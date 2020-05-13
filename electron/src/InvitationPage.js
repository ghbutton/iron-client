import React, {useState} from "react";

function InvitationPage(props) {
  const [name, setName] = useState("");
  const email = props.match.params.email;

  const handleChange = async (event) => {
    if (event.target.name === "name") {
      setName(event.target.value);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const {status} = await window.controller.createNewInvitation(name, email);

    if (status === "ok") {
      props.history.goBack();
    }
  };

  return (
    <div className="newContactPage container">
      <button className="btn btn-outline-primary" onClick={() => {
        props.history.goBack();
      }}>{"< Back"}</button>
      <h1>New Contact</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" placeholder="Full name" name="name" onChange={handleChange} required/>
        </div>

        <div className="form-group">
          <input type="email" value={email} name="email" disabled/>
        </div>

        <input type="submit" className="btn btn-primary" value="Submit" />
      </form>
    </div>
  );
}

export default InvitationPage;
