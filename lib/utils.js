/* jshint eqeqeq: false, camelcase: false */

'use strict';

/**
 * Module dependencies.
 */

/**
 * Transform properties to look for.
 */

var styles = [
  {
    transform: 'webkitTransform',
    vendorPrefix: '-webkit-'
  },
  {
    transform: 'MozTransform',
    vendorPrefix: '-moz-'
  },
  {
    transform: 'msTransform',
    vendorPrefix: '-ms-'
  },
  {
    transform: 'OTransform',
    vendorPrefix: '-o-'
  },
  {
    transform: 'transform',
    vendorPrefix: ''
  }
];

var transformCache = null;

/**
 * Calculates browsers transform property.
 */

module.exports.transform = function() {
  var el = document.createElement('p');
  var style;

  if(transformCache) return transformCache;

  for (var i = 0; i < styles.length; i++) {
    style = styles[i].transform;
    if (null !== el.style[style]) {
      transformCache = styles[i];
      return styles[i];
    }
  }
  return false;
};

/**
 * Properties to ignore appending "px".
 */

var ignore = {
  columnCount: true,
  fillOpacity: true,
  fontWeight: true,
  lineHeight: true,
  opacity: true,
  orphans: true,
  widows: true,
  zIndex: true,
  zoom: true
};

/**
 * Set `el` css values at once.
 */

module.exports.css = function(el, obj){
  var styles = '';
  var transform = this.transform();
  for (var key in obj) {
    var val = obj[key];
    // prefix transition property
    if(key === 'transition') {
      styles += key + ':' + this.transition(val) + ';';
    // prefix transform value
    } else if(key === 'transform') {
      styles += transform.vendorPrefix+'transform' + ':' + val + ';';
    } else {
      if ('number' == typeof val && !ignore[key]) val += 'px';
      else if(key === 'zIndex') key = 'z-index';
      styles += key + ':' + val + '; ';
    }
  }
  el.style.cssText = styles;
  return el;
};

/**
 * Creates transition property string with vendor prefixes.
 */

module.exports.transition = function(obj){
  var transform = this.transform();
  var styles = '';
  for (var key in obj) {
    var val = obj[key];
    if(val === 0) continue;
    if ('transform' === key) {
      styles += transform.vendorPrefix + key + ' ' + val + 's,';
    } else {
      styles += key + ' ' + val + 's,';
    }
  }
  styles = styles.slice(0, -1);
  return styles;
};


/**
 * Checks if `value` is an array.
 */

module.exports.isArray = function(value) {
  if(Array.isArray) return Array.isArray(value);
  else {
    var check_class = Object.prototype.toString.call([]);
    return value && typeof value == 'object' && typeof value.length == 'number' &&
        check_class === '[object Array]' || false;
  }
};
