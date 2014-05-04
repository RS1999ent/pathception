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
@namespace UI mode selection
*/
Mode = {};

Mode.previd = "";
Mode.BLOCKS = {
	"help": {
		enabled: true,
		cssin: { left: -1 },
		cssout: { left: -500 }
	},
	"info": {
		enabled: false,
		cssin: { left: -1 },
		cssout: { left: -400 }
	},
	"slider": {
		enabled: false,
		cssin: { left: -1 },
		cssout: { left: -450 }
	},
	"cdf": {
		enabled: false,
		cssin: { left: -1 },
		cssout: { left: -300 }		
	},
	"grlist": {
		enabled: false,
		cssin: { right: 38 },
		cssout: { right: -250 }
	},
	"uimode": {
		enabled: true,
		cssin: { bottom: -1 },
		cssout: { bottom: -70 }
	},
	"legend": {
		enabled: true,
		cssin: { bottom: -1 },
		cssout: { bottom: -70 }
	},
	"devmode": {
		enabled: DEVMODE_ENABLED,
		cssin: { bottom: 60 },
		cssout: { bottom: -70 }
	},
	"tasksel": {
		enabled: true,
		cssin: { bottom: -1 },
		cssout: { bottom: -70 }		
	},
	"scroll": {
		enabled: true,
		cssin: { right: -1 },
		cssout: { right: 40 }
	},
	"diagram": {
		enabled: DIAGRAM_ENABLED,
		cssin: { top: 20 },
		cssout: { top: -200 }
	},
	"grader": {
		enabled: GRADER_ENABLED,
		cssin: { top: -1 },
		cssout: { top: -100 }
	}
};

/**
 * @param chancecb change callback
 */
Mode.init = function(changecb) {
	var cont = $("#mode-sel-cont");
	cont.buttonset();
	Mode.onchange = changecb;
	cont.children().click(function(e) {
		var modeid = $(this).attr("id");
		if (modeid.length > 0) {
			Mode.change(modeid);
		}
	});
	cont.children().each(function(i, el) {
		if ($(el).attr("checked")) {
			$(el).trigger("click");
		}
	});

	$.each(Mode.BLOCKS, function(k, v) {
		if (v.enabled) {
			Mode.showBlock(k);
		}
	});

	//developer mode toggle
	var cont = $("#btn-devmode").button().click(function() {
		var enable = ($(this).text() == "Developer");
		$(this).button("option", "label", enable ? "No Developer" : "Developer");
		$.each(Mode.BLOCKS, function(k, v) {
			var method = enable ? "showBlock" : "hideBlock";
			var otherMethod = enable ? "hideBlock" : "showBlock";
			if ($.inArray(k, ["devmode","scroll","legend","tasksel","diagram"]) == -1) {
				Mode[method](k);
			}
 
			Mode[otherMethod]("diagram");
		});
	});
};

Mode.showBlock = function(name) {
	$("#" + name + "-cont").animate(Mode.BLOCKS[name].cssin);
};
Mode.hideBlock = function(name) {
	$("#" + name + "-cont").animate(Mode.BLOCKS[name].cssout);
};
Mode.isEnabled = function(name) {
	return Mode.BLOCKS[name].enabled;
};
Mode.setEnabled = function(name, val) {
	Mode.BLOCKS[name].enabled = val;
};

Mode.getCurrent = function() {
	return Mode.previd;
}

Mode.change = function(modeid) {
	Mode.onchange(modeid);

	//unshow a mode
	switch(Mode.previd) {
	case "rad-mode-side":
		SHOWSBS = false;
		break;
	case "rad-mode-diff":
		SHOWBOTH = false;
		Mode.hideBlock("legend");
		break;
	case "rad-mode-anim":
		Mode.hideBlock("slider");
		$("#btn-blink").text("start");
		break;
	}

	switch(modeid) {
	case "rad-mode-side":
		SHOWSBS = true;
		setslide(0, true);
		break;
	case "rad-mode-diff":
		SHOWBOTH = true;
		setslide(50, true);
		Mode.showBlock("legend");
		break;
	case "rad-mode-anim":
		Mode.showBlock("slider");
		setslide(100, true);
		//we need to re-icon when we show this.
		$("#btn-blink").button({
        	icons: { primary: "ui-icon-play" }
   		});
		break;
	default:
		Util.debug("Unknown mode:", modeid);
		break;
	}

	Mode.previd = modeid;
};
