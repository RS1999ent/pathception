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
 * @param contsel selector for the scrollbar container
 * @param btnsel selector for the scrollbar handle
 * @param scrollfn lambda(val,delta)
 */
var Scrollbar = function(contsel, btnsel, scrollfn) {
    this.contsel = contsel;
    this.btnsel = btnsel;
    this.setMax(1000);
    this.init();
    this.lastscroll = 0;
    this.scrollfn = scrollfn;
    this.viewable = this.getHeight();
}
Scrollbar.prototype.init = function() {
    var btn = $(this.btnsel);
    var self = this;
    var dehighlight = function() {
        $(self.btnsel).css({
            "background-color": "#666"
        });
    };
    var endfn = function(e) {
        $(document).unbind(".sbar");
        self.holding = false;
        if (!self.mouseIsOver) {
            dehighlight();
        }
    };
    var mousepos = function(e) {
        return e.pageY || (e.clientY + (document.documentElement.scrollTop || document.body.scrollTop));
    };
    btn.mousedown(function(e) {
        e.preventDefault();
        e.stopPropagation();
        var clickstart = e.offsetY;
        self.holding = true;
        $(document).bind("mousemove.sbar", function(e) {
            e.preventDefault();
            var height = self.getHeight();
            var newval = ((mousepos(e)-clickstart) / height) * self.max + self.getViewable() / 2;
            val = Math.max(0, Math.min(self.max, newval));
            self.doScroll(val);
        });
        $(document).bind("mouseup.sbar", function(e) {
            endfn(e);
        });
    });
    btn.mouseover(function(e) {
        $(self.btnsel).css({
            "background-color": "#000"
        });
        self.mouseIsOver = true;
    });
    btn.mouseout(function(e) {
        if (!self.holding) {
            dehighlight();
        }
        self.mouseIsOver = false;
    });

    $(document).bind("keydown.sbar", function(e) {
        if ((e.keyCode >= 37) && (e.keyCode <= 40)) {
            var delta = self.getViewable() / 10;
            if (e.keyCode == 38) { //up
                self.doScroll(self.lastscroll - delta);
            } else if (e.keyCode == 40) { //down
                self.doScroll(self.lastscroll + delta);
            }            
        }
    });

    var cont = $(this.contsel);
}
Scrollbar.prototype.updateHandlePos = function(val) {
    var pos = (val - this.getViewable() / 2) / this.max * this.getHeight();
    $(this.btnsel).css({
        "top": pos
    });
    this.setMax(this.max);
}
Scrollbar.prototype.getHeight = function() {
    return $(this.contsel).height();
}
Scrollbar.prototype.getViewable = function() {
    return this.viewable;
}
Scrollbar.prototype.setViewable = function(val) {
    this.viewable = val;
    this.updateHandlePos(this.lastscroll);
}
Scrollbar.prototype.setMax = function(max) {
    this.max = max;
    var fracshow = this.getViewable() / max;
    this.btnheight = this.getHeight() * (this.getViewable() / this.max);
    $(this.btnsel).css("height", Math.min(this.getHeight(), this.btnheight));
}
Scrollbar.prototype.getMax = function() {
    return this.max;
}
Scrollbar.prototype.doScroll = function(val) {
    if (val != this.lastscroll) {
        this.scrollfn(val, val - this.lastscroll);
        this.lastscroll = val;
        this.updateHandlePos(val);
    }
}
Scrollbar.prototype.setVal = function(val) {
    this.lastscroll = val;
    this.updateHandlePos(this.lastscroll);
}