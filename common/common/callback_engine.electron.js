const app = window.app;

const engine = (function() {
  return {
    dispatch: function(name, opts) {
      const event = new CustomEvent(name, opts);

      // Dispatch the event.
      window.dispatchEvent(event);
    },
    updateNumUnread: function(numUnread) {
      // The doc badge represents the number of unread
      if (numUnread === 0) {
        app.dock.setBadge("");
      } else {
        app.dock.setBadge(`${numUnread}`);
      }
    },
    updateNumUnreceived: function(numUnreceived) {
      // do nothing, we dont use unreceived here
    },
  };
})();

export default engine;
