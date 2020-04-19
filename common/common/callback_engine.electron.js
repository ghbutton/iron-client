const app = window.app;

const engine = (function() {
  return {
    updateNumUnread: function(numUnread) {
      // The doc badge represents the number of unread
      if (numUnread === 0) {
        app.dock.setBadge("");
      } else {
        app.dock.setBadge(`${numUnread}`);
      }
    },
    dispatch: function(name, opts) {
      const event = new CustomEvent(name, opts);

      // Dispatch the event.
      window.dispatchEvent(event);
    },
  };
})();

export default engine;
