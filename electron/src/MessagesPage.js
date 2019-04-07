import './MessagesPage.css';
import './App.css';
import 'emoji-mart/css/emoji-mart.css'

import { Picker } from 'emoji-mart'
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class MessagesPage extends Component {

  constructor(props) {
    super(props);
    this.state = {connectedUser: null, loaded: false, value: ``, userMessages: [], emojisVisible: false}

    this.handleChange = this.handleChange.bind(this);
    this.handleKeyUp= this.handleKeyUp.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNewMessage = this.handleNewMessage.bind(this);
    this.uploadFile= this.uploadFile.bind(this);
    this.downloadFile= this.downloadFile.bind(this);

    this.focusInput = React.createRef();
  }

  async handleChange(event) {
    this.setState({value: event.target.value});
  }

  async focusTextInput() {
    // Explicitly focus the text input using the raw DOM API
    // Note: we're accessing "current" to get the DOM node
    this.textInput.current.focus();
  }

  async handleKeyUp(event) {
    if(event.key === "Enter" ) {
      event.preventDefault();
      this.handleSubmit(event);
    }
  }

  addEmoji = (e) => {
    // console.log(e.unified)
    if (e.unified.length <= 5){
      let emojiPic = String.fromCodePoint(`0x${e.unified}`)
      this.setState({
        value: this.state.value + emojiPic
      })
    } else {
      let sym = e.unified.split('-')
      let codesArray = []
      sym.forEach(el => codesArray.push('0x' + el))
      // console.log(codesArray.length)
      // console.log(codesArray)  // ["0x1f3f3", "0xfe0f"]
      let emojiPic = String.fromCodePoint(...codesArray)
      this.setState({
        value: this.state.value + emojiPic
      })
    }
  }

  showEmojis = async () => {
    this.setState({emojisVisible: !this.state.emojisVisible});
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
    let rescroll = false;
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      rescroll = true;
    }
    let userMessages = await window.controller.getMessages(this.state.connectedUser.id);
    this.setState({userMessages: userMessages});

    if (rescroll) {
      window.scroll({
        top: document.body.scrollHeight,
        behavior: "smooth"
      });
    }
  }

  async handleSubmit(event) {
    if (this.state.value !== "") {
      await window.controller.sendMessage(this.state.value, this.props.match.params.id);
      this.setState({value: ""});
      this.handleNewMessage();
    }
  }

  render() {
    let messages = this.state.userMessages.map((message, index) =>
      {
        let body = null;

        if(window.view.messageHasLink(message)) {
          body = <button className="btn btn-primary" onClick={this.downloadFile(message)}>{window.view.messageDisplay(message)}</button>
        } else {
          body = window.view.messageDisplay(message);
        }

        return <div key={message.id}><div className={window.controller.currentUsersMessage(message) ? "from-me" : "from-them"} >
          {body}
      </div><div className="clear"></div></div>
    })
    return (
      <div>
        <div className="sticky-header color1">
          <Link className="btn btn-primary" to={`/`}>{"< Back"}</Link>
          <h2>{this.state.connectedUser === null ? `` : `${window.view.userDisplay(this.state.connectedUser)}`}</h2>
        </div>
        <section className="message-display">
          {messages}
          <span id="picker">
            {this.state.emojisVisible && (<Picker onSelect={this.addEmoji} native={true} title="Iron" />)}
          </span>
        </section>
        <div className="sticky-footer">
          <textarea rows="1" ref={this.focusInput} type="text" value={this.state.value} onChange={this.handleChange} onKeyPress={this.handleKeyUp} placeholder="Secure Message" className="message-input footer-padding"/>
          <button type="button" className="btn btn-success upload-button footer-padding" onClick={this.showEmojis}>😀</button>
          <button type="button" className="btn btn-success upload-button footer-padding" onClick={this.uploadFile}>📁</button>
        </div>
      </div>
    );
  }

  async componentDidMount() {
    let connectedUserId = this.props.match.params.id
    let userMessages = await window.controller.getMessages(connectedUserId);
    this.focusInput.current.focus();
    this.setState({loaded: true, userMessages});

    // Api call, slow
    let connectedUser = await window.controller.getUserById(connectedUserId);
    this.setState({connectedUser});

    window.scroll({
      top: document.body.scrollHeight
    });

    window.addEventListener("new_message", this.handleNewMessage);
  }

  async componentWillUnmount() {
    window.removeEventListener("new_message", this.handleNewMessage);
  }
}

export default MessagesPage;
