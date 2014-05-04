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
@namespace Extend/override default jit functionality
*/
JitExtend = {};

var FONTSIZE = PAPER ? 30 : 18;

JitExtend.PRECOL = "#EDC240";
//JitExtend.PRECOL = "#00FF00";
JitExtend.MUTCOL = "#AFD8F8";
//JitExtend.MUTCOL = "#FF0000";

/**
Override the default jit label to change the rendered label
(e.g. add additional information for debugging/viewing purposes)
*/
JitExtend.renderLabel = function(canvas, node, controller) {
    var ctx = canvas.getCtx();
    ctx.font = FONTSIZE + "px Arial bold"; // + " Segoe UI";
    if (PAPER) {
        ctx.font = FONTSIZE + "px Myriad Pro Black";
    }
    var pos = node.pos.getc(true);
    
    //var name = node.name + " " + node.data.bfsn;
    var name = node.name;
    
    ctx.fillStyle = "rgba(0,0,0," + JitExtend.getalpha(node.data.diff) + ")";
    ctx.fillText(name, pos.x, pos.y + node.getData("height") / 2 + (PAPER ? 3 : 0));
};
$jit.ForceDirected.Label.Native.prototype.renderLabel = JitExtend.renderLabel;

/**
Additional Edge types:
<dl>
<dt>label-line</dt>
    <dd>Render text on the edge according to edge.data.weight. Also render graph diff colors</dd>
</dl>
*/
JitExtend.addlEdgeTypes = {  
  'label-line': {  
    'render': function(adj, canvas) {  
        var no1 = adj.nodeFrom, p1 = no1.pos.getc(true);
        var no2 = adj.nodeTo, p2 = no2.pos.getc(true);
        var ctx = canvas.getCtx();

        var diff = adj.data.diff;
        var weightf = adj.data.weightf;
        var weightt = adj.data.weightt;

        if (diff) {
            ctx.strokeStyle = ctx.fillStyle = "rgba(200,200,200," + JitExtend.getalpha(diff) + ")";
            if (SHOWBOTH) {
                if (diff == "infrom") {
                    ctx.strokeStyle = JitExtend.PRECOL;
                } else if (diff == "into") {
                    ctx.strokeStyle = JitExtend.MUTCOL;
                }
            }
        }
        
        if (SEL_ON) {
            if (p1.x > SEL_REL_LEFT && p1.x < SEL_REL_LEFT + SEL_REL_W &&
                p1.y > SEL_REL_TOP && p1.y < SEL_REL_TOP + SEL_REL_H &&
                p2.x > SEL_REL_LEFT && p2.x < SEL_REL_LEFT + SEL_REL_W &&
                p2.y > SEL_REL_TOP && p2.y < SEL_REL_TOP + SEL_REL_H) {
                ctx.strokeStyle = "#aa0000";
            }
        }

        var fliporder = false;
        var isparl = (diff == "parl"); // is a "parallel lines" line
        //hide parallel lines edges from other views
        if (isparl && !SHOWSBS) {
            return;
        }

        var w = maxUndef(weightf, weightt);
        if (w) {
            if (w < MINEDGESEL || w > MAXEDGESEL) {
                return;
            }

            //don't show edge labels
            if (false) {
                //show both the "from" and "to" weights
                ctx.save();
                var px = (p1.x + p2.x)/2 + 12;
                var py = (p1.y + p2.y)/2;
                var txt = weightf ? weightf + "" : "";
                txt += " / ";
                txt += weightt ? weightt + "" : "";
                txt += " us";

                ctx.fillText(txt, px, py+FONTSIZE/2);
                //this.nodeHelper.circle.render('fill', dotc, 3, canvas); 
                ctx.restore();
            }
        }
        
        //flip node order if directionality is reversed
        /* //from level numbering
        if (adj.nodeFrom.data.lb && adj.nodeTo.data.lb) {
            fliporder = (adj.nodeFrom.data.lb.levelno >= adj.nodeTo.data.lb.levelno);
        }
        */
        if ((adj.nodeFrom.data.lentob !== undefined) && (adj.nodeTo.data.lentob !== undefined)) {
            fliporder = (adj.nodeFrom.data.lentob >= adj.nodeTo.data.lentob);
        }

        var n1 = (fliporder) ? no2 : no1,
            q1 = (fliporder) ? p2 : p1;
        var n2 = (fliporder) ? no1 : no2,
            q2 = (fliporder) ? p1 : p2;
        //thin lines for backwards edges
        if (q2.y < q1.y) {
            ctx.lineWidth = 10;
        } else {
            ctx.lineWidth = 20;
        }

        //draw edges starting at end of boxes
        // (these need tweaking based on node height)
        var q1x = q1.x;
        var q2x = q2.x;
        if (false && isparl && SHOWSBS) {
            q1x += JitExtend.getNodeWidth(adj.nodeFrom)/2;
            q2x -= JitExtend.getNodeWidth(adj.nodeFrom)/2;
        }
        var q1y = q1.y + ((isparl) ? 0 : 15);
        var q2y = q2.y - ((isparl) ? 0 : 5);

        //red highlight for statistically significant edges
        if (diff && (adj.data.colort == "red")) {
            var origlw = ctx.lineWidth;
            var origstroke = ctx.strokeStyle;
            ctx.strokeStyle = "rgba(255,0,0," + JitExtend.getalpha(diff) + ")";
            ctx.lineWidth = origlw * 2;
            ctx.beginPath();
            ctx.moveTo(q1x,q1y);
            ctx.lineTo(q2x,q2y);
            ctx.stroke();

            ctx.lineWidth = origlw;
            ctx.strokeStyle = origstroke;
        }
        
        if (isparl) {
            //parallel lines
            ctx.beginPath();
            ctx.moveTo(q1x, q1y);
            ctx.lineWidth = 4;
            ctx.strokeStyle = "rgba(170,170,170,1)";
            var PTS = 20;
            var space = 4;
            if (q1x > q2x) {
                var tmpx = q1x, tmpy = q1y;
                q1x = q2x; q1y = q2y;
                q2x = tmpx; q2y = tmpy;
            }
            var deltax = (q2x-q1x-space*PTS)/PTS;
            var deltay = (q2y-q1y)/PTS;
            for (var x = 0; x < PTS; ++x) {
                q1x += space;
                ctx.moveTo(q1x,q1y);
                ctx.lineTo(q1x+=deltax,q1y+=deltay);
            }
            ctx.stroke();
        } else {
            var fracsolid = 1;
            if (SHOWBOTH) {
                fracsolid = adj.data.scwboth / (n2.data.lentob - n1.data.lentob);
            } else if (diff == "infrom" || (diff == "inboth" && SHOWSBS)) {
                fracsolid = adj.data.scweightf / (n2.data.lentof - n1.data.lentof);
            } else if (diff == "into" || diff == "g2") {
                fracsolid = adj.data.scweightt / (n2.data.lentot - n1.data.lentot);
            } else {
                fracsolid = 
                    adj.data.scweightf / (n2.data.lentof - n1.data.lentof) * FRACFROM +
                    adj.data.scweightt / (n2.data.lentot - n1.data.lentot) * FRACTO;
                fracsolid /= (FRACFROM + FRACTO);
            }
            if (isNaN(fracsolid)) {
                fracsolid = 1;
            }
            var FRACSOLID_THRESH = 0.99;
            var qix = q1x + (q2x - q1x) * fracsolid;
            var qiy = q1y + (q2y - q1y) * fracsolid;

            if (SHOWBOTH && (diff == "inboth") && 
                weightf !== undefined && weightt !== undefined) {
                //diff lines
                ctx.beginPath();
                var space = 6;
                ctx.moveTo(q1x-space, q1y);
                ctx.lineWidth = space*2;
                ctx.strokeStyle = JitExtend.PRECOL;
                var targx = (weightf < weightt) ? (qix - q1x) * (weightf / weightt) + q1x - space : qix-space;
                var targy = (weightf < weightt) ? (qiy - q1y) * (weightf / weightt) + q1y : qiy; 
                ctx.lineTo(targx,targy);
                ctx.stroke();
                if (fracsolid < FRACSOLID_THRESH) {
                    ctx.beginPath();
                    ctx.moveTo(targx,targy);
                    ctx.lineWidth *= 0.3;
                    ctx.lineTo(q2x-space, q2y);
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.moveTo(q1x+space, q1y);
                ctx.lineWidth = space*2;
                ctx.strokeStyle = JitExtend.MUTCOL;
                targx = (weightf < weightt) ? qix+space : (qix - q1x) * (weightt / weightf) + q1x + space;
                targy = (weightf < weightt) ? qiy : (qiy - q1y) * (weightt / weightf) + q1y;
                ctx.lineTo(targx,targy);
                ctx.stroke();
                if (fracsolid < FRACSOLID_THRESH) {
                    ctx.beginPath();
                    ctx.moveTo(targx,targy);
                    ctx.lineWidth *= 0.3;
                    ctx.lineTo(q2x+space, q2y);
                    ctx.stroke();
                }
            } else {
                //regular lines
                ctx.beginPath();
                ctx.moveTo(q1x, q1y);
                ctx.lineTo(qix, qiy);
                ctx.stroke();
                if (fracsolid < FRACSOLID_THRESH) {
                    ctx.beginPath();
                    ctx.moveTo(qix, qiy);
                    ctx.lineWidth *= 0.3;
                    ctx.lineTo(q2x, q2y);
                    ctx.stroke();
                }
            }
        }
    }
    //,'contains': function(adj, pos) {  
    //  
    //}  
  },
  //side-by-side length comparison lines
  'compare-line': {
    'render': function(adj, canvas) {
        var p1 = adj.nodeFrom.pos.getc(true);
        var p2 = adj.nodeTo.pos.getc(true);
        var ctx = canvas.getCtx();
        
        if (adj.data.wpre && adj.data.wmut) {
            //fraction of the edge length for pre and mut components
            var prefac = adj.data.wpre / adj.data.wmut;
            var mutfac = 1.0;
            if (prefac > 1.0) {
                mutfac = 1.0 / prefac;
                prefac = 1.0;
            }
            var dx = p2.x - p1.x;
            var dy = p2.y - p1.y;
            
            var eoffset = 2;
            var w1 = 4;
            var w2 = 4;
            if (adj.data.spre && adj.data.smut) {
                //standard deviations for pre and mut components
                w1 = adj.data.spre;
                w2 = adj.data.smut
                eoffset = (w1+w2)/4.0;
            }
            
            ctx.lineWidth = w1;
            this.edgeHelper.line.render(
                {x: p1.x-eoffset, y: p1.y},
                {x: p1.x+dx*prefac-eoffset, y: p1.y+dy*prefac}, canvas);
            
            ctx.lineWidth = w2;
            this.edgeHelper.line.render(
                {x: p1.x+eoffset, y: p1.y},
                {x: p1.x+dx*mutfac+eoffset, y: p1.y+dy*mutfac}, canvas);
        }
    }
  }
};
$jit.ForceDirected.Plot.EdgeTypes.implement(JitExtend.addlEdgeTypes);

//angle computation for edge drawing           
/*
var a = Math.atan2(p2.y-p1.y, p2.x-p1.x);
var d = dist(p1,p2);
var dotc = {};
dotc.x = p1.x + Math.cos(a)*(d-20);
dotc.y = p1.y + Math.sin(a)*(d-20);
*/

JitExtend.getalpha = function(diff) {
    if (diff) {
        if (diff == "inboth") {
            if (SHOWBOTH) {
                //return Math.max(0.4,2 - (FRACFROM + FRACTO));
                return 1.0;
            } else {
                return Math.max(FRACFROM, FRACTO);
            }
        } else if (diff == "into") {
            return FRACTO;
        } else if (diff == "infrom") {
            return FRACFROM;
        } else if (diff == "g2") {
            return SHOWSBS ? 1.0 : 0.0;
        }
    }
    return 1;
}

var IMG_FROM = new Image();
IMG_FROM.src = "css/icons/dialog-fewer.png";
var IMG_TO = new Image();
IMG_TO.src = "css/icons/dialog-more.png";

/**
Additional Node types:
<dl>
<dt>rf-node</dt>
    <dd>Request flow node: render a color/stroke based on the graph diff (node.data.diff)
        and compute space occupancy (with contains)</dd>
</dl>
*/
JitExtend.addlNodeTypes = {  
  'rf-node': {  
    'render': function(node, canvas) {
        var p = node.pos.getc(true);
        
        var ctx = canvas.getCtx();
        ctx.save();
        var w = JitExtend.getNodeWidth(node) * (PAPER ? 1.5 : 1), h = FONTSIZE + (PAPER ? 10 : 8);

        var nc = "rgba(0,255,0,";
        if (node.data.lblcol) {    
            var c = node.data.lblcol;
            nc = c.replace("rgb","rgba").substring(0,c.length) + ",";
        } 
        if (node.data.diff) {
            if ((node.data.diff == "inboth") || !SHOWBOTH || (node.data.diff == "g2")) {
                ctx.fillStyle = ctx.strokeStyle = nc + JitExtend.getalpha(node.data.diff) + ")";
                ctx.fillRect(p.x - w/2, p.y - h/2 + 5, w, h, canvas);
                ctx.lineWidth = 2;
            } else if (node.data.diff == "into") {
                ctx.fillStyle = nc + FRACTO + ")";
                ctx.fillRect(p.x - w/2, p.y - h/2 + 5, w, h, canvas);
                //ctx.strokeStyle = "rgba(255,0,0," + JitExtend.getalpha(node.data.diff) + ")";
                ctx.strokeStyle = JitExtend.MUTCOL;
                ctx.lineWidth = 5;
                ctx.strokeRect(p.x - w/2, p.y - h/2 + 5, w, h);
                ctx.drawImage(IMG_TO, p.x - w/2 - 20, p.y - h/2);
            } else if (node.data.diff == "infrom") {
                ctx.fillStyle = nc + FRACFROM + ")";
                ctx.fillRect(p.x - w/2, p.y - h/2 + 5, w, h, canvas);
                ctx.strokeStyle = JitExtend.PRECOL;
                ctx.lineWidth = 5;
                ctx.strokeRect(p.x - w/2, p.y - h/2 + 5, w, h);
                ctx.drawImage(IMG_FROM, p.x - w/2 - 20, p.y - h/2 - 5);
            }
        } else {
            ctx.fillRect(p.x - w/2, p.y - h/2 + 5, w, h, canvas);
        }
        
        ctx.restore();
    }
    ,'contains': function(node, pos) {
        var p = node.pos.getc(true);
        var w = JitExtend.getNodeWidth(node), h = FONTSIZE + 8;
        
        return (pos.x < p.x + w/2) && (pos.x > p.x - w/2) && 
            (pos.y < p.y + h/2) && (pos.y > p.y - h/2);
    }  
  }  
};

JitExtend.getNodeWidth = function(node) {
    return node.name.length*10+FONTSIZE+8;
}

$jit.ForceDirected.Plot.NodeTypes.implement(JitExtend.addlNodeTypes);