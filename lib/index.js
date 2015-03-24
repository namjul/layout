
'use strict';

/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var EntryFactory = require('./entryfactory');
var Model = require('./model');
var UpDownStash = require('./updown-stash');
var bind = require('bind');
var utils = require('./utils');
var clone = require('clone');
var adapter = require('./adapter');
var getSize = require('get-size');
var classes = require('classes');
var fastdom = require('fastdom');

/**
 * Expose Layout.
 */

exports = module.exports = Layout;

/**
 * Define subscription function.
 */

exports.subscribe = function(fn){
  adapter.subscribe = fn;
};

/**
 * Define unsubscribe function.
 */

exports.unsubscribe = function(fn){
  adapter.unsubscribe = fn;
};

/**
 * Define emit function.
 */

exports.emit = function(fn){
  adapter.emit = fn;
};

/**
 * Define a get function.
 */

exports.get = function(fn) {
  adapter.get = fn;
};

/**
 * Define a set function.
 */

exports.set = function(fn) {
  adapter.set = fn;
};

/**
 * Expose adapter
 */

exports.adapter = adapter;

/**
 * Default options
 */

var defaultOptions = {
  columnWidth: 275,
  gutter: 20,
  origin: 'bottom',
  expandSpace: 50,
  blockTemplates: {
    title: '<div>{{title}}</div>',
    close: '<button type="button">{{close}}</button>'
  }
};

/**
 * Initialize a Layout
 */

function Layout(options) {
  if (!(this instanceof Layout)) return new Layout(options);
  this.collection = new UpDownStash();
  this.adapter = exports.adapter;
  this.containerHeight = 0;

  // Options
  options = options || {};
  for (var def in defaultOptions) {
    if (defaultOptions.hasOwnProperty(def) && !options[def]) {
      options[def] = defaultOptions[def];
    }
  }
  this.setOptions(options);
}

/**
 * Mixin emitter.
 */

Emitter(Layout.prototype);

/**
 * Insert views.
 */

Layout.prototype.insert = function(views, index) {
  if(!utils.isArray(views)) {
    views = [views];
  }
  var factory = new EntryFactory();
  var entries = [];
  for(var i = 0, len = views.length; i < len; i++) {
    if(views[i] instanceof EntryFactory.Entry) {
      entries.push(views[i]);
    } else {
      var model = new Model().set({operation: 'insert'});
      var entry = factory.create({
        context: this,
        entryType: 'item',
        model: model,
        view: views[i]
      });
      entries.push(entry);
    }
  }
  this.collection.insertAt(entries, index+1);

  return this;
};


/**
 * Append views.
 */

Layout.prototype.append = function(views) {
  if(!utils.isArray(views)) {
    views = [views];
  }
  var factory = new EntryFactory();
  for(var i = 0, len = views.length; i < len; i++) {
    var model = new Model().set({operation: 'append'});
    var entry = factory.create({
      context: this,
      entryType: 'item',
      model: model,
      view: views[i]
    });
    this.collection.append(entry);
  }

  return this;
};

/**
 * Append Container.
 */

Layout.prototype.appendContainer = function(view, subViews, attr) {
  var factory = new EntryFactory();
  var html = this.blockTemplates[attr.template || 'title'];
  var model = new Model().set({operation: 'append', expanded: false});
  var entry = factory.create({
    context: this,
    entryType: 'container',
    model: model,
    view: view,
    subViews: subViews,
    attr: attr,
    html: html
  });
  this.collection.append(entry);

  return this;
};

/**
 * Append Block.
 */

Layout.prototype.appendBlock = function(attr) {
  var factory = new EntryFactory();
  var html = this.blockTemplates[attr.template || 'title'];
  if(!html) throw new Error('You need to supply a template');
  var model = new Model().set({operation: 'append'});
  var entry = factory.create({
    context: this,
    entryType: 'block',
    model: model,
    attr: attr,
    html: html
  });
  this.collection.append(entry);

  return this;
};

/**
 * Compose fragment from last added items, adds to Dom
 * and calculates item dimension.
 */

Layout.prototype.compose = function(draw) {

  if(!this.containerView) {
    this.containerView = new ContainerView(this);
    if(this.origin === 'top') {
      this.container.insertBefore(this.containerView.el, this.container.childNodes[0]);
    }
    else {
      this.container.appendChild(this.containerView.el);
    }
  }

  var frag = document.createDocumentFragment();
  this.collection.forEach(function(entry) {
    if(!entry.model.get('dom')) {
      frag.appendChild(entry.el);
      entry.model.set({dom: true}, {silent: true});
      if(entry.view) entry.context.adapter.emit(entry.view, 'viewCreated');
    }
  }, {keep: true});

  this.containerView.el.appendChild(frag);

  var self = this;
  fastdom.clear(this.readDimension);
  this.readDimension = fastdom.read(bind(this, function() {
    this.collection.forEach(function(entry) {

      var width = 0;
      var height = 0;
      if(entry.el.getAttribute('data-dimension')) {
        width = entry.el.getAttribute('data-dimension').split(',')[0];
        height = entry.el.getAttribute('data-dimension').split(',')[1];
      } else {
        width = entry.model.get('width') || getSize(entry.el).width || self.columnWidth;
        height = entry.model.get('height') || getSize(entry.el).height;
      }

      entry.model.set({
        width: width,
        height: height
      }, {silent: true});

    }, {keep: true});
  }));

  if(draw) this.draw();

  return this;
};

