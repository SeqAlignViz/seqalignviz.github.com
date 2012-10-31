var drawAlignment = function(aln, divEl, dWidth, dHeight, showText, createBrush) {

	// Get dimensions
	var nRow = aln.length
	var nCol = aln[0].length	// Assuming all rows have equal # of columns
	var colormap = d3.scale.ordinal()
		.domain(["A", "T", "C", "G", "."])
		// Colors chosen using color brewer: 4 data classes, qualitative, colorblind safe
		.range(["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "white"])

	// One-dimensionalize and add attributes indicating position
	var alnFlat = []
	for (i = 0; i < nRow; i++){
		for(j = 0; j < nCol; j++){
			alnFlat.push({val: aln[i][j], row: i, col: j})
		}
	}
	
	var width = dWidth - margin.left - margin.right
	var height = dHeight - margin.top - margin.bottom

	// Rectangle sizing
	var rWidth = width/nCol
	var rHeight = height/nRow

	var x = d3.scale.linear().domain([0, nCol]).range([0, width])
	var y = d3.scale.linear().domain([0, nRow]).range([0, height])

	// Create svg
	var svg = divEl.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.attr("width", width)
			.attr("height", height)
	
	// Create grid
	var nodes = svg.selectAll("g")
		.data(alnFlat)

	// Create individual rectangles on grid
	nodes.enter().append("g")
		.attr("transform", function(d,i) { return "translate(" + x(d.col) + "," + y(d.row) + ")"; } )

	nodes.append("rect")
		.attr("width", rWidth)
		.attr("height", rHeight)
		.attr("row", function(d, i) { return d.row;} )
		.attr("col", function(d, i) { return d.col;} )
		.attr("val", function(d, i) { return d.val;} )
		.style("fill", function(d, i) { return colormap(d.val); } );

	if(showText) {
		nodes.append("text")
			.attr("dy", function(d, i) { return rHeight/1.5; })
			.attr("dx", function(d, i) { return rWidth/2.0; })
			.text(function(d, i) { if(d.val != '.') return d.val; })
			.attr("text-anchor", "middle")
	}
	if(createBrush) {
		// Callback for brush events
		function onbrush(p) {
			var ex = d3.event.target.extent();
			w = ex[0][0]
			n = ex[0][1]
			e = ex[1][0]
			s = ex[1][1]
			d3.event.target.extent([[Math.round(w), n],[Math.round(e), s]])
			d3.event.target(d3.select(this))
		}

		function brushend() {
			if(brush.empty()) {
				for (rect in svg.selectAll("rect")) {
					alert(rect.toSource());
				}
			}
			w = brush.extent()[0][0]
			n = brush.extent()[0][1]
			e = brush.extent()[1][0]
			s = brush.extent()[1][1]
			if (e - w > 20){
				brush.extent([[w, n],[w+20, s]])
				brush.brush()
			}
			console.log(n + " " + w)
		}

		// Create brush
		var brush = d3.svg.brush()
			.x(x)
			.y(y)
   			.extent([[Math.floor(nCol/2) - 10, 0], [Math.floor(nCol/2) + 10, nRow]])
			.on("brush", onbrush)
			.on("brushend", brushend)

		var focus = svg.append("g")

		focus
		    .attr("class", "brush")
		    .call(brush)

		d3.selectAll(".resize").style("pointer-events", "none")
		d3.selectAll(".background").style("pointer-events", "none")

		// Add tooltips
		//$(divEl).tipsy({delayIn: 500, trigger: "hover"})
	}
};
