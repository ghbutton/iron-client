import './MessagesPage.css';
import './App.css';
import 'emoji-mart/css/emoji-mart.css'

import { Picker } from 'emoji-mart'
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class MessagesPage extends Component {
  constructor(props) {
    super(props);
    this.state = {connectedUser: null, connectedUserId: null, loaded: false, value: ``, userMessages: [], emojisVisible: false}

    this.handleChange = this.handleChange.bind(this);
    this.handleKeyUp= this.handleKeyUp.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNewMessage = this.handleNewMessage.bind(this);
    this.uploadFile= this.uploadFile.bind(this);
    this.downloadFile= this.downloadFile.bind(this);
    this.addEmoji = this.addEmoji.bind(this);
    this.showEmojis = this.showEmojis.bind(this);
    this.resendMessage = this.resendMessage.bind(this);
    this.clickBackground = this.clickBackground.bind(this);

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

  async clickBackground(event) {
    console.log("BACKGROUND CLICK");
    console.log(event.target);
  }

  async addEmoji(e) {
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

  async showEmojis() {
    this.setState({emojisVisible: !this.state.emojisVisible});
  }

  async resendMessage(event) {
    window.controller.resendMessage((event.target.getAttribute("data-id")));
  }

  async uploadFile() {
    const {connectedUserId} = this.state;
    await window.controller.uploadFiles(connectedUserId);
    this.handleNewMessage();
  }

  // Returns a function, kind of hacky
  downloadFile(message) {
    return async function(){
      window.controller.downloadFile(message);
    }
  }

  async handleNewMessage() {
    const {connectedUserId} = this.state;
    let rescroll = false;
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      rescroll = true;
    }
    let userMessages = await window.controller.getMessages(connectedUserId);
    this.setState({userMessages: userMessages});
    window.controller.setLastRead(connectedUserId);

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

        // TODO put this in view logic
        const {downloading_at, downloaded_at, sent_at, delivered_at, errored_at, sending_at} = (message.meta ? message.meta : {})
        const fromMe = window.controller.currentUsersMessage(message);
        const sent = !!sent_at;
        const delivered = !!delivered_at;
        const errored = !!errored_at || (!sent && (!sending_at || sending_at < Date.now() - 60000));
        const downloading = !!downloading_at && (downloading_at > Date.now() - 60000);

        return (
          <div key={message.id} className="message-row">
            <div className={fromMe ? "from-me bubble" : "from-them bubble"} >
              {body}
              {fromMe && sent && <div className="bottom-right"><span className="badge badge-pill badge-primary checkmark">&#10003;</span></div>}
              {fromMe && delivered && <div className="delivered-checkmark"><span className="badge badge-pill badge-primary checkmark">&#10003;</span></div>}
              {fromMe && !sent && !delivered && !errored && <div className="ring-div"><div className="lds-ring lds-ring-me" ><div></div><div></div><div></div><div></div></div></div>}
              {fromMe && errored && <div className="bottom-right"><button className="badge badge-pill badge-danger" onClick={this.resendMessage} data-id={message.id}>!</button></div>}
              {!fromMe && downloading && <div className="ring-div"><div className="lds-ring lds-ring-them"><div></div><div></div><div></div><div></div></div></div>}
              {!fromMe && downloaded_at && <div className="delivered-checkmark"><span className="badge badge-pill badge-primary checkmark">&#10003;</span></div>}
            </div>
            <div className="clear"></div>
          </div>
        )
    })
    return (
      <div>
        <div className="sticky-header color1">
          <Link className="btn btn-primary" to={`/`}>{"< Back"}</Link>
          <h2>{this.state.connectedUser === null ? `` : `${window.view.userDisplay(this.state.connectedUser)}`}</h2>
        </div>
        <section className="message-display" >
          <div className="clickable-background" onClick={this.clickBackground}></div>
          {messages}
          <span id="picker">
            {this.state.emojisVisible && (<Picker onSelect={this.addEmoji} native={true} title="Iron" />)}
          </span>
        </section>
        <div className="sticky-footer">
          <textarea rows="1" ref={this.focusInput} type="text" value={this.state.value} onChange={this.handleChange} onKeyPress={this.handleKeyUp} placeholder="Secure Message" className="message-input footer-padding"/>
          <button type="button" className="btn btn-success upload-button footer-padding" onClick={this.showEmojis}><span role="img" aria-label="face">😀</span></button>
          <button type="button" className="btn btn-success upload-button footer-padding" onClick={this.uploadFile}><span role="img" aria-label="folder">📁</span></button>
        </div>
      </div>
    );
  }

  async componentWillUnmount() {
    // you need to unbind the same listener that was binded.
    window.removeEventListener("new_message", this.handleNewMessage);
  }

  async componentDidMount() {
    let connectedUserId = this.props.match.params.id
    let userMessages = await window.controller.getMessages(connectedUserId);
    this.focusInput.current.focus();
    this.setState({loaded: true, userMessages, connectedUserId});
    window.controller.setLastRead(connectedUserId);

    window.scroll({
      top: document.body.scrollHeight
    });

    window.addEventListener("new_message", this.handleNewMessage);

    // Api call, slow
    let connectedUser = await window.controller.getUserById(connectedUserId);
    if (connectedUser) {
      this.setState({connectedUser});
    }
  }
}

export default MessagesPage;
