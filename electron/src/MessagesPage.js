import './MessagesPage.css';
import './App.css';
import 'emoji-mart/css/emoji-mart.css';

import {emojiIndex, Picker} from 'emoji-mart';
import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import Dropdown from 'react-bootstrap/Dropdown';

const PLING = new Audio();
PLING.src = './static/sounds/pling.wav';
PLING.volume = 0.75;

class MessagesPage extends Component {
  constructor(props) {
    super(props);
    this.state = {connectedUser: null, connectedUserId: null, messageString: ``, userMessages: [], emojisVisible: false, downloads: [], now: new Date(), userId: null, deviceId: null};

    this.handleChange = this.handleChange.bind(this);
    this.handleKeyUp= this.handleKeyUp.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNewMessage = this.handleNewMessage.bind(this);
    this.handleNewDownload = this.handleNewDownload.bind(this);
    this.uploadFile= this.uploadFile.bind(this);
    this.downloadFile= this.downloadFile.bind(this);
    this.openDownload= this.openDownload.bind(this);
    this.addEmoji = this.addEmoji.bind(this);
    this.showEmojis = this.showEmojis.bind(this);
    this.resendMessage = this.resendMessage.bind(this);
    this.clickBackground = this.clickBackground.bind(this);
    this.focusTextInput= this.focusTextInput.bind(this);

    this.focusInput = React.createRef();
  }

  async handleChange(event) {
    this.setState({messageString: event.target.value});
  }

  async focusTextInput() {
    // Explicitly focus the text input using the raw DOM API
    // Note: we're accessing "current" to get the DOM node
    this.focusInput.current.focus();
  }

  async handleKeyUp(event) {
    if (event.key === 'Enter' ) {
      event.preventDefault();
      this.handleSubmit(event);
    }
  }

  async clickBackground(event) {
    console.log('BACKGROUND CLICK');
    console.log(event.target);
  }

  async addEmoji(e) {
    const {messageString} = this.state;
    // console.log(e.unified)
    if (e.unified.length <= 5) {
      const emojiPic = String.fromCodePoint(`0x${e.unified}`);
      this.setState({
        messageString: messageString+ emojiPic,
      });
    } else {
      const sym = e.unified.split('-');
      const codesArray = [];
      sym.forEach((el) => codesArray.push('0x' + el));
      // console.log(codesArray.length)
      // console.log(codesArray)  // ["0x1f3f3", "0xfe0f"]
      const emojiPic = String.fromCodePoint(...codesArray);
      this.setState({
        messageString: messageString + emojiPic,
      });
    }

    this.setState({
      emojisVisible: false,
    });
    this.focusTextInput();
  }

  async showEmojis() {
    const {emojisVisible} = this.state;
    this.setState({emojisVisible: !emojisVisible});
    this.focusTextInput();
  }

  async resendMessage(event) {
    window.controller.resendMessage((event.target.getAttribute('data-id')));
  }

  async uploadFile() {
    const {connectedUserId} = this.state;
    await window.controller.uploadFiles(connectedUserId);
    this.handleNewMessage();
  }

  // TODO returns a function, kind of hacky
  downloadFile(message) {
    return async function() {
      window.controller.downloadFile(message);
    };
  }
  // TODO also hacky
  openDownload(download) {
    return async function() {
      window.controller.openDownload(download);
    };
  }

  async handleNewMessage() {
    const {connectedUserId} = this.state;
    let rescroll = false;
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      rescroll = true;
    }
    const userMessages = await window.controller.getMessages(connectedUserId);
    this.setState({userMessages});
    window.controller.setLastRead(connectedUserId);

