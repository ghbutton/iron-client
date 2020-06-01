import "./SettingsPage.css";
import React, {Component} from "react";
import {Link} from "react-router-dom";
import MenuFooter from "./MenuFooter";
import BlankHeader from "./BlankHeader";
import UserAvatar from "./UserAvatar";

class SettingsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {currentUser: null, deviceId: null, devices: [], version: ""};

    this.clearData = this.clearData.bind(this);
  }

  async clearData() {
    if (window.confirm("CAUTION\nThis will delete all messages on this device and sign you out.\nAre you sure?")) {
      await window.controller.clearData();
      // TODO have a central place for routes;
      this.props.history.push("/loading");
    }
  }

  render() {
    const {currentUser, deviceId, devices, downloadDirectory, version} = this.state;

    return (
      <div className="SettingsPage">
        <BlankHeader/>
        <div className="container withFooter">
          <h1>Settings</h1>
          <hr/>
          <h2>Personal</h2>
          { currentUser &&
            <div>
              <UserAvatar user={currentUser}/>
              <p>Name: {currentUser.attributes.name}</p>
              <p>Email: {currentUser.attributes.email}</p>
              <Link className="btn btn-primary" to={"/user_edit"}>{"Edit"}</Link>
            </div>
          }
          {
            currentUser &&
                <div>
                  <h2 className="sectionHeader">Download directory</h2>
                  <p>Path: {downloadDirectory}</p>
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
          <button className="btn btn-danger" onClick={this.clearData}>{"Delete account"}</button>
          <h2 className="sectionHeader">Misc</h2>
          <p>Version: {version}</p>
        </div>
        <MenuFooter/>
      </div>
    );
  }

  async componentDidMount() {
    const currentUser = await window.controller.currentUser();
    const devices = await window.controller.getDevices();
    const deviceId = await window.controller.getDeviceId();
    const downloadDirectory = await window.controller.downloadDirectory();
    const version = await window.controller.getVersion();

    this.setState({currentUser, devices, deviceId, downloadDirectory, version});
  }
}

export default SettingsPage;
