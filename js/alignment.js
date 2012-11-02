var colorByNucleotide = true;

//var nucleoData= [["A", "rgb(0,127,0)"], ["T", "rgb(204,0,0)"], ["C", "rgb(0,0,204)"], ["G", "rgb(255,179,0)"], ["-", "white"]];
var nucleotidemap = d3.scale.ordinal()
	.domain(["A", "T", "C", "G", "."])
	// Colors chosen using color brewer: 4 data classes, qualitative, colorblind safe
	//.range(["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "white"])
	.range(["rgb(0,127,0)", "rgb(204,0,0)", "rgb(0,0,204)", "rgb(255,179,0)", "white"])
			

//var percentData= [[0, 0.5, "#9e9ac8"], [0.5, 0.75, "#756bb1"], [0.75, 1, "#54278f"]];
var percentidmap = d3.scale.quantile()
	.domain([0.5, 0.75, 1])
	//.range(["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"])
	.range(["#9e9ac8", "#756bb1", "#54278f"])

var colorbase = function(d) {
	if(colorByNucleotide) {
		return nucleotidemap(d.val);
	} else {
		var color = "white";
		switch(d.val) {
			case 'A': case 'C': case 'G': case 'T':
				color = percentidmap(d.percentid);
				break
			default:
				color = "white"
		}
		return color;
	}
};

var colorScheme = function(id) {
	if(id == "#nucleotide") {
		colorByNucleotide = true;
		$("#nucleotide")
			.addClass("btn-primary");
		$("#percentid")
			.removeClass("btn-primary");
		
		brush = d3.selectAll("#aln_full svg .extent")
		x = parseInt(brush.attr("x"))
		y = parseInt(brush.attr("y"))
		width = parseInt(brush.attr("width"))
		height = parseInt(brush.attr("height"))
		brushExt = [[x, y], [x + width, y + height]]
		d3.select("#aln_full svg").remove();
		drawAlignment(alnArray, rows, cols, d3.select("#aln_full"), dWidth, dHeight, false, true, brushExt);
		$("#nucleotide").text("Colored by Nucleotide");
		$("#percentid").text("Color by % Identity");
	} else {
		colorByNucleotide = false;
		$("#percentid")
			.addClass("btn-primary");
		$("#nucleotide")
			.removeClass("btn-primary");
		brush = d3.selectAll("#aln_full svg .extent")
		x = parseInt(brush.attr("x"))
		y = parseInt(brush.attr("y"))
		width = parseInt(brush.attr("width"))
		height = parseInt(brush.attr("height"))
		brushExt = [[x, y], [x + width, y + height]]
		d3.select("#aln_full svg").remove();
		drawAlignment(alnArray, rows, cols, d3.select("#aln_full"), dWidth, dHeight, false, true, brushExt);
		$("#percentid").text("Colored by % Identity");
		$("#nucleotide").text("Color by Nucleotide");
	}
};

