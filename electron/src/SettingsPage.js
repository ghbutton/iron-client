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
          <section>
            <h2>Attributes</h2>
            { !loggedIn && <Link to="/login">Login</Link> }
            { currentUser &&
              <div>
                <p>Name: {currentUser.attributes.name}</p>
                <p>Email: {currentUser.attributes.email}</p>
                <Link className="btn btn-primary" to={`/user_edit`}>{'Edit'}</Link>
              </div>
            }
          </section>
          <section>
            {
              loggedIn &&
                <div>
                  <p>Download directory: {downloadDirectory}</p>
                  <button className="btn btn-primary" onClick={this.updateDownloadDirectory}>{'Update'}</button>
                </div>
            }
          </section>
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
        <section>
          <h2>Private Data</h2>
          <button className="btn btn-danger" onClick={this.clearData}>{'Clear data'}</button>
        </section>
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
