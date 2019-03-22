import './ChatsPage.css';
import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import MenuFooter from './MenuFooter';

class ChatsPage extends Component {
  state = { loaded: false, connectedUsers: []};
  render() {
    return (
      <div className="ChatsPage">
          <div className="chatsMenu">
            <Link to="/new_chat" className="pull-right btn btn-outline-primary">New</Link>
        </div>
        <div className="container">
          <h1>Chats</h1>
          <div className="list-group">
          {
            this.state.connectedUsers.map((user) => {
              return(<Link key={user.id} to={`/connections/${user.id}/messages`} className="list-group-item list-group-item-action">{window.view.userDisplay(user)}</Link>)
            })
          }
          </div>
        </div>
        <MenuFooter/>
      </div>
    );
  }

  async componentDidMount(){
    if (await window.controller.notLoggedIn()) {
      this.props.history.push(`/login`)
    } else {
      const connectedUsers = await window.controller.getConnectedUsers();
      this.setState({connectedUsers: connectedUsers, loaded: true});
    }
  }
}

export default ChatsPage;
