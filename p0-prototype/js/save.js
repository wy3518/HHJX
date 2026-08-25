/* ============================================================
 *  洪荒剑仙 P0 - 本地存档
 *  localStorage 序列化，30秒自动保存，版本迁移
 * ============================================================ */

var Save = (function () {

  /* ---- 保存 ---- */
  function save() {
    try {
      var s = State.get();
      s.lastSaveAt = Date.now();
      s.lastOnlineAt = Date.now();
      s.version = CONFIG.SAVE.version;
      localStorage.setItem(CONFIG.SAVE.key, JSON.stringify(s));
      Bus.emit('saveComplete');
      return true;
    } catch (e) {
      console.error('[Save] 保存失败:', e);
      return false;
    }
  }

  /* ---- 加载 ---- */
  function load() {
    try {
      var raw = localStorage.getItem(CONFIG.SAVE.key);
      if (!raw) return null;
      var data = JSON.parse(raw);
      // 版本迁移
      if (!data.version || data.version < CONFIG.SAVE.version) {
        data = migrate(data);
      }
      return data;
    } catch (e) {
      console.error('[Save] 加载失败:', e);
      return null;
    }
  }

  /* ---- 将存档数据覆写进内存 state ---- */
  function restore(data) {
    if (!data || typeof data !== 'object') return false;
    var s = State.get();
    Object.keys(data).forEach(function (k) { s[k] = data[k]; });
    return true;
  }

  function migrate(old) {
    // P0 v1 -> v2：补大地图字段
    if (!old.map) {
      old.map = { areaId: 'qingshi', x: 11, y: 10, routeExitId: null, routes: {}, explored: {} };
    }
    if (!old.map.explored) old.map.explored = { qingshi: { killed: {}, visited: true } };
    if (!old.map.routes) old.map.routes = {};
    old.version = CONFIG.SAVE.version;
    return old;
  }

  /* ---- 导出 Base64 ---- */
  function exportData() {
    var s = State.get();
    var raw = JSON.stringify(s);
    return btoa(unescape(encodeURIComponent(raw)));
  }

  /* ---- 导入 Base64 ---- */
  function importData(b64) {
    try {
      var raw = decodeURIComponent(escape(atob(b64)));
      var data = JSON.parse(raw);
      localStorage.setItem(CONFIG.SAVE.key, JSON.stringify(data));
      restore(data);
      return data;
    } catch (e) {
      console.error('[Save] 导入失败:', e);
      return null;
    }
  }

  /* ---- 删除存档 ---- */
  function clear() {
    localStorage.removeItem(CONFIG.SAVE.key);
  }

  /* ---- 是否有存档 ---- */
  function hasSave() {
    return !!localStorage.getItem(CONFIG.SAVE.key);
  }

  return {
    save: save,
    load: load,
    restore: restore,
    exportData: exportData,
    importData: importData,
    clear: clear,
    hasSave: hasSave
  };
})();
