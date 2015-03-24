
# Layout

  Layout is Component(1) with which you can manage vertical layout item flow.

  TODO: make usable with npm

# API

## new Layout(options)

  Available options include:

  var options = {
		columnWidth: Number,
		gutter: Bumber
		blockTemplates: Object of templates with html&{{data}} fields,
		container: '#selector',
		containerWidth: Number
	};

  Creats an empty collection.

## append([view]|view)

  appends itemView to the collection

## appendBlock(attributes)

## appendContainer(view, subViews)

## compose()

  loops trough last and not composed items in collection 
  calculates width and height of each item if not specified in data-dimension(width,height) attribute or option default field.   

## draw()

  calculates position and dimension for each item in collection.
  each changed item then repositions itself.

## reset([view]|view)

  clears the collection and empties the wrapper.
  appends collection through the append function.

## filter(attributes)

  coming ...

## use(algo)

  coming ...

# Events

## viewCreated()

## viewRendered()
