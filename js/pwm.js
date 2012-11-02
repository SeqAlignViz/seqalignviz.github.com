/* "Classes" and functions for representing motifs as position weight matrices (PWMs). */

// Class definition for a PWM column.
var PwmColumn = function(uA, uC, uG, uT) {
    total = uA + uC + uG + uT;
    if (total == 0) { total = 1.0; } // avoid division by zero
    this.A = uA / total;
    this.C = uC / total;
    this.G = uG / total;
    this.T = uT / total;
};

// Class definition for a PWM.
var Pwm = function(uName) {
    this.name = uName;
    this.columns = new Array();
    this.length = 0;
    
    // Add a column to the PWM
    this.pushColumn = function(a,c,g,t) {
        var col = new PwmColumn(a,c,g,t);
        this.columns.push(col);
        this.length = this.length + 1;
    };

    // Draw a sequence logo for the PWM.
    this.drawLogo = function(imgDiv, oArgs) {
        // Detect parameters.
        var height = -1;
        var leftPad = 0;
        var rightPad = 0;
        if(oArgs != null) {
            if (typeof oArgs.height != 'undefined') { height = oArgs.height; }
            if (typeof oArgs.leftPad != 'undefined') { leftPad = oArgs.leftPad; }
            if (typeof oArgs.rightPad != 'undefined') { rightPad = oArgs.rightPad; }
        }
        if (leftPad < 0) { leftPad = 0; }
        if (rightPad < 0) { rightPad = 0; }

        // If the height is specified, resize the element.
        var columnWidthPx = 0;
        var columnCount = this.length + leftPad + rightPad;
        if (height >= 0) {
			//imgDiv.height(height+"px");
            YAHOO.util.Dom.setStyle(imgDiv, "height", height+"px");
            columnWidthPx = 0.625 * height;
			//imgDiv.width((columnWidthPx * columnCount)+"px");
            YAHOO.util.Dom.setStyle(imgDiv, "width", (columnWidthPx * columnCount)+"px");
        }
        else {
            //var fullWidth = parseInt(imgDiv.width());
            var fullWidth = parseInt(YAHOO.util.Dom.getStyle(imgDiv, "width"));
            columnWidthPx = fullWidth / columnCount;
        }
        // Create an image within the div (if one does not already exist
        // and size it to fill the div.
        var imgEls = YAHOO.util.Dom.getElementsBy(function() { return true; }, "img", imgDiv);
        //var imgEls = imgDiv.find('img').get();
        var imgEl = null;
        if (imgEls.length != 0) {
            imgEl = imgEls[0];
        }
        else {
            imgEl = imgDiv.appendChild(document.createElement("img"));
            //imgEl = $(document.createElement("img"));
			//imgEl.appendTo(imgDiv);
        }
        YAHOO.util.Dom.setStyle(imgEl, "height", YAHOO.util.Dom.getStyle(imgDiv, "height"));
        YAHOO.util.Dom.setStyle(imgEl, "width", YAHOO.util.Dom.getStyle(imgDiv, "width"));
 
        // Create a MEME-style PSPM description.
        var pspmString = "letter-probability matrix: alength= 4 w= " + this.length + " nsites= " + this.length + "\n";
		for (var i = 0; i < this.length; i++) {
			col = this.columns[i];
			pspmString = pspmString + col.A + " " + col.C + " " + col.G + " " + col.T + "\n";
		}
		var pspm = new Pspm(pspmString);
        var alphabet = new Alphabet('ACGT', 'A 0.25 C 0.25 G 0.25 T 0.25');
        // draw the sequence logo
        uLeftPad = leftPad; 
		uRightPad = rightPad;
        draw_logo(pspm, alphabet, imgEl, false, false, columnWidthPx * uLeftPad, columnWidthPx * uRightPad);

    };

};

// Load a PWM for array
var generatePwm = function(alnArray, numCols) {
	var pwm = new Pwm("test");
	var numA = [];
	var numC = [];
	var numG = [];
	var numT = [];
	var numN = [];	
	for (var i = 0; i < numCols; i++) {
		numA[i] = numC[i] = numG[i] = numT[i] = numN[i] = 0;
	}
	
	alnArray.each(function() {
		node = d3.select(this);
		value = node.attr("val");
		col = parseInt(node.attr("col"));
		switch (value) {
			case 'A': case 'a':
				numA[col] += 1;
				break;
			case 'C': case 'c':
				numC[col] += 1;
				break;
			case 'G': case 'g':
				numG[col] += 1;
				break;
			case 'T': case 't':
				numT[col] += 1;
				break;
			default:
				numN[col] += 1;
		}
	});
	for (var i = 0; i < numCols; i++) {
		/* Since we don't know what Ns are just add them to all colums*/
		var total = numA[i] + numC[i] + numG[i] + numT[i] + numN[i];
		var freqA = (numA[i] + 0.25*numN[i])/total;
		var freqC = (numC[i] + 0.25*numN[i])/total;
		var freqG = (numG[i] + 0.25*numN[i])/total;
		var freqT = (numT[i] + 0.25*numN[i])/total;
		pwm.pushColumn(freqA, freqC, freqG, freqT);
	}
	return pwm;
};

