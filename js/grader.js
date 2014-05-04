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
 * @param inputbox box for taking the name of the savefile
 * @param gobtn button to click for loading the savefile
 * @param anno graph annotator for loading
 */
var Grader = function(inputbox,gobtn,anno,btnok,btnfp,btnfn) {
	var self = this;
	this.inputbox = inputbox;
	this.gobtn = gobtn;
	this.anno = anno;

	$(this.gobtn).click(function() {
		self.show(RFGraph.ROOTDIR);
	});

	$(btnok).button({
		icons: {primary: "ui-icon-check"}
	}).click(function(e) { self.doMark("ok"); });
	
	$(btnfp).button({
		icons: {primary: "ui-icon-closethick"}
	}).click(function(e) { self.doMark("fp"); });

	$(btnfn).button({
		icons: {primary: "ui-icon-closethick"}
	}).click(function(e) { self.doMark("fn"); });
}

Grader.prototype.doMark = function(type) {
	var color = "#0000ff";
	this.anno.doMark(this.anno.gp.x, this.anno.gp.y, type, this.anno.getCheckedType(), color);
	fd.plot();
}

/**
 * Show saved annotation results for the given task
 * @param task the task to get animation results for.
 */
Grader.prototype.show = function(task) {
	var self = this;
	var savename = $(self.inputbox).attr("value");
	self.anno.clearShown();
    self.anno.showSaved(task, savename, null, function(modeid) {
    	Mode.change(modeid);
        fd.plot();
    });
    //show the key
    var keyfile = "key/" + Mode.getCurrent() + ".txt";
    //keyfile = keyfile.replace(/-/ig,"");
    self.anno.showSaved(task, keyfile, "#00ff00", function(modeid) {
    	fd.plot();
    });
}