import './SettingsPage.css';
import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import MenuFooter from './MenuFooter';
import BlankHeader from './BlankHeader';

class SettingsPage extends Component {
  constructor(props){
    super(props);
    this.state = {currentUser: null, deviceId: null, devices: [], loggedIn: false};

    this.clearData = this.clearData.bind(this);
  }

  async clearData() {
    if (window.confirm("Are you sure you want to wipe all data from this device?")) {
      await window.controller.clearData();
      // TODO have a central place for routes;
      this.props.history.push(`/login`);
    }
  }

  render() {
    const {currentUser, deviceId, devices, loggedIn} = this.state;

    return (
      <div className="SettingsPage">
        <BlankHeader/>
        <h1>Settings</h1>
        <div className="container">
          <h2>Attributes</h2>
          { !loggedIn && <Link to="/login">Login</Link> }
          { currentUser &&
            <div>
              <p>Name: {currentUser.attributes.name}</p>
              <p>Email: {currentUser.attributes.email}</p>
              <Link className="btn btn-primary"  to={`/user_edit`}>{"Edit"}</Link>
            </div>
          }
        </div>
        <div className="container">
          <h2>Devices</h2>
          <ul>
            {
              devices.map((device) => (
                <li key={device.id}>{window.view.deviceDisplay(device, deviceId)}</li>
              ))
            }
          </ul>
        </div>
        <div className="container">
          <h2>Private Data</h2>
          <button className="btn btn-danger" onClick={this.clearData}>{"Clear data"}</button>
        </div>
        <MenuFooter/>
      </div>
    );
  }

  async componentDidMount(){
    const loggedIn = !(await window.controller.notLoggedIn());
    const currentUser = await window.controller.currentUser();
    const devices = await window.controller.getDevices();
    const deviceId = await window.controller.getDeviceId();

    this.setState({loggedIn, currentUser, devices, deviceId});
  }
}

export default SettingsPage;
