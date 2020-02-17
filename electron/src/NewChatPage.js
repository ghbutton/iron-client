import React, {Component} from "react";
import {Link} from "react-router-dom";

class NewChatPage extends Component {
  constructor(props) {
    super(props);
    this.state = {search: "", results: [], resultsReady: false};

    this.handleChange = this.handleChange.bind(this);
  }

  async handleChange(event) {
    const searchString = event.target.value;
    this.setState({search: searchString});
    if (searchString.length > 3) {
      const users = await window.controller.connectedUsersSearch(searchString);
      this.setState({results: users, resultsReady: true});
    } else {
      this.setState({results: [], resultsReady: false});
    }
  }

  render() {
    return (
      <div className="newChatPage container">
        <Link className="btn btn-outline-primary" to={"/chats"}>{"< Back"}</Link>
        <h1>New Chat</h1>

        <div>
          <Link to={"/new_contact"}>{"+ New Contact"}</Link>
        </div>
        <br/>

        <form onSubmit={this.handleSubmit}>
          <input type="text" placeholder="Current contacts" name="email" onChange={this.handleChange} required/>
        </form>

        {
          this.state.resultsReady ? (
            this.state.results.length > 0 ? (
              <ul>
                {
                  this.state.results.map((user) => {
                    return (<li key={user.id}><Link to={`/connections/${user.id}/messages`}>{window.view.userDisplay(user)}</Link></li>);
                  })
                }
              </ul>
            ) : (
              <h5>No results</h5>
            )
          ) : (
            null
          )
        }
      </div>
    );
  }
}

export default NewChatPage;