var drawAlignment = function(aln, rows, cols, divEl, dWidth, dHeight, showText, createBrush, brushExt) {

	// Get dimensions
	var nRow = rows;
	var nCol = cols;	// Assuming all rows have equal # of columns

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
			.attr("width", width-1)
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
		.attr("percentid", function(d, i) { return d.percentid;} )
		.style("fill", function(d, i) { return colorbase(d); } );

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
			divEl.selectAll("rect").each(function() {
				node = d3.select(this);
				nodeRow = parseInt(node.attr('row'));
				nodeCol = parseInt(node.attr('col'));
				if(n <= nodeRow && nodeRow <= s && w <= nodeCol && nodeCol <= e) {
					zoomRects.push({val: node.attr("val"), percentid : node.attr("percentid"), row: nodeRow - n, col: nodeCol - w });
				}
			});
			var numRows = s-n;
			var numCols = e-w;
			d3.select("#aln_zoom svg").remove();
			drawAlignment(zoomRects, numRows, numCols, d3.select("#aln_zoom"), dWidth, dHeight, true, false);
			drawTrapz(w,e);
		}
		function drawTrapz(brushX1, brushX2) {
			d3.select("#aln_full svg #zoomPath").remove();
			var pathinfo = [ { x : x(0), y :  -margin.top-margin.bottom },
						     { x : x(brushX1), y : y(0) },
							 { x : x(brushX2), y : y(0) },
							 { x : x(nCol), y : -margin.top-margin.bottom } ];
			console.log(y(-2)+" yay");
			var d3line2 = d3.svg.line()
							.x(function(d) { return d.x; })
							.y(function(d) { return d.y; })
							.interpolate("linear");
			svg.append("svg:path")
				.attr("d", d3line2(pathinfo))
				.attr("id", "zoomPath")
				.style("fill", "black")
				.style("opacity", "0.25")
		}
		// Callback for brush events
		function onbrush(p) {
			var ex = d3.event.target.extent();
			w = Math.round(ex[0][0]) // x start
			n = Math.round(ex[0][1]) // y start
			e = Math.round(ex[1][0]) // x end
			s = Math.round(ex[1][1]) // y end
			if(e - w != 20 ) { e = w + 20; }
			d3.event.target.extent([[w, -0.25],[e, s]])
			d3.event.target(d3.select(this))

			console.log(w + " " + e + " " + n + " " + s)
			updateZoom(n, s, e ,w)

			pwm = generatePwm(d3.selectAll("#aln_zoom rect"), e-w);
			pwm.drawLogo(YAHOO.util.Dom.get("seqLogo"));
		}

		function brushend() {
			if(brush.empty()) {
			}
			w = brush.extent()[0][0]
			n = brush.extent()[0][1]
			e = brush.extent()[1][0]
			s = brush.extent()[1][1]
		}

		// Create brush
		if(typeof(brushExt) != 'undefined'){
			brushExt[0][0] = Math.round(x.invert(brushExt[0][0]))
			brushExt[0][1] = -0.25
			brushExt[1][0] = Math.round(x.invert(brushExt[1][0]))
			brushExt[1][1] = nRow
		}
		myExt = brushExt || [[Math.floor(nCol/2) - 10, -0.25], [Math.floor(nCol/2) + 10, nRow]]
		var brush = d3.svg.brush()
			.x(x)
			.y(y)
   			.extent(myExt)
			.on("brush", onbrush)
			.on("brushend", brushend)

		var focus = svg.append("g")

		focus
		    .attr("class", "brush")
		    .call(brush)

		d3.selectAll(".resize").style("pointer-events", "none")
		d3.selectAll(".background").style("pointer-events", "none")
		
		updateZoom(0, nRow, myExt[1][0], myExt[0][0])
		pwm = generatePwm(d3.selectAll("#aln_zoom rect"), 20);
		pwm.drawLogo(YAHOO.util.Dom.get("seqLogo"));
	}
};

var computePercentId = function(stringArray) {
	var idMatrix = [];
	for(var j = 0; j < stringArray[0].length; j++) {
		idMatrix[j] = [];
		idMatrix[j]['A'] = idMatrix[j]['C'] = idMatrix[j]['G'] = idMatrix[j]['T'] = idMatrix[j]['N'] = 0;
		for(var i = 0; i < stringArray.length; i++) {
			value = stringArray[i][j];
			switch (value) {
				case 'A': case 'a':
					idMatrix[j]['A'] += 1;
					break;
				case 'C': case 'c':
					idMatrix[j]['C'] += 1;
					break;
				case 'G': case 'g':
					idMatrix[j]['G'] += 1;
					break;
				case 'T': case 't':
					idMatrix[j]['T'] += 1;
					break;
				default:
					idMatrix[j]['N'] += 1;
			}

		}
		total = idMatrix[j]['A'] + idMatrix[j]['C'] + idMatrix[j]['G'] + idMatrix[j]['T'] + idMatrix[j]['N'];
		idMatrix[j]['A'] = (idMatrix[j]['A'] + 0.25*idMatrix[j]['N'])/total;
		idMatrix[j]['C'] = (idMatrix[j]['C'] + 0.25*idMatrix[j]['N'])/total;
		idMatrix[j]['G'] = (idMatrix[j]['G'] + 0.25*idMatrix[j]['N'])/total;
		idMatrix[j]['T'] = (idMatrix[j]['T'] + 0.25*idMatrix[j]['N'])/total;
	}
	return idMatrix;
};
