let view = (function() {
  return {
    userDisplay: function(user) {
      let name = user.attributes.name;

      if (name === null || name === "") {
        return user.attributes.email;
      } else {
        return name
      }
    }
  }
})()

export default view;
