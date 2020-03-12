import React, {Component} from "react";
import {Link} from "react-router-dom";
import * as qs from "qs";

import UserMessages from "./UserMessages";
import "./LoginVerificationPage.css";

class LoginVerificationPage extends Component {
  constructor(props) {
    super(props);
    this.state = {email: "", code: "", errorMessage: "", message: "An email has been sent to verify your address (check spam)"};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleChange(event) {
    if (event.target.name === "code") {
      this.setState({code: event.target.value});
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const {status, resp} = await window.controller.login(this.state.email, this.state.code);

    if (status === "ok") {
      this.setState({verification: ""});
      console.log("Resetting page");
      this.props.history.push({pathname: "/loading"});
      await window.controller.reset();
    } else {
      this.setState({errorMessage: resp.message});
    }
  }

  render() {
    return (
      <div>
        <Link to={"/login"} className="btn btn-outline-primary">{"< Back"}</Link>
        <div className="centeredContainer">
          <h2>Verification Page</h2>
          <img src="./static/icon.png" height="100px" width="100px" alt=""/>

          <form onSubmit={this.handleSubmit} className="loginForm">
            <UserMessages warning={this.state.errorMessage} message={this.state.message} />
            <label><b>Email</b></label>
            <br/>
            <input type="text" name="email" value={this.state.email} disabled/>
            <br/>
            <label><b>Verification Code</b></label>
            <br/>
            <input type="text" placeholder="Enter Code" name="code" onChange={this.handleChange} required/>
            <br/>
            <input type="submit" className="btn btn-primary submit-btn" value="Submit" />
            <br/>
          </form>
          <br/>
        </div>
      </div>
    );
  }

  async componentDidMount() {
    const queryParams = qs.parse(this.props.location.search, {ignoreQueryPrefix: true});
    this.setState({email: queryParams.email});

    if (!await window.controller.notLoggedIn()) {
      const currentUser = await window.controller.currentUser();
      if (currentUser && (currentUser.attributes.name === "" || currentUser.attributes.name == null)) {
        console.log("Redirecting update user wizard");
        this.props.history.push("/user_edit_wizard");
      } else {
        console.log("Redirecting to chats");
        this.props.history.push("/chats");
      }
    }
  }
}

export default LoginVerificationPage;
