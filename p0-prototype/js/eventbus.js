/* ============================================================
 *  洪荒剑仙 P0 — 事件总线
 *  全局发布/订阅，解耦系统间通信
 * ============================================================ */

var Bus = (function () {
  var channels = {};

  function on(event, handler) {
    if (!channels[event]) channels[event] = [];
    channels[event].push(handler);
    return this;
  }

  function off(event, handler) {
    if (!channels[event]) return this;
    channels[event] = channels[event].filter(function (h) { return h !== handler; });
    return this;
  }

  function emit(event, data) {
    if (!channels[event]) return this;
    var args = Array.prototype.slice.call(arguments, 1);
    channels[event].forEach(function (h) {
      try { h.apply(null, args); } catch (e) { console.error('[Bus] handler error:', event, e); }
    });
    return this;
  }

  return { on: on, off: off, emit: emit };
})();
