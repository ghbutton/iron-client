import React, {Component} from "react";

import BlankHeader from "./BlankHeader";

class ForceUpgradePage extends Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  async onClick() {
    window.controller.openExternal("https://www.ironnotice.com/app");
  }

  render() {
    return (
      <div className="centeredContainer container">
        <BlankHeader/>
        <h2>Upgrade Required</h2>
        <img src="/static/icon.png" height="100px" width="100px" alt=""/>
        <p>Sorry but an upgrade is required to use Iron Notice.</p>
        <p>Either a API changed or there was an important security update.</p>
        <p>Either way please visit website to get the latest version.</p>
        <p><button type="button" className="btn btn-primary" onClick={this.onClick}>Update</button></p>
      </div>
    );
  }
}

export default ForceUpgradePage;
