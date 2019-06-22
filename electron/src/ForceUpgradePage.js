import React, {Component} from 'react';

class ForceUpgradePage extends Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  async onClick() {
    window.controller.openExternal('https://www.ironnotice.com/app');
  }

  render() {
    return (
      <div>
        <div className="container">
          <h2>Force Upgrade</h2>
          <p>Sorry but we require a force upgrade.
            Either a API changed or there was an important security update.
            Either way please visit website for an update. <button type="button" className="btn btn-primary" onClick={this.onClick}>Update</button>
          </p>
        </div>
      </div>
    );
  }
}

export default ForceUpgradePage;
