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

RFGraph.pluckstack = function(stk) {
    for (var i = 0; i < stk.length; ++i) {
        if (stk[i].diff == "inboth") {
            return stk.splice(i,1)[0];
        }
    }
    for (var i = 0; i < stk.length; ++i) {
        if (stk[i].diff == "infrom") {
            return stk.splice(i,1)[0];
        }
    }
    return stk.splice(0,1)[0];
}

var branchoffset = [-200,200,-400,400,-800,800,-1200,1200,-1600,1600];

/**
 * Internal computation for graph difference between two graphs
 * @param grf the "from" graph, as returned by makegraph
 * @param grt the "to" graph, as returned by makegraph
 */
RFGraph.walkDiff = function(/**Graph*/ grf, /**Graph*/ grt) {
    var globalbranch = 1;
    var grres = {
        parsed: [],
        index: {}
    };
    
    bfsnumber(grf);
    fromnamedx = name2nodedx(grf);
    bfsnumber(grt);
    tonamedx = name2nodedx(grt);
    
    var stk = [{
        diff: "inboth",
        from: grf.topnode,
        to: grt.topnode
        }];
    while (stk.length > 0) {
        //todo: select an "inboth" or "into" path
        var tp = pluckstack(stk);//stk.pop();
        info("PLUCK", tp.to.name, tp.to.data.bfsn, tp.diff);
        
        //mark as explored
        tp.to.data.used = true;
        
        if (tp.diff == "inboth") {
            //duplicated identical node
            var duped = dupnode(tp.to);
            duped.data.diff = "inboth";
            duped.data.startx = tp.from.data.startx;
            duped.data.starty = tp.from.data.starty;
            
            grres.parsed.push(duped);
            grres.index[duped.id] = duped;
            var fromnbr = neighbors(tp.from, grf.index);
            var tonbr = neighbors(tp.to, grt.index);
            
            //look through every edge in the compareto graph
            for (var i = 0; i < tonbr.length; ++i) {
                var tnbr = tonbr[i];
                var dx = nodeinarr(tnbr, fromnbr);
                //always connect up the "to" node
                var edge = dupedge(tp.to.adjacencies[i]);
                
                /*
                debug(tp.to.adjacencies[i].data.weight);
                debug(
                    remnl(grt.index[tp.to.adjacencies[i].nodeFrom].name), 
                    remnl(grt.index[tp.to.adjacencies[i].nodeTo].name)
                );
                */
                
                //if we'd like to pull edge weights from the precursor
                for (var j = 0; j < tp.from.adjacencies.length; ++j) {
                    var fj = tp.from.adjacencies[j];
                    if (grf.index[fj.nodeFrom].name == grt.index[tp.to.adjacencies[i].nodeFrom].name &&
                        grf.index[fj.nodeTo].name == grt.index[tp.to.adjacencies[i].nodeTo].name) {
                        //pull weight from precursor
                        edge.data.weight = fj.data.weight;
                    }
                }
                
                edge.data.diff = "into";
                duped.adjacencies.push(edge);
                if (dx > -1) {
                    //the matching node in the from graph
                    var fromsame = fromnbr.splice(dx, 1)[0];
                    
                    if (!fromsame.data.used) { fromsame.data.used = 0; }
                    fromsame.data.used += 1;
                    
                    stk.push({
                        diff: "inboth",
                        from: fromsame,
                        to: tnbr
                    });
                } else {
                    //XXX: this will not always work! (consider subtrees with branches)
                    globalbranch += 1;
                    //here, we have branched: tp.to into tnbr 
                    //  with no matching in the "from" graph
                    info("UNMATCHED", tp.to.data.bfsn, tp.from.name, tnbr);
                    stk.push({
                        diff: "into",
                        from: tp.from, //the node we branched at in the "from" graph
                        to: tnbr, //the new branch
                        branchno: globalbranch
                    });
                }
            }
            
            //nodes remaining here correspond to deletions from the "from" graph
            for (var i = 0; i < fromnbr.length; ++i) {
                var fnb = fromnbr[i];
                info("FROMNODE", tp.to, tp.from, fnb);
                
                //make a cross-edge from "to" graph to "from" graph
                duped.adjacencies.push({
                    data: {
                        weight: 10, //FIXME: get weight off "from" graph
                        diff: "infrom"
                    },
                    nodeFrom: tp.to.id,
                    nodeTo: fnb.id
                });
                //place the node to the "left" (arbitrarily) of the other.
                //fnb.data.startx = tp.to.data.startx - 400;
                
                stk.push({
                    diff: "infrom",
                    from: fnb,
                    to: tp.to
                });
            }
        } else if (tp.diff == "into") {
            var duped = dupnode(tp.to);
            duped.data.diff = "into";
            //XXX: see localbranch above
            duped.data.startx = tp.from.data.startx + branchoffset[tp.branchno];
            grres.parsed.push(duped);
            grres.index[duped.id] = duped;
            var tonbr = neighbors(tp.to, grt.index);
            
            //possibly connect up "to" neighbors
            for (var i = 0; i < tonbr.length; ++i) {
                var tnbr = tonbr[i];
                
                var candidates = fromnamedx[tnbr.name];
                var tomerge = null;
                if (candidates) {
                    for (var j = 0; j < candidates.length; ++j) {
                        var cand = candidates[j];
                        //heuristic for linking.
                        var okay = !cand.data.used || cand.data.used < cand.data.inlinks;
                        
                        //XXX: Magic Tuning Parameter (BFS lookahead)!
                        if (cand.data.bfsn - tp.from.data.bfsn < BFSLOOKAHEAD && okay) {
                            info("MERGE ", cand.name, cand.data.bfsn, tp.from.data.bfsn);
                            tomerge = cand;
                            
                            if (!cand.data.used) { cand.data.used = 0; }
                            cand.data.used += 1;
                        } 
                    }
                }
                
                if (!tonbr[i].data.used) {
                    duped.adjacencies.push(dupedge(tp.to.adjacencies[i]));
                    
                    if (null == tomerge) {
                        stk.push({
                            diff: "into",
                            from: tp.from,
                            to: tnbr,
                            branchno: tp.branchno
                        });
                    } else {
                        globalbranch -= 1;
                        info("MERGEOK", tomerge, tnbr);
                        stk.push({
                            diff: "inboth",
                            from: tomerge,
                            to: tnbr
                        });
                    }
                }
            }
        } else if (tp.diff == "infrom") {
            var duped = dupnode(tp.from);
            duped.data.diff = "infrom";
            grres.parsed.push(duped);
            grres.index[duped.id] = duped;
            
            var fromnbr = neighbors(tp.from, grf.index);
            
            for (var i = 0; i < fromnbr.length; ++i) {
                var fnbr = fromnbr[i];
                var candidates = tonamedx[fnbr.name];
                var tomerge = null;
                
                if (candidates) {
                    for (var j = 0; j < candidates.length; ++j) {
                        var cand = candidates[j];
                        info(cand.data.bfsn, tp.to.data.bfsn, cand.name, tp.from.name);
                        var bdiff = cand.data.bfsn - tp.to.data.bfsn;
                        if (bdiff < BFSLOOKAHEAD) {
                            info("FROMMERGE ", cand.name, cand.data.bfsn, tp.from.data.bfsn);
                            tomerge = cand;
                            break;
                        } 
                    }
                }
                
                if (null == tomerge) {
                    var edge = dupedge(tp.from.adjacencies[i]);
                    edge.data.diff = "infrom";
                    duped.adjacencies.push(edge);
                    stk.push({
                        diff: "infrom",
                        from: fnbr,
                        to: tp.to
                    });
                } else {
                    info("MERGEOK", fnbr.name, tomerge.name, tomerge.data.bfsn);
                    globalbranch -= 1;
                    //make a cross-edge from "from" graph to "to" graph
                    /*
                    duped.adjacencies.push({
                        data: {
                            weight: 10, //FIXME: get weight off "from" graph
                            diff: "infrom"
                        },
                        nodeFrom: tp.from.id,
                        nodeTo: tomerge.id
                    });*/
                }
            }
        } //end if
    } // end while
    
    // first pushed item on the stack is the top node
    grres.topnode = grres.parsed[0];
    return grres;
}

