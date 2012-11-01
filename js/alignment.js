var drawAlignment = function(aln, rows, cols, divEl, dWidth, dHeight, showText, createBrush) {

	// Get dimensions
	var nRow = rows;
	var nCol = cols;	// Assuming all rows have equal # of columns
	var colormap = d3.scale.ordinal()
		.domain(["A", "T", "C", "G", "."])
		// Colors chosen using color brewer: 4 data classes, qualitative, colorblind safe
		//.range(["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "white"])
		.range(["rgb(0,127,0)", "rgb(204,0,0)", "rgb(0,0,204)", "rgb(255,179,0)", "white"])

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
		.data(aln)

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

		function updateZoom(n, s, e, w){
			var zoomRects = [];
			//divEl.selectAll("rect").attr("class", "red");
			divEl.selectAll("rect").each(function() {
				node = d3.select(this);
				nodeRow = parseInt(node.attr('row'));
				nodeCol = parseInt(node.attr('col'));
				if(n <= nodeRow && nodeRow <= s && w <= nodeCol && nodeCol <= e) {
					zoomRects.push({val: node.attr("val"), row: nodeRow - n, col: nodeCol - w });
					//console.log([nodeRow, nodeRow-n, nodeCol, nodeCol-w])
				}
			});
			var numRows = s-n;
			var numCols = e-w;
			//console.log([w, e, n,s]);
			//console.log(numRows + " " + numCols);
			//console.log([numRows, numCols]);
			//alert([minRow, minCol, maxRow, maxCol]);
			d3.select("#aln_zoom svg").remove();
			drawAlignment(zoomRects, numRows, numCols, d3.select("#aln_zoom"), dWidth, dHeight, true, false);
		}
		// Callback for brush events
		function onbrush(p) {
			var ex = d3.event.target.extent();
			w = Math.round(ex[0][0]) // x start
			n = Math.round(ex[0][1]) // y start
			e = Math.round(ex[1][0]) // x end
			s = Math.round(ex[1][1]) // y end
			if(e - w != 20 ) { e = w + 20; }
			d3.event.target.extent([[w, n],[e, s]])
			d3.event.target(d3.select(this))
			lineNW.attr("x1", function() { return x(w); })
			lineNE.attr("x1", function() { return x(e); })

			//alert(divEl.selectAll("rect"));
			//alert([w, n, e, s]);
			//console.log(w + " " + e)
			updateZoom(n, s, e ,w)

			pwm = generatePwm(d3.selectAll("#aln_zoom rect"), e-w);
			pwm.drawLogo(YAHOO.util.Dom.get("seqLogo"));

			//alert([w, n, e, s]);
		}

		function brushend() {
			if(brush.empty()) {
			}
			w = brush.extent()[0][0]
			n = brush.extent()[0][1]
			e = brush.extent()[1][0]
			s = brush.extent()[1][1]
			//console.log(w + " " + e)
			//pwm = generatePwm(d3.selectAll("#aln_zoom rect"), e-w);
			//pwm.drawLogo(YAHOO.util.Dom.get("seqLogo"));
			//console.log(pwm);
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

		var lineNW = svg.append("line")
			.attr("class", "zoomline")
			.attr("x1", function() { return x(Math.floor(nCol/2) - 10); })
			.attr("y1", function() { return y(0); })
			.attr("x2", function() { return x(0); })
			.attr("y2", function() { return -margin.top/2; })
		var lineW = svg.append("line")
			.attr("class", "zoomline")
			.attr("x1", function() { return x(0); })
			.attr("y1", function() { return -margin.top/2; })
			.attr("x2", function() { return x(0); })
			.attr("y2", function() { return -margin.top; })
		var lineNE = svg.append("line")
			.attr("class", "zoomline")
			.attr("x1", function() { return x(Math.floor(nCol/2) + 10); })
			.attr("y1", function() { return y(0); })
			.attr("x2", function() { return x(nCol); })
			.attr("y2", function() { return -margin.top/2; })
		var lineE = svg.append("line")
			.attr("class", "zoomline")
			.attr("x1", function() { return x(nCol); })
			.attr("y1", function() { return -margin.top/2; })
			.attr("x2", function() { return x(nCol); })
			.attr("y2", function() { return -margin.top; })

			updateZoom(0, nRow, Math.floor(nCol/2) + 10, Math.floor(nCol/2) - 10)
			pwm = generatePwm(d3.selectAll("#aln_zoom rect"), e-w);
			pwm.drawLogo(YAHOO.util.Dom.get("seqLogo"));
		// Add tooltips
		//$(divEl).tipsy({delayIn: 500, trigger: "hover"})
	}
};
