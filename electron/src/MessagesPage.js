import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class MessagesPage extends Component {

  constructor(props) {
    super(props);
    this.state = {connectedUser: null, loaded: false, value: ``, userMessages: []}

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNewMessage = this.handleNewMessage.bind(this);
    this.uploadFile= this.uploadFile.bind(this);
    this.downloadFile= this.downloadFile.bind(this);

    window.apiCallbacks.newMessage = this.handleNewMessage;
  }

  async handleChange(event) {
    this.setState({value: event.target.value});
  }

  async uploadFile() {
    await window.controller.uploadFiles(this.props.match.params.id);
    this.handleNewMessage();
  }

  // Returns a function, kind of hacky
  downloadFile(message) {
    return async function(){
      window.controller.downloadFile(message);
    }
  }

  async handleNewMessage() {
    let userMessages = await window.controller.getMessages(this.state.connectedUser.id);
    this.setState({userMessages: userMessages});
  }

  async handleSubmit(event) {
    event.preventDefault();

    await window.controller.sendMessage(this.state.value, this.props.match.params.id);
    this.setState({value: ""});
    this.handleNewMessage();
  }

  render() {
    let messages = this.state.userMessages.map((message, index) =>
      {if(window.view.messageHasLink(message)) {
        return <p className={window.controller.currentUsersMessage(message) ? "text-primary text-right" : "text-secondary"} key={message.id}>
          <button className="btn btn-primary" onClick={this.downloadFile(message)}>{window.view.messageDisplay(message)}</button>
          </p>
      } else {
        return <p className={window.controller.currentUsersMessage(message) ? "text-primary text-right" : "text-secondary"} key={message.id}>{window.view.messageDisplay(message)}</p>
      }}
    )
    return (
      <div>
        <Link className="btn btn-outline-primary" to={`/`}>{"< Back"}</Link>
        <h2>Messages {this.state.connectedUser === null ? `` : `- ${window.view.userDisplay(this.state.connectedUser)}`}</h2>
        <div>
          {messages}
        </div>
        <form onSubmit={this.handleSubmit}>
          <input type="text" value={this.state.value} onChange={this.handleChange} placeholder="Write a message..." />
          <input type="submit" value="Submit" className="btn btn-primary" />
          <button type="button" className="btn btn-success" onClick={this.uploadFile}>+</button>
        </form>
      </div>
    );
  }

  async componentDidMount() {
    let connectedUserId = this.props.match.params.id
    let connectedUser = await window.controller.getUserById(connectedUserId);
    let userMessages = await window.controller.getMessages(connectedUserId);
    this.setState({connectedUser: connectedUser, loaded: true, userMessages: userMessages});
  }
}

export default MessagesPage;
