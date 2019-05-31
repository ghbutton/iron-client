import React, { Component } from 'react';
import { Link } from 'react-router-dom'

class UserEditPage extends Component {
  state = {currentUser: null, name: "", email: ""};

  handleSubmit = async (event) => {
    event.preventDefault();
    const {status}= await window.controller.updateUser({name: this.state.name})

    if (status === "ok") {
      this.props.history.push(`/settings`)
    }
  }

  handleChange = async (event) => {
    if (event.target.name === "name") {
      this.setState({name: event.target.value})
    }
  }

  render() {
    return (
      <div className="userEditPage">
        <Link className="btn btn-outline-primary" to={`/settings`}>{"< Back"}</Link>
        <h1>User edit</h1>
        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <input type="text" value={this.state.name} placeholder="Full name" name="name" onChange={this.handleChange} required/>
          </div>

          <div className="form-group">
            <input type="text" name="email" value={this.state.email} disabled/>
          </div>

          <input type="submit" className="btn btn-primary" value="Submit" />
        </form>
      </div>
    );
  }

  async componentDidMount(){
    const currentUser = await window.controller.currentUser();

    this.setState({currentUser: currentUser, name: currentUser.attributes.name || "", email: currentUser.attributes.email});
  }
}

export default UserEditPage;
