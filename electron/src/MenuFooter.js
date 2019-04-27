import React, {Component} from 'react';
import './MenuFooter.css';
import {Link} from 'react-router-dom';

class MenuFooter extends Component {
  render() {
    return (
      <footer className="footer">
        <div className="container-fluid">
          <ul id="menu-main-nav" style={{'listStyle': 'none', 'margin': '2px', 'padding': 0, 'display': 'flex', 'justifyContent': 'space-around'}}>
            <li><Link to={'/'} className="btn btn-outline-primary">Chats</Link></li>
            <li><Link to={'/settings'} className="btn btn-outline-primary">Settings</Link></li>
          </ul>
        </div>
      </footer>
    );
  }

  componentDidMount() {
    document.body.classList.toggle('withFooter', true);
  }

  componentWillUnmount() {
    document.body.classList.remove('withFooter');
  }
}

export default MenuFooter;
