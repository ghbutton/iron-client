import './SettingsPage.css';
import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import MenuFooter from './MenuFooter';
import BlankHeader from './BlankHeader';

class SettingsPage extends Component {
  state = {loggedIn: false, currentUser: null};

  render() {
    return (
      <div className="SettingsPage">
        <BlankHeader/>
        <div className="container">
          <h1>Settings</h1>
          { !this.state.loggedIn && <Link to="/login">Login</Link> }
          { this.state.currentUser &&
            <div>
              <p>Name: {this.state.currentUser.attributes.name}</p>
              <p>Email: {this.state.currentUser.attributes.email}</p>
              <Link className="btn btn-primary"  to={`/user_edit`}>{"Edit"}</Link>
            </div>
          }
        </div>
        <MenuFooter/>
      </div>
    );
  }

  async componentDidMount(){
    const loggedIn = !(await window.controller.notLoggedIn());
    const currentUser = await window.controller.currentUser();

    this.setState({loggedIn: loggedIn, currentUser: currentUser});
  }
}

export default SettingsPage;