/**
 * Calculate items position using center algorythm
 */

Layout.prototype.draw = function(options) {
  if (options) this.setOptions(options);

  var ww = this.containerWidth; // wrapperWidth
  var g = this.gutter;
  var cw = this.columnWidth;

  var epr = Math.floor(ww/(cw + g)); // entries-per-row (columns)
  var mx = (ww - (epr * cw) - (epr - 1) * g) * 0.5; // half of containerWidth minus contentWidth(entryWidths + paddingWidths)

  var windowOffset;
  fastdom.clear(this.readOffset);
  this.readOffset = fastdom.read(function() {
    windowOffset = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
  });
  var heights = [];
  var embeddedEntries = 0;
  var heightDiffs = [];
  var self = this;

  // heights witdh start values
  while(heights.length < epr) {
    if(self.origin === 'top') heights.push(0);
    else heights.push(g);
  }

  fastdom.clear(this.writePosition);
  this.writePosition = fastdom.write(bind(this, function() {
    this.collection.forEach(function(entry, index) {

      var w = entry.model.get('width');
      var h = entry.model.get('height');
      var expanded = entry.model.get('expanded');
      var hasPosition = entry.hasPosition;
      var i, j, k;
      var maxColHeight;

      if(embeddedEntries === 0 && heightDiffs.length !== 0) {
        maxColHeight = Math.max.apply(Math, heights);
        for (i = 0; i < heights.length; i++) {
          heights[i] = maxColHeight + heightDiffs[i] + entry.context.expandSpace;
        }
        heightDiffs = [];
      } else if(embeddedEntries > 0) {
        embeddedEntries--;
      }

      // calculate how many columns the entry needs
      var colUsage = Math.ceil((w+g)/(cw+g));
      colUsage = Math.min(Math.max(parseInt(epr), 1), colUsage);
      if(entry instanceof EntryFactory.Block) colUsage = epr;
      var loopAmount  = Math.abs(colUsage - epr) + 1;

      var calcHeights = [];
      if(colUsage > 1) {
        for(j = 0; j < loopAmount; j++) {
          k = 0;
          var biggest = null;
          while(k < colUsage) {
            if(biggest === null || heights[j+k] > biggest) {
              biggest = heights[j+k];
            }
            k++;
          }
          calcHeights.push(biggest);
        }
      } else {
        calcHeights = heights;
      }

      // calculate column and top value
      var top = null;
      var column = 0;
      for(i = 0; i < calcHeights.length; i++) {
        if(top === null || calcHeights[i] < top) {
          top = calcHeights[i];
          column = i;
        }
      }
      var embbededColumns = heights.length - calcHeights.length + 1;
      if(calcHeights.length !== heights.length) {
        j = 0;
        while(j < embbededColumns) {
          heights[column + j] = top + h + g;
          j++;
        }
      } else {
        heights[column] = top + h + g;
      }

      if(expanded) {
        embeddedEntries = entry.subViewEntries.length;
        maxColHeight = Math.max.apply(Math, heights);
        var minColHeight = Math.min.apply(Math, heights);
        for (i = 0; i < heights.length; i++) {
          heightDiffs.push(heights[i] - minColHeight);
          heights[i] = maxColHeight + entry.context.expandSpace;
        }
      }

      var transition = {
        opacity: 0.5,
        transform: hasPosition ? 0.5 : 0,
        top: hasPosition ? 0.5 : 0,
        left: hasPosition ? 0.5 : 0,
        bottom: hasPosition ? 0.5 : 0
      };

      var prop = {
        left: mx + column * (cw + g),
        width: w,
        height: h,
        opacity: 1,
        zIndex: 1,
        transition: transition
      };

      if(self.origin === 'top') prop.bottom = top;
      else prop.top = top;

      entry.model.set(prop);

      entry.hasPosition = true;

    }, {all: true});

    var containerHeight = Math.max.apply(Math, heights);
    this.emit('containerHeight', containerHeight);
    if(this.origin === 'top') {
      window.scrollTo(null, windowOffset + containerHeight - this.containerHeight);
    }
    this.containerHeight = containerHeight;

  }));

  return this;
};

Layout.prototype.setOptions = function(options){
  for (var option in options) {
    if (options.hasOwnProperty(option)) {
      if (option === 'container') {
        this.container = document.querySelector(options.container);
        this.containerWidth = this.container.clientWidth;
      } else {
        this[option] = options[option];
      }
    }
  }
  return this;
};

/**
 * Resets the collection and container.
 * Appends views.
 */

Layout.prototype.reset = function(views) {
  if(this.containerView) this.containerView.el.innerHTML = '';
  this.emit('containerHeight', 0);
  this.containerHeight = 0;
  this.collection.clear();
  if(views) this.append(views).compose().draw();
  return this;
};

/**
 * ContainerView.
 */

function ContainerView(context) {
  this.context = context;
  this.collection = context.collection;
  this.el = document.createElement('div');
  this.el.className = this.context.origin + '-view';
  this.el.style.position = 'relative';
  this.context.on('containerHeight', bind(this, this.setHeight));
}

ContainerView.prototype.setHeight = function(height) {
  var cssProps = {
    position: 'relative',
    height: height
  };
  utils.css(this.el, cssProps);
};
