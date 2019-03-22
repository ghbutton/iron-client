import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class MessagesPage extends Component {

  constructor(props) {
    super(props);
    this.state = {connectedUser: null, loaded: false, value: ``, userMessages: []}

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNewMessage = this.handleNewMessage.bind(this);

    window.apiCallbacks.newMessage = this.handleNewMessage;
  }

  async handleChange(event) {
    this.setState({value: event.target.value});
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
    return (
      <div>
        <Link className="btn btn-outline-primary" to={`/`}>{"< Back"}</Link>
        <h2>Messages {this.state.connectedUser === null ? `` : `- ${window.view.userDisplay(this.state.connectedUser)}`}</h2>
        <div>
          {this.state.userMessages.map((message, index) => (<p className={window.controller.currentUsersMessage(message) ? "text-primary text-right" : "text-secondary"} key={message.id}>{message.attributes.decryptedBody.data}</p>))}
        </div>
        <form onSubmit={this.handleSubmit}>
          <label>
            <textarea value={this.state.value} onChange={this.handleChange} placeholder="Write a message..." />
          </label>
          <input type="submit" value="Submit" className="btn btn-primary" />
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
