import React from "react";

function UserMessages(props) {
  const {warning, message} = props;
  if (warning !== "" && warning != null) {
    return (
      // TODO: make dismissable?
      <div className="alert alert-warning fade show userMessages" role="alert">
        {warning}
      </div>
    );
  } else if (message !== "" && message != null){
    return (
      <div className="alert alert-primary fade show userMessages" role="alert">
        {message}
      </div>
    );
  } else {
    return null;
  }
}

export default UserMessages;
