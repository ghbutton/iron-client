const engine = (function() {
  return {
    dispatch: function(name, opts) {
      const event = new CustomEvent(name, opts);

      // Dispatch the event.
      window.dispatchEvent(event);
    }
  }
})();

export default engine;
