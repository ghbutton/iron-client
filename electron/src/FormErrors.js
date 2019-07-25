import React from "react";

function FormErrors(props) {
  const {message} = props;
  if (message === "" || message === null) {
    return null;
  } else {
    return (
      // TODO: make dismissable?
      <div className="alert alert-warning fade show" role="alert">
        {message}
      </div>
    );
  }
}

export default FormErrors;
