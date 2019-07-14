import React, {Component} from 'react';
import {Link} from 'react-router-dom';

class NewContactPage extends Component {
  constructor(props) {
    super(props);
    this.state = {email: '', name: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleChange(event) {
    if (event.target.name === 'name') {
      this.setState({name: event.target.value});
    } else if (event.target.name === 'email') {
      this.setState({email: event.target.value});
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const {status} = await window.controller.createNewInvitation(this.state.name, this.state.email);

    if (status === "ok") {
      this.props.history.push(`/new_chat`);
    }
  }

  render() {
    return (
      <div className="newContactPage container">
        <Link className="btn btn-outline-primary" to={`/new_chat`}>{'< Back'}</Link>
        <h1>New Contact</h1>

        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <input type="text" placeholder="Full name" name="name" onChange={this.handleChange} required/>
          </div>

          <div className="form-group">
            <input type="email" placeholder="email" name="email" onChange={this.handleChange} required/>
          </div>

          <input type="submit" className="btn btn-primary" value="Submit" />
        </form>
      </div>
    );
  }
}

export default NewContactPage;
