
'use strict';

/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var clone = require('clone');
var EntryFactory = require('./entryfactory');

/**
 * Initialize Model.
 */

function Model(attributes) {
  if (!(this instanceof Model)) return new Model(attributes);
  this.attributes = {};
  if (attributes) this.set(attributes);
}

/**
 * Mixin emitter.
 */

Emitter(Model.prototype);

/**
 * Expose Model.
 */

module.exports = Model;

/**
 * Set attributes.
 */

Model.prototype.set = function(attr, options){
  options = options || {};
  var changed = false;
  var changedAttributes = {};
  if (!attr) return;
  this.previousAttributes = clone(this.attributes);

  for (var key in attr) {
    if (attr.hasOwnProperty(key)) {
      this.attributes[key] = attr[key];
      if (this.attributes[key] !== this.previousAttributes[key]){
        changedAttributes[key] = this.attributes[key];
        changed = true;
      }
    }
  }
  if (changed && !options.silent) this.emit('change:attribute', changedAttributes);
  return this;
};

/**
 * Get attribute.
 */

Model.prototype.get = function(key){
  return this.attributes[key];
};
