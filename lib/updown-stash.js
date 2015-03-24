
'use strict';

/**
 * Module dependencies.
 */

var utils = require('./utils');
var Emitter = require('emitter');

/**
 * Initialize Stash.
 */
function UpDownStash(){
  if (!(this instanceof UpDownStash)) return new UpDownStash();
  this.stash = [];
  this.marker = 0;
}

/**
 * Expose UpDownStash.
 */

module.exports = UpDownStash;

/**
 * Mixin emitter.
 */

Emitter(UpDownStash.prototype);

/**
 * Append objects.
 *
 * @param {Object} obj.
 * @return {number} Index of the obj.
 */

UpDownStash.prototype.append = function(obj) {
  this.stash.push(obj);
  return this.stash.length - 1;
};

/**
 * Iterates through the stash.
 * sets marker.
 */

UpDownStash.prototype.forEach = function(fn, options){
  options = options || {};
  for (var j = (options.all ? 0 : this.marker), len = this.stash.length; j < len; j++) {
    fn(this.stash[j], j);
  }

  if(!options.keep && this.stash.length > 1) {
    this.marker = this.stash.length - 1;
  }
};

/**
 * Insert obj at index.
 */

UpDownStash.prototype.insertAt = function(obj, index) {
  if(!utils.isArray(obj)) {
    obj = [obj];
  }
  this.stash.splice.apply(this.stash, [index, 0].concat(obj));
  this.marker = index-1;
};

/**
 * Removes given amount of objs from given index.
 */

UpDownStash.prototype.removeAt = function(amount, index) {
  this.stash.splice.apply(this.stash, [index, amount]);
  this.marker = index-1;
};

/**
 * Determine the indexof obj or return -1.
 */

UpDownStash.prototype.indexOf = function(obj) {
  for (var i = 0; i < this.stash.length; i++) {
    if(this.stash[i] === obj) return i;
  }
  return -1;
};

/**
 * Clears ths stash.
 */

UpDownStash.prototype.clear = function(){
  this.stash = [];
  this.marker = 0;
  return this;
};
