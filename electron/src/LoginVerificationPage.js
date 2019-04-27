import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import * as qs from 'qs';

class LoginVerificationPage extends Component {
  constructor(props) {
    super(props);
    this.state = {email: '', code: '', errorMessage: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.sendVerificationCode = this.sendVerificationCode.bind(this);
  }

  async handleChange(event) {
    if (event.target.name === 'code') {
      this.setState({code: event.target.value});
    }
  }

  async sendVerificationCode(event) {
    const sendCodeResp = await window.controller.sendVerificationCode(this.state.email);
    console.log(sendCodeResp);
  }

  async handleSubmit(event) {
    event.preventDefault();
    const loginResp = await window.controller.login(this.state.email, this.state.code);

    if (loginResp.error) {
      this.setState({errorMessage: loginResp.error.message});
    } else {
      this.setState({verification: ''});
      console.log('Reloading page');
      window.location.reload();
    }
  }

  render() {
    return (
      <div>
        <Link to={`/login`}>{'< Back'}</Link>
        <h2>Verification Page</h2>
        {(this.state.errorMessage !== '') &&
            <div className="alert alert-warning" role="alert">
              {this.state.errorMessage}
            </div>
        }
        <form onSubmit={this.handleSubmit}>
          <label><b>Email</b></label>
          <input type="text" name="email" value={this.state.email} disabled/>
          <br/>
          <label><b>Verification Code</b></label>
          <input type="text" placeholder="Enter Code" name="code" onChange={this.handleChange} required/>
          <br/>
          <input type="submit" className="btn btn-primary" value="Submit" />
        </form>
        <br/>
        <button onClick={this.sendVerificationCode} className="btn btn-info">Resend Code</button>
      </div>
    );
  }

  async componentDidMount() {
    const queryParams = qs.parse(this.props.location.search, {ignoreQueryPrefix: true});
    this.setState({email: queryParams.email});

    if (!await window.controller.notLoggedIn()) {
      console.log('Redirecting to chats');
      this.props.history.push(`/`);
    }
  }
}

export default LoginVerificationPage;
