var drawFull = function(stringArray, divEl, dWidth, dHeight) {
	// Get dimensions
	var nRow = stringArray.length
	var nCol = stringArray[0].length	// Assuming all rows have equal # of columns

	// One-dimensionalize and add attributes indicating position
	var stringArray1D = []

	for (i = 0; i < nRow; i++){
		for(j = 0; j < nCol; j++){
			stringArray1D.push({val: stringArray[i][j], row: i, col: j})
		}
	}
	var width = dWidth - margin.left - margin.right
	var height = dHeight - margin.top - margin.bottom

	// Rectangle sizing
	var rWidth = width/nCol
	var rHeight = height/nRow

	// D3 mappings/scalings
	var x = d3.scale.linear().domain([0, nCol]).range([0, width])
	var y = d3.scale.linear().domain([0, nRow]).range([0, height])
	var colormap = d3.scale.ordinal()
		.domain(["A", "T", "C", "G", "."])
		// Colors chosen using color brewer: 4 data classes, qualitative, colorblind safe
		.range(["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "white"])

	// Create svg
	var svg = divEl.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// Create grid
	var rects = svg.selectAll("rect")
		.data(stringArray1D)

	// Create individual rectangles on grid
	rects.enter().append("rect")
		.attr("x", function(d, i) { return x(d.col); })
		.attr("width", rWidth)
		.attr("y", function(d, i) { return y(d.row); })
		.attr("height", rHeight)
		.attr("fill", function(d, i) { return colormap(d.val); })
		.attr("title", function(d, i) { return d.val; })		// Used by tooltip

	// Create brush
	var brush = d3.svg.brush()
		.y(y)
		.x(x)
		.extent([[Math.floor(nCol/2) - 10, Math.floor(nRow/2) - 10], [Math.floor(nCol/2) + 10, Math.floor(nRow/2) + 10]])
		.on("brush", brush)

	// Create brush rectangle (shown on svg)
	var focus = svg.append("g")
	//    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	focus.append("g")
		.attr("class", "brush")
		.call(brush)

	d3.selectAll(".brush").style("pointer-events", "visible")
	d3.selectAll(".resize").style("pointer-events", "fill")
	d3.selectAll(".background").style("pointer-events", "none")

	// Handle for 'info' div
	var infoDiv = d3.select("#info")

	// Callback for brush events
	function brush() {
	  infoDiv.selectAll("p").data(brush.extent()).text(String)
	  w = brush.extent()[0][0]
	  n = brush.extent()[0][1]
	  e = brush.extent()[1][0]
	  s = brush.extent()[1][1]
	  if (e - w > 20){
		brush.extent([[w, n],[w+20, s]])
		brush.brush()
	  }
	}

	// Add tooltips
	$(divEl).tipsy({delayIn: 500, trigger: "hover"})
};
