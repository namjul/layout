
'use strict';

/**
 * Default subscription method.
 * Subscribe to changes on the view.
 *
 * @param {Object} obj
 * @param {String} prop
 * @param {Function} fn
 */

exports.subscribe = function(obj, prop, fn) {
  if (!obj.on) return;
  obj.on(prop, fn);
};

/**
 * Default unsubscription method.
 * Unsubscribe from changes on the model.
 */

exports.unsubscribe = function(obj, prop, fn) {
  if (!obj.off) return;
  obj.off(prop, fn);
};

/**
 * Default emit method.
 * Emits an event on the view.
 */

exports.emit = function(obj, event, attr) {
  if (!obj.emit) return;
  obj.emit(event, attr);
};

/**
 * Default setter method.
 * Set a property on the model.
 *
 * @param {Object} obj
 * @param {String} prop
 * @param {Mixed} val
 */

exports.set = function(obj, prop, val) {
  if ('function' === typeof obj[prop]) {
    obj[prop](val);
  }
  else if ('function' === typeof obj.set) {
    obj.set(prop, val);
  }
  else {
    obj[prop] = val;
  }
};

/**
 * Default getter method.
 * Get a property from the model.
 *
 * @param {Object} obj
 * @param {String} prop
 * @return {Mixed}
 */

exports.get = function(obj, prop) {
  if ('function' === typeof obj[prop]) {
    return obj[prop]();
  }
  else if ('function' === typeof obj.get) {
    return obj.get(prop);
  }
  else {
    return obj[prop];
  }
};
