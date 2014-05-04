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
@namespace Request flow graph functions
*/
RFGraph = {};

/**
Load the given precursor/mutation pair into the main window.
@param prec the precursor name
@param mut the mutation name
@param cont what to run when loaded (gets passed the graphdiff result)
*/
RFGraph.loadgraph = function(/**string*/ prec, /**string*/ mut, /**function*/ cont) {
    getgraph(prec, function(gpre) {
        getgraph(mut, function(gmut) {
            var result = dodiff(gpre, gmut);
            result.copymut = RFGraph.loadMutation(result.gpre, gmut);
            result.origpre = gpre;
            result.origmut = gmut;
            cont(result);
        });
    });
}

RFGraph.loadMutation = function(gpre, mutation) {
    var gmut = RFGraph.flatten(makegraph(mutation, {
        cols: gpre.cols,
        coldx: gpre.coldx,
        lblregex: /\d+us/ig,
        edgetimedx: 1,
        edgetimekey: "weightt",
        colorkey: "colort"
    }));
    var layt = new Layout(gmut,"lt");
    layt.compute();
    layt.longestPath(30, layt.levels, Layout.TO);
    GraphUtil.applyY(gmut, "lentot");
    //copy layout keys into lentob
    gmut.topnode.data.lentot = 0;
    for (var k in gmut.index) {
        var n = gmut.index[k];
        n.data.lentob = n.data.lentot;
        n.data.critpb = n.data.critpt;
    }
    return gmut;
};

RFGraph.MOD_ADDCOPY = function(n) {
    return n + ".c";
}
/**
 * Modify node IDs in graph g by applying fn(str) -> str
 * Modifies g.
 */
RFGraph.modifyNames = function(g, fn) {
    if (g.parsed) {
        for (var i = 0; i < g.parsed.length; ++i) {
            g.parsed[i].id = fn(g.parsed[i].id);
            for (var j = 0; j < g.parsed[i].adjacencies.length; ++j) {
                var adj = g.parsed[i].adjacencies[j];
                adj.nodeFrom = fn(adj.nodeFrom);
                adj.nodeTo = fn(adj.nodeTo);
            }
        }
    }
    if (g.index) {
        var oldindex = g.index;
        g.index = {};
        for (var k in g.index) {
            g.index[fn(k)] = oldindex[k];
        }
    }
    return g;
}

RFGraph.parallelLines = function(g1, g2orig, samemap) {
    var index = g1.index;
    var parsed = g1.parsed;
    var g2  = RFGraph.modifyNames(g2orig, RFGraph.MOD_ADDCOPY);

    //find out max x pos of g1
    var maxx = 0;
    for (var i = 0; i < g1.parsed.length; ++i) {
        var n = g1.parsed[i];
        if (n.data.diff == undefined || n.data.diff == "infrom") {
            maxx = Math.max(n.data.startx, maxx);
        }
    }

    //copy and translate right the second graph
    var XLATEX = PAPER ? 800 : 700;
    for (var i = 0; i < g2.parsed.length; ++i) {
        var n = g2.parsed[i];
        index[n.id] = n;

        n.data.startx += (maxx + XLATEX);
        n.data.diff = "g2";
        for (var j = 0; j < n.adjacencies.length; ++j) {
            n.adjacencies[j].data.diff = "g2";
        }

        parsed.push(n);
    }

    //Add connector edges
    for (var i = 0; i < samemap.lst.length; ++i) {
        var it = samemap.lst[i];
        var adj = {
            nodeFrom: it.f.id,
            nodeTo: RFGraph.MOD_ADDCOPY(it.t.id),
            data: {
                diff: "parl"
            }
        };
        index[it.f.id].adjacencies.push(adj);
    }

    return {
        "index": index,
        "topnode": g1.topnode,
        "parsed": parsed
    };
};

/**
Current root directory for precursor/mutation graphs
*/
RFGraph.ROOTDIR = "graphs/mdsconfig/out";

RFGraph.setdir = function(/**string*/ dir) {
    RFGraph.ROOTDIR = dir;
}

/**
 * Load the graph with the specified id with an XHR
 * @param id graph id name
 * @param cont continuation that gets invoked with graph.
 */
