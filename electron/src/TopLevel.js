import {Component} from "react";
import {withRouter} from "react-router-dom";

class TopLevel extends Component {
  constructor(props) {
    super(props);
    this.handleForceUpgrade = this.handleForceUpgrade.bind(this);
  }

  render() {
    return null;
  }

  async handleForceUpgrade() {
    if (this.props.location.pathname !== "/force_upgrade") {
      this.props.history.push("/force_upgrade");
    }
  }
  async componentDidMount() {
    window.addEventListener("force_upgrade", this.handleForceUpgrade);
  }
}

export default withRouter(TopLevel);
