import React, {Component} from "react";
import "./App.css";
import ChatsPage from "./ChatsPage";
import ForceUpgradePage from "./ForceUpgradePage";
import LoadingPage from "./LoadingPage";
import MessagesPage from "./MessagesPage";
import LoginPage from "./LoginPage";
import LoginVerificationPage from "./LoginVerificationPage";
import SettingsPage from "./SettingsPage";
import NewChatPage from "./NewChatPage";
import NewContactPage from "./NewContactPage";
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
          <Route path="/loading" component={LoadingPage} />
          <Route path="/chats" component={ChatsPage} />
          <Route path="/connections/:id/messages" component={MessagesPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/login_verification" component={LoginVerificationPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/new_chat" component={NewChatPage} />
          <Route path="/new_contact" component={NewContactPage} />
          <Route path="/user_edit" component={UserEditPage} />
          <Route path="/user_edit_wizard" component={UserEditWizardPage} />
          <Route path="/force_upgrade" component={ForceUpgradePage} />
        </div>
      </Router>
    );
  }
}

export default App;
