/*
 * Copyright (c) 2014, Carnegie Mellon University.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the University nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT
 * HOLDERS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS
 * OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY
 * WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * Annotation tool
 */
var Annotate = function(contsel,btnsel,radiosel) {
	this.contsel = contsel;
	this.btnsel = btnsel;
	this.radiosel = radiosel;
	var self = this;
	$(this.btnsel).button({
		icons: {primary: "ui-icon-pin-s"}
	}).click(function(e) {
		self.doMark(self.gp.x, self.gp.y, self.getCheckedType());
		//XXX: this should really be non-global
		fd.plot();
	});

	this.txtbtnify("#btn-anno-represent","represent",
		"Please describe in a sentence or two what these changes represent.");
	this.txtbtnify("#btn-anno-interesting","interesting",
		"Is there anything else about the graph that you find interesting or problematic?");

	this.shown = [];
	this.marks = [];
}

Annotate.prototype.getCheckedType = function() {
	return $("input:radio[name=" + this.radiosel + "]:checked").val();
};

Annotate.prototype.txtbtnify = function(elsel,key,desc) {
	var SMFONT = "0.9em";
	var self = this;
	$(elsel).button({
		icons: {primary: "ui-icon-pencil"}
	}).css({
		"font-size": SMFONT
	}).click(function(e) {
		var thetxt = prompt(desc,"");
		self.markStr(key, thetxt);
	});
};

/**
 * Mark a string with no coordinates
 */
Annotate.prototype.markStr = function(/**string*/ key, /**string*/ val) {
	this.doMark(NaN, NaN, key, val);
}

/**
 * (interal) save the mark _mark_ to a file
 */
Annotate.prototype.saveMark = function(/**Mark*/ mark) {
	$.getJSON("save.php", mark, function(res) {
		if (res.status != "success") {
			alert("Couldn't save mark!");
		}
	});
}

/**
 * Show saved marks
 * @param task the name of the task (e.g. graphs/task3/out) to show marks for
 * @param path where to load marks from
 * @param next continuation after loaded, called with the location of the 
 */
Annotate.prototype.showSaved = function(/**string*/ task, /**string*/ path, /**string*/ color, /**Function*/ next) {
	var self = this;
	var sendd = {load:true};
	if (path) {
		sendd["path"] = path;
	}
	$.getJSON("save.php", sendd, function(res) {
		var scanfirstmode = true;
		var firstmode = "";
		for (var i = 0; i < res.length; ++i) {
			var ri = res[i];
			//mix in the color if it's specified.
			if (color) {
				ri.color = color;
			}
			if (ri.type !== "modeChange") {
				scanfirstmode = false;
			}
			if (scanfirstmode) {
				firstmode = ri.val;
			}
			ri.x = parseFloat(ri.x);
			ri.y = parseFloat(ri.y);
			if (ri.task === task) {
				self.shown.push(ri);
			}
		}
		next(firstmode);
	});
}

Annotate.prototype.doMark = function(x, y, type, val, color) {
	var newmark = {
		task: RFGraph.ROOTDIR,
		x: x,
		y: y,
		type: type,
		time: (new Date()).getTime()
	};
	if (val !== undefined) {
		newmark.val = val;
	}
	if (color !== undefined) {
		newmark.color = color;
	}

	this.shown.push(newmark);
	this.marks.push(newmark);
	this.saveMark(newmark);
	this.hide();
}

/**
 * @param xp offset x (screen coords)
 * @param yp offset y (screen coords)
 * @param gp graph position
 */
Annotate.prototype.showAt = function(xp,yp,gp) {
	this.xp = xp;
	this.yp = yp;
	this.gp = gp;
	$(this.contsel).css({
		visibility:"visible",
		left:xp,
		top:yp
	});
}

Annotate.prototype.hide = function() {
	$(this.contsel).css({
		visibility:"hidden"
	});
}

Annotate.prototype.getDescription = function(st) {
	switch (st) {
	case "q1":
		return "Significant";
	case "q2":
		return "Latency";
	case "q3":
		return "Structural";
	case "q4":
		return "Most Impact";
	case "ok":
		return "Correct";
	case "fp":
		return "False Positive";
	case "fn":
		return "False Negative";
	}
}

Annotate.prototype.clearShown = function() {
	this.shown = [];
}

Annotate.prototype.draw = function(canvas,alpha) {
	var ctx = canvas.getCtx();
	ctx.save();
	var FONTSIZE = 30;
	ctx.font = FONTSIZE + "px Arial bold"
	ctx.textBaseline = "bottom";
	var arrdim = 20;

	for (var i = 0; i < this.shown.length; ++i) {
		var mark = this.shown[i];
		if (mark.type === "unmark") {
			var W = 180;
			if (mark.color) {
				ctx.strokeStyle = mark.color;
			} else {
				ctx.strokeStyle = "#ff0000";
			}
			ctx.lineWidth = 5;
			ctx.beginPath();
			ctx.moveTo(mark.x, mark.y - FONTSIZE);
			ctx.lineTo(mark.x + W, mark.y);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(mark.x, mark.y);
			ctx.lineTo(mark.x + W, mark.y - FONTSIZE);
			ctx.stroke();
		} else if (!isNaN(mark.x)) {
			var desc = this.getDescription(mark.type);
			ctx.beginPath();
			ctx.moveTo(mark.x, mark.y);
			ctx.lineTo(mark.x, mark.y - arrdim);
			ctx.lineTo(mark.x + arrdim, mark.y);
			ctx.closePath();
			ctx.fillStyle = "rgba(255,0,0," + (alpha/2) + ")";
			ctx.fill();
			if (mark.color) {
				ctx.fillStyle = mark.color;
			} else {
				ctx.fillStyle = "rgba(255,0,0," + alpha + ")";
			}
			ctx.fillText(desc, mark.x+arrdim, mark.y);
		}
	}
	ctx.restore();
}