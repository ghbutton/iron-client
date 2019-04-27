import React, {Component} from 'react';
import * as qs from 'qs';

class LoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = {email: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleChange(event) {
    this.setState({email: event.target.value});
  }

  async handleSubmit(event) {
    event.preventDefault();
    await window.controller.sendVerificationCode(this.state.email);
    const query = {email: this.state.email};
    const searchString = qs.stringify(query);

    this.props.history.push({pathname: `/login_verification`, search: searchString});
  }

  render() {
    return (
      <div>
        <h2>Login Page</h2>
        <form action="/#/login_verification" method="get" onSubmit={this.handleSubmit}>
          <label><b>Email</b></label>
          <input type="text" placeholder="Email" name="email" onChange={this.handleChange} required/>
          <br/>
          <br/>
          <input type="submit" className="btn btn-primary" value="Submit" />
        </form>
      </div>
    );
  }

  async componentDidMount() {
    if (!await window.controller.notLoggedIn()) {
      console.log('Redirecting to chats');
      this.props.history.push(`/`);
    }
  }
}

export default LoginPage;
