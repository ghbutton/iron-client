import './SettingsPage.css';
import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import MenuFooter from './MenuFooter';
import BlankHeader from './BlankHeader';

class SettingsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {currentUser: null, deviceId: null, devices: [], loggedIn: true};

    this.clearData = this.clearData.bind(this);
    this.updateDownloadDirectory = this.updateDownloadDirectory.bind(this);
  }

  async clearData() {
    if (window.confirm('Are you sure you want to wipe all data from this device?')) {
      await window.controller.clearData();
      // TODO have a central place for routes;
      this.props.history.push(`/login`);
    }
  }

  async updateDownloadDirectory() {
    await window.controller.updateDownloadDirectory();
    const downloadDirectory = await window.controller.downloadDirectory();

    this.setState({downloadDirectory});
  }

  render() {
    const {currentUser, deviceId, devices, downloadDirectory, loggedIn} = this.state;

    return (
      <div className="SettingsPage">
        <BlankHeader/>
        <div className="container">
          <h1>Settings</h1>
          <hr/>
            <h2>Personal</h2>
            { currentUser &&
              <div>
                <p>Name: {currentUser.attributes.name}</p>
                <p>Email: {currentUser.attributes.email}</p>
                <Link className="btn btn-primary" to={`/user_edit`}>{'Edit'}</Link>
              </div>
            }
            {
              loggedIn &&
                <div>
                  <h2 className="sectionHeader">Download directory</h2>
                  <p>Path: {downloadDirectory}</p>
                  <button className="btn btn-primary" onClick={this.updateDownloadDirectory}>{'Update'}</button>
                </div>
            }
          <h2 className="sectionHeader">Devices</h2>
          <ul>
            {
              devices.map((device) => (
                <li key={device.id}>{window.view.deviceDisplay(device, deviceId)}</li>
              ))
            }
          </ul>
          <h2 className="sectionHeader">Private Data</h2>
          <button className="btn btn-danger" onClick={this.clearData}>{'Clear data'}</button>
        </div>
        <MenuFooter/>
      </div>
    );
  }

  async componentDidMount() {
    const loggedIn = !(await window.controller.notLoggedIn());

    const currentUser = await window.controller.currentUser();
    const devices = await window.controller.getDevices();
    const deviceId = await window.controller.getDeviceId();
    const downloadDirectory = await window.controller.downloadDirectory();

    this.setState({currentUser, devices, deviceId, downloadDirectory, loggedIn});
  }
}

export default SettingsPage;