RFGraph.getgraph = function(/**string*/ id, /**function*/ cont) {
    //if false, defeat caching by sending a unique querystring
    var CACHE = false;
    $.ajax(RFGraph.ROOTDIR + "/" + id + ".json", {
        data: {
            "uniq": CACHE ? 0 : (new Date().getTime())
        },
        complete: function(obj, tdata) {
            var txt = obj.responseText;
            //XXX: because it's not in JSON, just eval it.
            eval('var graph = eval(' + txt + ')');
            cont(graph);
        }
    });
}

RFGraph.flatten = function(/**Graph*/ graph) {
    Sed.sortChildren(graph.index, graph.topnode);
    var flat = Sed.dfsFlatten({whole: []}, graph.index, graph.topnode);
    graph.flat = flat.whole;
    return graph;
}

/**
Helper for computing the diff between two graphs
*/
RFGraph.dodiff = function(/**GraphData*/ precursor, /**GraphData*/ mutation) {
    //initial colors for request flow graphs
    var icoldx = -1;
    var initialcols = {
        4: Const.COLORS[++icoldx],
        255: Const.COLORS[++icoldx],
        100: Const.COLORS[++icoldx],
        10: Const.COLORS[++icoldx],
        5100: Const.COLORS[++icoldx]
    };
 	var gpre = RFGraph.flatten(makegraph(precursor, {
        cols: initialcols,
        coldx: icoldx,
        lblregex: /\d+us/ig,
        edgetimedx: 0,
        edgetimekey: "weightf",
        colorkey: "colorf"
    }));   
 	var gmut = RFGraph.flatten(makegraph(mutation, {
        cols: gpre.cols,
        coldx: gpre.coldx,
        lblregex: /\d+us/ig,
        edgetimedx: 1,
        edgetimekey: "weightt",
        colorkey: "colort"
    }));

    //for the original algorithm
    //var gdiff = RFGraph.walkDiff(gpre, gmut);
    
    var layf = new Layout(gpre,"lf");
    layf.levels = layf.levelFillWrap();
    //layf.compute();
    layf.longestPath(30, layf.levels, Layout.FROM);

    var layt = new Layout(gmut,"lt");
    layt.levels = layt.levelFillWrap();
    //layt.compute();
    layt.longestPath(30, layt.levels, Layout.TO);

    var dist = Sed.editDistance(gpre, gmut);
    var samemap = Sed.unrollSame(dist.same);
    var gdiff = RFGraph.mergedGraph(gpre, gmut, dist.diff, samemap);
    
    //Layout.levels has a topological sort of the vertices
    var layb = new Layout(gdiff,"lb");
    layb.compute();
    layb.longestPath(30, layb.levels, Layout.BOTH);
    //var layblvls = layb.levels;
    //layb.levels = layt.levels;
    //layb.longestPath(20);
    //layb.levels = layblvls;

    //calculate y positions (only do this once!)
    //simpleypos(gdiff.index, gdiff.topnode);
    GraphUtil.applyY(gdiff, "lentob");
    //this doesn't get computed by algo
    gdiff.topnode.data.lentot = 0;

    return { 
        gpre: gpre,
        gmut: gmut,
        samemap: samemap,
        gres: gdiff
    };
}

RFGraph.mergedGraph2 = function(/**Graph*/ grf, /**Graph*/ grt, /**Array*/ diff, /**Object*/ samemap) {
    /*
    parsed: list of nodes
    index: map of nodenames -> nodes
    topnode: the top node
    */
    var curnodeid = 5;
    var mknode = function(keystr, namestr, diffstr) {
        var n = {
            id: (++curnodeid) + "",
            adjacencies: [],
            incoming: [],
            key: keystr,
            name: namestr,
            data: {
                diff: diffstr
            }
        };
    };
    var extend = function(node, data) {
        $.extend(node.data, data);
    };

    var parsed = [];
    for (var i = 0; i < samemap.lst.length; ++i) {
        
    }
}

/**
 * Compute the merged graph. Modifies nodes in both the source and destination graph.
 * Assumes root nodes are the same.
 * @param grf source graph
 * @param grt destination graph
 * @param diff list of diffs from grf->grt
 * @param samemap bidi map of same node IDs to nodes between grf and grt, as generated by Sed.unrollSame
 */