    if (rescroll) {
      window.scroll({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      });
    }
  }

  async handleNewDownload() {
    const {connectedUserId} = this.state;
    const userMessages = await window.controller.getMessages(connectedUserId);
    const downloads = await window.controller.getDownloads();
    this.setState({userMessages, downloads});
  }

  async handleSubmit(event) {
    const {messageString} = this.state
    if (messageString !== '') {
      await window.controller.sendMessage(messageString, this.props.match.params.id);
      this.setState({messageString: ''});
      PLING.currentTime = 0;
      PLING.play();
      this.handleNewMessage();
    }
  }

  render() {
    let date = null;
    let lastMessageFromMe = true;
    const {userId, userMessages, downloads, connectedUser, emojisVisible, messageString} = this.state;
    const messages = userMessages.map((message, index) => {
      let body = null;

      if (window.view.messageHasLink(message)) {
        body = <button className="btn btn-primary" onClick={this.downloadFile(message)}>{window.view.messageDisplay(message)}</button>;
      } else {
        body = window.view.messageDisplay(message);
      }

      const timestamp = window.view.messageTimestamp(message);
      const timestampDisplay = window.view.messageDisplayTimestamp(timestamp);

      const fromMe = window.view.currentUsersMessage(message, userId);
      const messageState = window.view.messageState(message, userId);
      const fromMeSpace = (fromMe && !lastMessageFromMe) || (!fromMe && lastMessageFromMe);

      if (fromMeSpace) {
        lastMessageFromMe = fromMe;
      }

      let dateDisplay = null;

      // TODO put this in view logic
      if (timestamp === null){
      } else if (date === null || timestamp.getFullYear() !== date.getFullYear() || timestamp.getMonth() !== date.getMonth() || timestamp.getDate() !== date.getDate()) {
        date = timestamp;
        dateDisplay = window.view.timestampBreakDisplay(date);
      }

      return (
        <div key={message.id} className="message-row">
          {dateDisplay !== null ? <div className="date-container"><span className="btn btn-info">{dateDisplay}</span></div> : null}
          {!dateDisplay && fromMeSpace && <div className="from-me-space" />}
          <div className={fromMe ? 'from-me bubble' : 'from-them bubble'} >
            <span className="message"><span className="message-body">{body}</span><span className="message-timestamp">{timestampDisplay}</span></span>
            {(messageState === "delivered" || messageState === "sent") && <div className="bottom-right"><span className="badge badge-pill badge-primary checkmark">&#10003;</span></div>}
            {messageState === "delivered" && <div className="delivered-checkmark"><span className="badge badge-pill badge-primary checkmark">&#10003;</span></div>}
            {messageState === "sending" && <div className="ring-div"><div className="lds-ring lds-ring-me" ><div></div><div></div><div></div><div></div></div></div>}
            {messageState === "errored" && <div className="bottom-right"><button className="badge badge-pill badge-danger" onClick={this.resendMessage} data-id={message.id}>!</button></div>}
            {messageState === "downloading" && <div className="ring-div"><div className="lds-ring lds-ring-them"><div></div><div></div><div></div><div></div></div></div>}
            {messageState === "downloaded" && <div className="delivered-checkmark"><span className="badge badge-pill badge-primary checkmark">&#10003;</span></div>}
          </div>
          <div className="clear"></div>
        </div>
      );
    });

    const downloadDropdown = (downloads.length > 0 &&
      <Dropdown>
        <Dropdown.Toggle className="btn btn-outline-primary download-button">
          <span role="img" aria-label="arrow">⇩</span>
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {
            downloads.map((download, index) => {
              return (<Dropdown.Item key={index} onClick={this.openDownload(download)}>{download.basename}</Dropdown.Item>);
            })
          }
        </Dropdown.Menu>
      </Dropdown>
    );

    // TODO add a way to inject emojis
    //    if (messageString.startsWith(":") && messageString !== ":") {
    //      const emojiSearchString = messageString.replace(":", "");
    //      emojiIndex.search(emojiSearchString).map((o) => console.log(o));
    //    }
    return (
      <div>
        <div className="sticky-header color1">
          <div className="header-line-1">
            <Link className="btn btn-outline-primary" to={`/`}>{'< Back'}</Link>
            {downloadDropdown}
          </div>
          <h2>{connectedUser === null ? `` : `${window.view.userDisplay(connectedUser)}`}</h2>
        </div>
        <section className="message-display" >
          <div className="clickable-background" onClick={this.clickBackground}></div>
          {messages}
          <span id="picker">
            {emojisVisible && (<Picker onSelect={this.addEmoji} native={true} title="Iron" />)}
          </span>
        </section>
        <div className="sticky-footer">
          <textarea rows="1" ref={this.focusInput} type="text" value={messageString} onChange={this.handleChange} onKeyPress={this.handleKeyUp} placeholder="Secure Message" className="message-input footer-padding"/>
          <button type="button" className="btn btn-outline-success upload-button footer-padding" onClick={this.showEmojis}><span role="img" aria-label="face">😀</span></button>
          <button type="button" className="btn btn-outline-success upload-button footer-padding" onClick={this.uploadFile}><span role="img" aria-label="folder">📁</span></button>
        </div>
      </div>
    );
  }

  async componentWillUnmount() {
    // you need to unbind the same listener that was binded.
    window.removeEventListener('new_message', this.handleNewMessage);
    window.removeEventListener('new_download', this.handleNewDownload);
  }

  async componentDidMount() {
    const connectedUserId = this.props.match.params.id;
    const userMessages = await window.controller.getMessages(connectedUserId);
    const downloads = await window.controller.getDownloads();
    const userId = window.controller.currentUserId();
    const deviceId = window.controller.currentDeviceId();
    this.setState({userMessages, connectedUserId, downloads, userId, deviceId});
    this.focusTextInput();
    window.controller.setLastRead(connectedUserId);

    window.scroll({
      top: document.body.scrollHeight,
    });

    window.addEventListener('new_message', this.handleNewMessage);
    window.addEventListener('new_download', this.handleNewDownload);

    // Api call, slow
    const connectedUser = await window.controller.getUserById(connectedUserId);
    if (connectedUser) {
      this.setState({connectedUser});
    }
  }
}

export default MessagesPage;
