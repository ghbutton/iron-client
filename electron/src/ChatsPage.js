import "./ChatsPage.css";
import React, {Component} from "react";
import {Link} from "react-router-dom";
import MenuFooter from "./MenuFooter";

class ChatsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {connectedUsers: [], hasUnreadMessages: {}, userDisplay: {}, connectionsLoaded: false};
    this.handleNewMessage = this.handleNewMessage.bind(this);
    this.refreshConnections = this.refreshConnections.bind(this);
    this.handleNewConnection = this.handleNewConnection.bind(this);
  }

  async refreshConnections() {
    const connectedUsers = await window.controller.getConnectedUsers();
    const [hasUnreadMessages, userDisplay] = [{}, {}];
    for (let i = 0; i < connectedUsers.length; i++) {
      const user = connectedUsers[i];
      userDisplay[user.id] = window.view.userDisplay(user);
      hasUnreadMessages[user.id] = window.controller.hasUnreadMessages(user.id);
    }
    this.setState({connectedUsers, userDisplay, hasUnreadMessages, connectionsLoaded: true});
  }

  async handleNewConnection() {
    this.refreshConnections();
  }

  async handleNewMessage() {
    const {connectedUsers} = this.state;
    const hasUnreadMessages = {};

    for (let i = 0; i < connectedUsers.length; i++) {
      const user = connectedUsers[i];
      hasUnreadMessages[user.id] = window.controller.hasUnreadMessages(user.id);
    }

    this.setState({hasUnreadMessages});
  };

  render() {
    const {connectedUsers, hasUnreadMessages, userDisplay, connectionsLoaded} = this.state;
    return (
      <div className="ChatsPage">
        <div className="container withFooter">
          <div className="chatsMenu">
            <Link to="/new_chat" className="pull-right btn btn-outline-primary">New</Link>
          </div>
          <h1>Chats</h1>
          <hr/>
          { (connectionsLoaded && connectedUsers.length === 0) ?
              <div>
                No chats. Please add some<Link to="/new_contact" className="btn btn-link">contacts</Link>😀!
              </div>
              :
          <div className="list-group">
            {
              connectedUsers.map((user) => {
                return (
                  <Link key={user.id} to={`/connections/${user.id}/messages`} className="list-group-item list-group-item-action">
                    {userDisplay[user.id]} <span>{hasUnreadMessages[user.id] && (<span className="badge badge-pill badge-primary">!</span>)}</span>
                  </Link>
                );
              })
            }
          </div>

          }
        </div>
        <MenuFooter/>
      </div>
    );
  }

  async componentWillUnmount() {
    // you need to unbind the same listener that was binded.
    window.removeEventListener("new_message", this.handleNewMessage);
    window.removeEventListener("new_connection", this.handleNewConnection);
  }

  async componentDidMount() {
    window.addEventListener("new_message", this.handleNewMessage);
    window.addEventListener("new_connection", this.handleNewConnection);

    this.refreshConnections();
  }
}

export default ChatsPage;
