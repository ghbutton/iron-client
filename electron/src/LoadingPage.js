import React, {Component} from "react";

import "./LoadingPage.css";

class LoadingPage extends Component {
  constructor(props) {
    super(props);
    this.handleNoUser = this.handleNoUser.bind(this);
    this.handleLoggedIn= this.handleLoggedIn.bind(this);
  }

  async handleNoUser() {
    this.props.history.push("/login");
  }

  async handleLoggedIn() {
    if (await window.controller.currentUserHasName()) {
      this.props.history.push("/chats");
    } else {
      this.props.history.push("/user_edit_wizard");
    }
  }

  async componentDidMount() {
    window.addEventListener("loaded_no_user", this.handleNoUser);
    window.addEventListener("loaded_with_user", this.handleLoggedIn);
  }

  async componentWillUnmount() {
    // you need to unbind the same listener that was binded.
    window.removeEventListener("loaded_no_user", this.handleNoUser);
    window.removeEventListener("loaded_with_user", this.handleLoggedIn);
  }

  render() {
    return (
      <img src="./static/icon.png" height="100px" width="100px" alt="" className="loading-image"/>
    );
  }
}

export default LoadingPage;
