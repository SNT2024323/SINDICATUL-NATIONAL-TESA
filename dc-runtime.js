/* Mic motor de afisare pentru pagina Sindicatului National TESA.
   Citeste sablonul din <template id="tpl"> si il afiseaza cu Preact. */
(function () {
  var h = preact.h;
  window.DCLogic = preact.Component;

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var EVENTS = { onclick: 'onClick', onsubmit: 'onSubmit', onchange: 'onChange', oninput: 'onInput' };

  function lookup(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return parseFloat(path);
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }

  function resolve(str, scope) {
    var whole = str.match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/);
    if (whole) return lookup(whole[1], scope);
    return str.replace(HOLE, function (_, p) { var v = lookup(p, scope); return v == null ? '' : String(v); });
  }

  function children(node, scope) {
    var out = [];
    for (var c = node.firstChild; c; c = c.nextSibling) {
      var r = build(c, scope);
      if (r == null) continue;
      if (Array.isArray(r)) out.push.apply(out, r); else out.push(r);
    }
    return out;
  }

  function build(node, scope) {
    if (node.nodeType === 3) {
      var t = node.nodeValue;
      return t.indexOf('{{') === -1 ? t : resolve(t, scope);
    }
    if (node.nodeType !== 1) return null;
    var tag = node.localName;
    if (tag === 'sc-if') {
      return lookup(node.getAttribute('value').replace(/[{}]/g, ''), scope) ? children(node, scope) : null;
    }
    if (tag === 'sc-for') {
      var list = lookup(node.getAttribute('list').replace(/[{}]/g, ''), scope) || [];
      var as = node.getAttribute('as') || 'item';
      var res = [];
      list.forEach(function (item, i) {
        var s = Object.create(scope); s[as] = item; s.$index = i;
        res.push.apply(res, children(node, s));
      });
      return res;
    }
    var props = {};
    var isText = tag === 'input' && /^(text|search|number|email|tel)?$/.test((node.getAttribute('type') || '').toLowerCase());
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i], name = a.name;
      if (name.indexOf('hint-') === 0) continue;
      var val = a.value.indexOf('{{') === -1 ? a.value : resolve(a.value, scope);
      if (EVENTS[name]) {
        name = EVENTS[name];
        if (name === 'onChange' && isText) name = 'onInput';
      }
      props[name] = val;
    }
    var kids = children(tag === 'template' ? node.content : node, scope);
    return h.apply(null, [tag, props].concat(kids));
  }

  window.mountDC = function (Component, defaults) {
    var tpl = document.getElementById('tpl').content;
    var root = tpl.firstElementChild;
    Component.prototype.render = function () {
      return build(root, this.renderVals());
    };
    preact.render(h(Component, defaults || {}), document.getElementById('app'));
  };
})();
