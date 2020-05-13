import "./MessagesPage.css";
import "./App.css";
import "emoji-mart/css/emoji-mart.css";

import Dropdown from "react-bootstrap/Dropdown";
import {emojiIndex, Picker} from "emoji-mart";
import React, {Component} from "react";

import UserAvatar from "./UserAvatar";

const PLING = new Audio();
PLING.src = "./static/sounds/pling.wav";
PLING.volume = 0.75;

class MessagesPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connectedUser: null,
      connectedUserId: null,
      emojisVisible: false,
      emojiResults: [],
      emojiResultsIndex: 0,
      deviceId: null,
      downloads: [],
      messageString: "",
      now: new Date(),
      organization: null,
      organizationMembership: null,
      userMessages: [],
      userId: null,
    };

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
    this.selectEmoji = this.selectEmoji.bind(this);

    this.focusInput = React.createRef();
  }

  lastWord(message) {
    const words = message.split(" ");
    if (words.length === 0) {
      return [null, ""];
    } else if (words.length === 1) {
      return [null, words[0]];
    } else {
      return [words.slice(0, -1).join(" "), words[words.length - 1]];
    }
  }

  async handleChange(event) {
    const messageString = event.target.value;
    this.updateMessage(messageString);
  }

  async updateMessage(messageString) {
    this.setState({messageString});

    const [, last] = this.lastWord(messageString);
    if (last.startsWith(":") && last.length > 2) {
      const emojiSearchString = last.replace(":", "");
      const results = emojiIndex.search(emojiSearchString).slice(0, 10);
      this.setState({emojiResults: results});
    } else {
      this.setState({emojiResults: []});
    }
  }

  async focusTextInput() {
    // Explicitly focus the text input using the raw DOM API
    // Note: we're accessing "current" to get the DOM node
    this.focusInput.current.focus();
  }

  async handleKeyUp(event) {
    if (event.key === "Enter") {
      const emojiResults = this.state.emojiResults;
      event.preventDefault();
      if (emojiResults.length > 0) {
        // TODO handle tabl when tabbing through emoji results
        // Add emoji to message
        this.selectEmoji(emojiResults[0])();
      } else {
        this.handleSubmit(event);
      }
    }
  }

  async clickBackground(event) {
    this.setState({
      emojisVisible: false,
    });
    this.focusTextInput();
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
      const sym = e.unified.split("-");
      const codesArray = [];
      sym.forEach((el) => codesArray.push("0x" + el));
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
    window.controller.resendMessage((event.target.getAttribute("data-id")));
  }

  async uploadFile() {
    const {connectedUserId} = this.state;
    const fileNames = await window.controller.selectFiles();

    if (fileNames !== []) {
      await window.controller.uploadFiles(connectedUserId, fileNames);
    }

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

  // Also hacky
  selectEmoji(emoji) {
    const _this = this;
    return async function() {
      const {messageString} = _this.state;
      const [prev] = _this.lastWord(messageString);
      _this.focusTextInput();
      if (prev === null) {
        _this.updateMessage(`${emoji.native}`);
      } else {
        _this.updateMessage(`${prev} ${emoji.native}`);
      }
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
        behavior: "smooth",
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
    const {messageString} = this.state;
    if (messageString !== "") {
      await window.controller.sendMessage(messageString, this.props.match.params.id);
      this.setState({messageString: ""});
      PLING.currentTime = 0;
      PLING.play();
      this.handleNewMessage();
    }
  }

  render() {
    let date = null;
    let lastMessageFromMe = true;
    const {userId, userMessages, downloads, connectedUser, emojisVisible, emojiResults, messageString, organization, organizationMembership} = this.state;

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
      if (timestamp === null) {
      } else if (date === null || timestamp.getFullYear() !== date.getFullYear() || timestamp.getMonth() !== date.getMonth() || timestamp.getDate() !== date.getDate()) {
        date = timestamp;
        dateDisplay = window.view.timestampBreakDisplay(date);
      }

      // TODO handle unsent file error

      return (
        <div key={message.id} className="message-row">
          {dateDisplay !== null ? <div className="date-container"><span className="badge badge-primary">{dateDisplay}</span></div> : null}
          {!dateDisplay && fromMeSpace && <div className="from-me-space" />}
          <div className={fromMe ? "from-me bubble" : "from-them bubble"} >
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
        <Dropdown.Toggle className="download-button">
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

    const emojiSearchResults = (emojiResults.length > 0 &&
      <div className="emoji-results">
        {
          emojiResults.map((result) =>
            <button type="button" key={result.id} className="btn btn-outline-success upload-button" onClick={this.selectEmoji(result)}><span role="img">{result.native}</span></button>
          )
        }
      </div>
    );

    return (
      <div>
        <div className="clickable-background" onClick={this.clickBackground}></div>
        <div className="sticky-header color1">
          <div className="header-line-1">
            <button className="btn btn-outline-primary" onClick={() => {this.props.history.goBack()}}>{"< Back"}</button>
            {downloadDropdown}
          </div>
          { connectedUser === null ? null : (
            <div className="messagesUser" >
              <UserAvatar user={connectedUser} className="smallAvatar" />
              <div className="messagesDetails">
                <h2>{`${window.view.userDisplay(connectedUser)}`}</h2>
                { organization === null ? null : (
                  <h4>{organization.attributes.name} {organizationMembership.attributes.verified && "☑"}</h4>
                )}
              </div>
            </div>
          ) }
        </div>
        <section className="message-display">
          {messages}
        </section>
        <div id="picker">
          {emojisVisible && (<Picker onSelect={this.addEmoji} native={true} title="Iron" />)}
        </div>
        <div className="sticky-footer">
          {emojiSearchResults}
          <div className="message-bar">
            <textarea rows="1" ref={this.focusInput} type="text" value={messageString} onChange={this.handleChange} onKeyPress={this.handleKeyUp} placeholder="Secure Message" className="message-input footer-padding"/>
            <button type="button" className="btn btn-outline-success upload-button footer-padding" onClick={this.showEmojis}><span role="img" aria-label="face">😀</span></button>
            <button type="button" className="btn btn-outline-success upload-button footer-padding" onClick={this.uploadFile}><span role="img" aria-label="folder">📁</span></button>
          </div>
        </div>
      </div>
    );
  }

  async componentWillUnmount() {
    // you need to unbind the same listener that was binded.
    window.removeEventListener("new_message", this.handleNewMessage);
    window.removeEventListener("new_download", this.handleNewDownload);
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

    window.addEventListener("new_message", this.handleNewMessage);
    window.addEventListener("new_download", this.handleNewDownload);

    // Api call, slow
    const connectedUser = await window.controller.getUserById(connectedUserId);
    if (connectedUser) {
      this.setState({connectedUser});
      const organizationMembership = await window.controller.getOrganizationMembershipByUserId(connectedUserId);
      if (organizationMembership) {
        const organization = await window.controller.getOrganizationById(organizationMembership.relationships.organization.data.id);
        this.setState({organizationMembership, organization});
      }
    }
  }
}

export default MessagesPage;
