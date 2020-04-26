import React, {useState} from "react";
import {Link} from "react-router-dom";

function NewChatPage(props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [resultsReady, setResultsReady] = useState(false);
  const [searchedUser, setSearchedUser] = useState(null);
  const [isEmail, setIsEmail] = useState(false);

  const handleConnectToUser = async () => {
    const {status} = await window.controller.createNewConnection(searchedUser);

    if (status === 'ok') {
      props.history.goBack();
    }
  };

  const handleInvite = async () => {
    props.history.push(`/invitation/${search}`);
  };

  const handleChange = async (event) => {
    const searchString = event.target.value;
    setSearch(searchString);

    if (searchString.length > 3) {
      const users = await window.controller.connectedUsersSearch(searchString);
      setResults(users);
      setResultsReady(true);

      if (await window.controller.isEmail(searchString)) {
        const user = await window.controller.getUserByEmail(searchString);
        setIsEmail(true);

        setSearchedUser(user);
      } else {
        setSearchedUser(null);
        setIsEmail(false);
      }
    } else {
      setResults([]);
      setResultsReady(false);
      setSearchedUser(null);
      setIsEmail(false);
    }
  }

  let inviteUser = null;
  let resultsBody = null;

  if (isEmail) {
    if (searchedUser) {
      inviteUser = (
        <div>
          <span>Connect to user: </span>
          <button className="btn btn-primary" onClick={handleConnectToUser}>{window.view.userDisplay(searchedUser)}</button>
        </div>
      );
    } else {
      inviteUser = (
        <div>
          <span>Invite by email: </span>
          <button className="btn btn-primary" onClick={handleInvite}>{search}</button>
        </div>
      );
    }
  }

  if (results.length > 0) {
    resultsBody = (
      <ul>
        {
          results.map((user) => {
            return (<li key={user.id}><Link to={`/connections/${user.id}/messages`}>{window.view.userDisplay(user)}</Link></li>);
          })
        }
      </ul>
    );
  }

  return (
    <div className="newChatPage container">
      <button className="btn btn-outline-primary" onClick={() => {props.history.goBack()}}>{"< Back"}</button>
      <h1>New Chat</h1>

      <form>
        <input type="text" placeholder="Current contacts" name="email" onChange={handleChange} required/>
      </form>

      {inviteUser}
      {resultsBody}
    </div>
  );
}

export default NewChatPage;
