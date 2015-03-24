
'use strict';

/**
 * Module dependencies.
 */

var bind = require('bind');
var has3d = require('has-translate3d');
var utils = require('./utils');
var fastdom = require('fastdom');
var inherit = require('inherit');
var object = require('object');
var Model = require('./model');
var template = require('block');
var domify = require('domify');
var events = require('event');

/**
 * Expose Factory.
 */

exports = module.exports = EntryFactory;

/**
 * Expose Entry
 */

exports.Entry = Entry;

/**
 * Expose Block
 */

exports.Block = Block;

/**
 * Expose Item
 */

exports.Item = Item;

/**
 * Expose Container
 */

exports.Container = Container;

/**
 * Base Entry.
 */

function Entry() {}

/**
 * Base Entry render function.
 */

Entry.prototype.render = function(changedAttributes) {
  var properties = {
    position: 'absolute',
    top: this.model.get('top'),
    left: this.model.get('left'),
    bottom: this.model.get('bottom'),
    //width: this.model.get('width'),
    //height: this.model.get('height'),
    opacity: this.model.get('opacity') || 0,
    zIndex: this.model.get('zIndex') || 0,
    transition: this.model.get('transition')
  };
  object.merge(properties, changedAttributes);

  var position = this.context.origin;
  /*
  if(position === 'bottom' && (properties.top || properties.left)) {
    var left = properties.left || this.model.get('left');
    var top = properties.top || this.model.get('top');
    var transform = utils.transform();
    if(transform) {
      if(has3d) {
        properties['transform'] = 'translate3d(' + left + 'px,' + top + 'px, 0)';
      } else {
        properties['transform'] = 'translate(' + left + 'px,' + top + 'px)';
      }
      // we have translate so no need for absolute top left positioning.
      delete properties.top;
      delete properties.left;
    }
  } else if(position === 'top') {
    delete properties.top;
  }
  */
  if(position === 'top') {
    delete properties.top;
  }
  utils.css(this.el, properties);
  if(this.view) this.context.adapter.emit(this.view, 'viewRendered');
  return this;
};

/**
 * Item Constructor.
 */

function Item(options) {
  this.context = options.context;
  this.model = options.model;
  this.view = options.view;
  this.el = this.context.adapter.get(options.view, 'el');
  this.el.style.opacity = 0;
  this.el.style.position = 'absolute';
  this.model.on('change:attribute', bind(this, this.render));
}

inherit(Item, Entry);

/**
 * Block Constructor.
 */

function Block(options) {
  this.context = options.context;
  this.model = options.model;
  this.el = domify(template(options.html).render(options.attr.data));
  this.el.style.opacity = 0;
  this.el.style.position = 'absolute';
  this.model.on('change:attribute', bind(this, this.render));
}

inherit(Block, Entry);

/**
 * Container Constructor.
 */

function Container(options) {
  this.context = options.context;
  this.model = options.model;
  this.view = options.view;
  this.attr = options.attr;
  this.html = options.html;
  this.subViews = options.subViews;
  this.el = this.context.adapter.get(options.view, 'el');
  this.el.style.opacity = 0;
  this.el.style.position = 'absolute';
  this.model.on('change:attribute', bind(this, this.render));
  this.context.adapter.subscribe(options.view, 'expand', bind(this, this.expandSubViews));
  this.context.adapter.subscribe(options.view, 'close', bind(this, this.closeSubViews));
}

inherit(Container, Entry);

Container.prototype.expandSubViews = function(subViews) {
  this.subViews = this.subViews || subViews;
  if(!utils.isArray(this.subViews)) {
    this.subViews = [this.subViews];
  }
  if(this.model.get('expanded'))  return;
  this.model.set({expanded: true}, {silent: true});
  if(!this.subViewEntries) {
    this.subViewEntries = [];
    var factory = new EntryFactory();
    var model;

    model = new Model().set({operation: 'insert'});
    var blockEntryUp = factory.create({
      context: this.context,
      entryType: 'block',
      model: model,
      html: this.html,
      attr: this.attr
    });
    model.entry = blockEntryUp;

    model = new Model().set({operation: 'insert'});
    var blockEntryDown = factory.create({
      context: this.context,
      entryType: 'block',
      model: model,
      html: this.context.blockTemplates.close,
      attr: this.attr
    });
    events.bind(blockEntryDown.el, 'click', bind(this, this.closeSubViews));

    this.subViewEntries.push(this.context.origin === 'top' ? blockEntryDown : blockEntryUp);
    for (var i = 0; i < this.subViews.length; i++) {
      model = new Model().set({operation: 'insert'});
      var entry = factory.create({
        context: this.context,
        entryType: 'item',
        model: model,
        view: this.subViews[i]
      });
      this.subViewEntries.push(entry);
    }
    this.subViewEntries.push(this.context.origin === 'top' ? blockEntryUp : blockEntryDown);

  }
  var index = this.context.collection.indexOf(this);
  this.context.insert(this.subViewEntries, index).compose().draw();
};

Container.prototype.closeSubViews = function() {
  if(this.model.get('expanded')) {
    this.model.set({expanded: false}, {silent: true});
    for (var i = 0; i < this.subViewEntries.length; i++) {
      this.subViewEntries[i].model.set({opacity: 0, zIndex: 0});
    }

    var index = this.context.collection.indexOf(this);
    this.context.collection.removeAt(this.subViewEntries.length, index+1);
    this.context.draw();
    // emit closed on this.view !!!
  }
};

/**
 * EntryFactory Constructor.
 */

function EntryFactory() {
  if (!(this instanceof EntryFactory)) return new EntryFactory();
}

/*
 * Default entryClass is Item.
 */


EntryFactory.prototype.entryClass = Item;

/**
 * Factory method for creating new Entry instances
 */

EntryFactory.prototype.create = function(options) {
  if(options.entryType === 'item') {
    this.entryClass = Item;
  }

  if(options.entryType === 'block') {
    this.entryClass = Block;
  }

  if(options.entryType === 'container') {
    this.entryClass = Container;
  }

  return new this.entryClass(options);
};