RFGraph.mergedGraph = function(/**Graph*/ grf, /**Graph*/ grt, /**Array*/ diff, /**Object*/ samemap) {
    var labelpris = {"inboth": 1, "infrom": 2, "into": 2};
    var setlabel = function(adj, label) {
        if ( (!labelpris[adj.data.diff]) || (labelpris[adj.data.diff] < labelpris[label]) ) {
            adj.data.diff = label;
        }
    }
    
    //always make labels more conservative
    var labelEdges = function(n, label) {
        for (var j = 0; j < n.adjacencies.length; ++j) {
            //n.adjacencies[j].data.diff = label;
            setlabel(n.adjacencies[j],label);
        }
        for (var j = 0; j < n.incoming.length; ++j) {
            //n.incoming[j].data.diff = label;
            setlabel(n.incoming[j],label);
        }
    };
    //find correspondence for edge weights
    var diffEdges = function(nf, nflist, nt, ntlist) {
        //this could be O(n log n) instead of O(n^2), but n is small for request flow graphs
        for (var j = 0; j < nflist.length; ++j) {
            var adjf = nflist[j];
            var onf = grf.index[(adjf.nodeFrom == nf.id) ? adjf.nodeTo : adjf.nodeFrom].name;
            var match = false;
            for (var k = 0; k < ntlist.length; ++k) {
                var adjt = ntlist[k];
                var ont = grt.index[(adjt.nodeFrom == nt.id) ? adjt.nodeTo : adjt.nodeFrom].name;
                if (onf == ont) {
                    match = adjt;
                }
            }
            if (match) {
                //copy over identical keys
                if (match.data.weightt !== undefined) {
                    adjf.data.weightt = match.data.weightt;
                }
                if (match.data.scweightt !== undefined) {
                    adjf.data.scweightt = match.data.scweightt;
                }
                if (match.data.colort !== undefined) {
                    adjf.data.colort = match.data.colort;
                }
            } else {
                adjf.data.diff = "infrom";
            }
        }
    };
    
    //tag all inboth
    for (var i = 0; i < samemap.lst.length; ++i) {
        samemap.lst[i].f.data.diff = "inboth";
        //Even if all the edges are not inboth, they will be retagged in the diff below.
        //Unfortunately, this doesn't produce the correspondence for the edges
        labelEdges(samemap.lst[i].f, "inboth");

        var nf = samemap.lst[i].f,
            nt = samemap.lst[i].t;
        diffEdges(nf, nf.adjacencies, nt, nt.adjacencies);
        diffEdges(nf, nf.incoming, nt, nt.incoming);

        //copy over any missing layout
        if (nt.data.lentot) {
            nf.data.lentot = nt.data.lentot;
        }
        if (nt.data.critpt) {
            nf.data.critpt = nt.data.critpt;
        }
    }
    
    var addadj = [];
    
    //tag differences
    for (var i = 0; i < diff.length; ++i) {
        var d = diff[i];
        if (d.t == null) {
            //easy case: it's only in the from graph; edges are fine.
            d.f.data.diff = "infrom";
            //incoming/outgoing edges are only in from
            labelEdges(d.f, "infrom");
        } else {
            var t = d.t;
            t.data.diff = "into";
            //copy over the node
            grf.parsed.push(t);
            grf.index[t.id] = t;
            //attempt to map edges
            var newadj = [];
            for (var j = 0; j < t.adjacencies.length; ++j) {
                var adj = t.adjacencies[j];
                var copy = GraphUtil.dupedge(adj);
                var childid = (adj.nodeFrom == t.id) ? adj.nodeTo : adj.nodeFrom;
                if (childid in samemap.rev) {
                    //we can map back to the from graph
                    if (adj.nodeFrom == t.id) {
                        copy.nodeTo = samemap.rev[childid].id;
                    } else {
                        copy.nodeFrom = samemap.rev[childid].id;
                    }
                } //else keep the original edge
                copy.data.diff = "into";
                newadj.push(copy);
            }
            t.adjacencies = newadj;
            
            //look for missing incoming edges
            for (var j = 0; j < t.incoming.length; ++j) {
                var adj = t.incoming[j];
                var childid = (adj.nodeFrom == t.id) ? adj.nodeTo : adj.nodeFrom;
                if (childid in samemap.rev) {
                    var dupedge = {nodeFrom: samemap.rev[childid].id, nodeTo: t.id, data: adj.data};
                    dupedge.data.diff = "into";
                    addadj.push(dupedge);
                }
            }
            
            if (d.f != null) {
                d.f.data.diff = "infrom";
                labelEdges(d.f, "infrom");
            }
        }
    }
    
    //add missing incoming edges
    for (var i = 0; i < addadj.length; ++i) {
        var adj = addadj[i];
        grf.index[adj.nodeFrom].adjacencies.push(adj);
    }

    for (var i = 0; i < grf.parsed.length; ++i) {
        grf.parsed[i].data.adjacencies = grf.parsed[i].adjacencies;
        grf.parsed[i].data.incoming = grf.parsed[i].incoming;
    }

    return grf;
}

