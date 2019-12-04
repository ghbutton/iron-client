import React, {useState} from "react";
import {Link} from "react-router-dom";

function UserAvatar({user, className}) {
  return (
    <div>
      { user && user.attributes.avatar_extname === ".jpg" && (
        <img src={`data:image/jpg;base64, ${user.attributes.avatar_binary}`} className={className} />
      )}
      { user && user.attributes.avatar_extname === ".png" && (
        <img src={`data:image/png;base64, ${user.attributes.avatar_binary}`} className={className} />
      )}
    </div>
  );
}

export default UserAvatar;
