import React, {Component} from "react";
import "./App.css";
import ChatsPage from "./ChatsPage";
import ForceUpgradePage from "./ForceUpgradePage";
import InvitationPage from "./InvitationPage";
import LoadingPage from "./LoadingPage";
import MessagesPage from "./MessagesPage";
import LoginPage from "./LoginPage";
import LoginVerificationPage from "./LoginVerificationPage";
import SettingsPage from "./SettingsPage";
import NewChatPage from "./NewChatPage";
import TopLevel from "./TopLevel";
import UserEditPage from "./UserEditPage";
import UserEditWizardPage from "./UserEditWizardPage";
import {HashRouter as Router, Route} from "react-router-dom";

class App extends Component {
  render() {
    return (
      <Router className="App">
        <div>
          <TopLevel/>
          <Route path="/chats" component={ChatsPage} />
          <Route path="/connections/:id/messages" component={MessagesPage} />
          <Route path="/force_upgrade" component={ForceUpgradePage} />
          <Route path="/invitation/:email" component={InvitationPage} />
          <Route path="/loading" component={LoadingPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/login_verification" component={LoginVerificationPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/new_chat" component={NewChatPage} />
          <Route path="/user_edit" component={UserEditPage} />
          <Route path="/user_edit_wizard" component={UserEditWizardPage} />
        </div>
      </Router>
    );
  }
}

export default App;
