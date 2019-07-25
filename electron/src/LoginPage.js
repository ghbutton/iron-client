
import React, {Component} from "react";
import * as qs from "qs";

import BlankHeader from "./BlankHeader";
import FormErrors from "./FormErrors";
import "./LoginPage.css";

class LoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = {email: "", errorMessage: ""};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleChange(event) {
    this.setState({email: event.target.value});
  }

  async handleSubmit(event) {
    event.preventDefault();
    const {status, resp} = await window.controller.sendVerificationCode(this.state.email);
    if (status === "ok") {
      const query = {email: this.state.email};
      const searchString = qs.stringify(query);

      this.props.history.push({pathname: "/login_verification", search: searchString});
    } else {
      this.setState({errorMessage: resp.message});
    }
  }

  render() {
    return (
      <div className="centeredContainer">
        <BlankHeader/>
        <h2>Login Page</h2>
        <img src="/static/icon.png" height="100px" width="100px" alt=""/>
        <FormErrors message={this.state.errorMessage} />
        <form action="/#/login_verification" method="get" onSubmit={this.handleSubmit} className="loginForm">
          <label><b>Email</b></label>
          <br/>
          <input type="text" placeholder="Email" name="email" onChange={this.handleChange} required/>
          <br/>
          <input type="submit" className="btn btn-primary loginButton" value="Submit"/>
        </form>
      </div>
    );
  }

  async componentDidMount() {
    if (!await window.controller.notLoggedIn()) {
      console.log("Redirecting to chats");
      this.props.history.push("/");
    }
  }
}

export default LoginPage;