var BFSLOOKAHEAD = 10;







var makeHistogram = function() {
    //bin width for "histogram"
    var BW = 5;
    var dh = disthist(gres.parsed, BW);
    var pxmap = histtopx(dh);
    var histmax = Math.max.apply(Math, pxmap);
    var img = mkhistpic(dh, BW, 150/histmax);
    $("#hist-hist").empty();
    img[0].appendTo($("#hist-hist"));
    $("#hist-cont").css({
        "top": img[1] + $("#info-cont").height() + 10,
        "left": 30
    });
    var slide = $("#hist-slider");
    slide.css({
        "position": "absolute",
        "left": -20,
        "bottom": 0,
        "height": img[1]
    });
    slide.slider({
       "orientation": "vertical",
       "range": "true",
       "values": [0, img[1]],
       "min": 0,
       "max": img[1],
       "slide": function(evt, ui) {
            //look up the maximum and minimum
            // edge lengths in the map from px -> hist values
            MINEDGESEL = pxmap[ui.values[0]+1] * BW;
            MAXEDGESEL = (pxmap[ui.values[1]-1]+1) * BW;
            fd.plot();
        }
    });
    MINEDGESEL = 0;
    MAXEDGESEL = 1e10;
};

var mkhistpic = function(/**int[]*/ hist, /**int*/ bw, /**float*/ xscale) {
    var cont = $("<div></div>").css({
        "position": "absolute"
    });
    var px = 0;
    for (var i = 0; i < hist.length; ++i) {
        if (hist[i]) {
            cont.append(
              $("<div></div>").css({
                "position": "absolute",
                "left": 0,
                "bottom": px,
                "width": (i+1)*bw*xscale,
                "height": hist[i],
                "background-color": "#c00"
              })
            );
            px += hist[i];
        }
    }
    
    return [cont, px];
}