/**
 * @param graph the graph to compute
 * @param options override vars for graph comparison
 *      <dl>
 *      <dt>cols</dt><dd>the existing map of node type -> color
 *          (default {})</dd>
 *      <dt>coldx</dt><dd>the index in the colormap to resume at
 *          (default 0)</dd>
 *      <dt>lblregex</dt><dd>the regex used to compute numbers from edges
 *          (default match first floating point number)<dd>
 *      </dl>
 * @return a dict with:
 *      <dl>
 *      <dt>parsed</dt><dd>the parsed graph</dd>
 *      <dt>index</dt><dd>map from node id to node</dd>
 *      <dt>cols</dt><dd>the resulting colormap</dd>
 *      <dt>coldx</dt><dd>color index we left off at</dd>
 *      </dl>
 */
RFGraph.makegraph = function(graph, options) {
    var gr = graph;
    var cols = getdefault(options, "cols", {});
    var coldx = getdefault(options, "coldx", 0);
	var lblregex = getdefault(options, "lblregex", /\d+\.\d+/ig);
    var edgetimedx = getdefault(options, "edgetimedx", 0); //index to parse the edge time from
    var edgetimekey = getdefault(options, "edgetimekey", "weight"); //key to place the edge time in
    var colorkey = getdefault(options, "colorkey", "color"); //key to place the edge color in

    //input bounding box
    var bbox = [0,0,100,100];
    var S_HEIGHT = 1000;
    var S_WIDTH = 1300;
    
	var index = {};
	var parsed = [];
    
    var topnode = null;
    var topnodey = 1000;
    
	for (var i = 0; i < gr.nodes.length; ++i) {
        var tn = gr.nodes[i];
        var initx = 0;
        var inity = 0;
        var pos = tn["pos"];
        if (pos) {
            var sdx = pos.indexOf(",");
            initx = parseInt(pos.substr(0, sdx));
            inity = parseInt(pos.substr(sdx+1));
            initx = (initx - bbox[0]) * S_WIDTH / bbox[2] - S_WIDTH/2;
            inity = S_HEIGHT/2 - (inity - bbox[1]) * S_HEIGHT / bbox[3];
        }
        
        var lbl = tn["label"];
        var fulllbl = lbl;
        var lblcol = 0;
        var eid = 0;
        var tid = 0;
        if (lbl) {
            lbl = lbl.trim();
            lblsp = lbl.split("__");
            //length to start trimming lbl
            var substlen = 0;
            //match the eXXX or SSXXX
            if (lblsp.length > 0) {
                var ematch = (/[A-Za-z]*(\d+)_?/ig).exec(lblsp[0]);
                //we found a numeric match
                if (ematch && ematch.length > 1) {
                    eid = parseInt(ematch[1],10);
                    if (eid in cols) {
                        lblcol = cols[eid];
                    } else {
                        Util.info("Color not found for key ", eid);
                        lblcol = cols[eid] = Const.COLORS[++coldx];
                    }
                    //if there was a __, add 2 to the length of the matched string
                    substlen += ematch[0].length + ((lblsp.length > 1) ? 2 : 0);
                }
                ematch = (/[A-Za-z]*(\d+)/ig).exec(lblsp[1]);
                if (ematch && ematch.length > 1) {
                    tid = parseInt(ematch[1],10);
                    substlen += lblsp[1].length + 2;
                }

                lbl = getReadableName(lbl, eid, tid, lbl.substring(substlen));
            }
        }
        
		var thenew = {
			"id":tn["id"],
			"key":fulllbl,
            "name":lbl,
			"adjacencies":[],
            "incoming":[],
            data: {
                "startx":initx,
                "starty":inity, //parseFloat(gr.nodes[i]["id"])
                "lblcol":lblcol,
                "nodeid":eid,
                "threadid":tid
            }
		};
        
        //dot output includes a node with id="node" and one with id="graph"
        if (tn["id"] == "graph") {
            if (tn["bb"]) {
                bbox = tn["bb"].split(",").map(function(x) {return parseInt(x);});
            }
        } else if (tn["id"] == "node") {
        
        } else if (tn["id"] == "1") {
            //cluster summary node
        } else {
            parsed.push(thenew);
            index[thenew.id] = thenew;
            
            //find the "top" node if it was topmost in the layout
            if (pos && inity < topnodey) {
                topnode = thenew;
                topnodey = inity;
            }
        }
	}
    
	//pull out edges
	for (var i = 0; i < gr.edges.length; ++i) {
        var te = gr.edges[i];
		var from = te.from;
		var to = te.to;
        
        //attempt to parse a microsecond number from the label
        var edgetime = 10;
        var edgetimes = [];
        if (te.label) {
            var lblm = te.label.match(lblregex);
            //try the fallback
            if (!lblm) {
                lblm = te.label.match(/([\d\.]+)/ig);
            }
            if (lblm) {
                for (var j = 0; j < lblm.length; ++j) {
                    edgetimes.push(parseFloat(lblm[j]));
                }
                if (!edgetimes[edgetimedx]) {
                    edgetime = edgetimes[0];
                } else {
                    edgetime = edgetimes[edgetimedx];
                }
                edgetime = Math.max(0, edgetime);
            } else {
                Util.log("Couldn't parse label", te.label);
            }
        }
        
        var ne = {
            "nodeFrom": from,
            "nodeTo": to,
            "data": {
                "allweights": edgetimes
            }
        };
        if (te.color) {
            ne.data[colorkey] = te.color;
        }
        ne.data[edgetimekey] = edgetime;

        index[from].adjacencies.push(ne);
        index[to].incoming.push(ne);
	}
	
    //we couldn't get the top node from layout, get it through zero-length incoming
    if (null == topnode) {
        zeroins = [];
        for (var i = 0; i < parsed.length; ++i) {
            if (parsed[i].incoming.length == 0) {
                zeroins.push(parsed[i]);
            }
        }
        if (zeroins.length > 0) {
            info("Warning: more than one node with indegree 0!", zeroins);
        }
        topnode = zeroins[0];
    }
    
    return {
        "parsed": parsed,
        "topnode": topnode,
        "index": index,
        "cols": cols,
        "coldx": coldx
    };
}

/**
 * Get a "human-readable" version of a callpoint label
 * @param original the original label
 * @param eid the machine identifier
 * @param tid the "t" identifier (?)
 * @param lastpart the remaining string
 * @return a string that will be displayed in the visualization
 */
RFGraph.getReadableName = function(/**string*/ original, /**int*/ eid, /**int*/ tid, /**string*/ lastpart) {
    //original: something like 'e10__t3__RPC_CALL_TYPE'
    //lastpart: something like 'RPC_CALL_TYPE'

    //This is what we did before to make "readable" names.
    //lastpart = lastpart.replace("_TYPE\n"," ");
    //lastpart = lastpart.replace("DEFAULT","");

    var hname = lastpart;
    if (original in HUMAN_NAMES) {
        hname = HUMAN_NAMES[original];
    } else {
        lastpart = lastpart.replace("\n","_");
        if (lastpart in HUMAN_NAMES) {
            hname = HUMAN_NAMES[lastpart];
        } else {
            if (lastpart.length < 40) {
                console.log("NO MATCH FOR", lastpart);
            }
        }
    }

    return hname;
};