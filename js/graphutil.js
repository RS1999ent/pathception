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
@namespace Graph utilities
*/
GraphUtil = {};

/**
Distance from p1 to p2
@param p1 a point with .x and .y
@param p2 a point with .x and .y
@return floating point euclidean distance
*/
GraphUtil.dist = function(p1,p2) {
    return Math.sqrt((p2.x-p1.x)*(p2.x-p1.x)+(p2.y-p1.y)*(p2.y-p1.y));
}

/**
Are two undirected edges equal? (based on nodeFrom and nodeTo)
*/
GraphUtil.edgeobjeq = function(/**Edge*/ a,/**Edge*/ b) {
    if (a.nodeFrom.id == b.nodeFrom.id && a.nodeTo.id == b.nodeTo.id) {
        return true;
    }
    if (a.nodeFrom.id == b.nodeTo.id && a.nodeTo.id == b.nodeFrom.id) {
        return true;
    }
    return false;
}

/**
 * is n1 == n2? (based on name)
 */
GraphUtil.noddeq = function(/**Node*/ n1, /**Node*/ n2) {
    return n1.name == n2.name;
}
/** 
 * is efrom == eto?
 * FIXME: use indexes
 */
GraphUtil.edgeeq = function(/**Edge*/ e1,e1dx,/**Edge*/ e2,e2dx) {
    return e1.nodeFrom == e2.nodeFrom && e1.nodeTo == e2.nodeTo;
}

/**
 * is n in arr? (based on name)
 * if yes, return the index
 * if no, return -1
 */
GraphUtil.nodeinarr = function(/**Node*/ n,/**Node[]*/ arr) {
    for (var i = 0; i < arr.length; ++i) {
        if (noddeq(n, arr[i])) {
            return i;
        }
    }
    return -1;
}
/**
 * is n in arr? (based on id)
 * if yes, return the index
 * if no, return -1
 */
GraphUtil.nodeidinarr = function(/**Node*/ n,/**Node*/ arr) {
    for (var i = 0; i < arr.length; ++i) {
        if (n.id == arr[i].id) {
            return i;
        }
    }
    return -1;
}

/**
 * is e in arr?
 */
GraphUtil.edgeinarr = function(/**Edge*/ e, /**int*/ edx,/**Edge[]*/ arr,/**int*/ arrdx) {
    for (var i = 0; i < arr.length; ++i) {
        if (edgeeq(e,edx,arr[i],arrdx)) {
            return i;
        }
    }
    return -1;
}

/**
 * get adjacent nodeset to n
 * @param index string => Node map
 */
GraphUtil.neighbors = function(/**Node*/ n,index) {
    var nbr = [];
    for (var i = 0; i < n.adjacencies.length; ++i) {
        var adj = n.adjacencies[i];
        nbr.push(index[(adj.nodeFrom == n.id) ? adj.nodeTo : adj.nodeFrom]);
    }
    return nbr;
}

/**
 * @return a 1-level deep copy of n (no copied adjacencies), data copied by ref
 */
GraphUtil.dupnode = function(/**Node*/ n) {
    return {
        adjacencies: [],
        data: n.data,
        id: n.id,
        name: n.name
    };
}

/**
 * @return a 1-level deep copy of e
 */
GraphUtil.dupedge = function(/**Edge*/ e) {
    return {
        data: e.data,
        nodeFrom: e.nodeFrom,
        nodeTo: e.nodeTo
    };
}

/**
 * Apply a breadth-first numbering to the given graph
 * @param gr the graph to bfs-number (gr.topnode is taken to be the root)
 */
GraphUtil.bfsnumber = function(gr) {
    var stk = [gr.topnode];
    var num = 0;
    while (stk.length > 0) {
        ++num;
        var tp = stk.splice(0,1)[0];
        var nbr = neighbors(tp, gr.index);
        tp.data.bfsn = num;
        
        for (var i = 0; i < nbr.length; ++i) {
            var n = nbr[i];
            if (!n.data.inlinks) {
                n.data.inlinks = 0;
            }
            n.data.inlinks += 1;
            if (!n.data.bfsn || n.data.bfsn == 0) {
                stk.push(n);
            }
        }
    }
}

/**
 * build a name -> node index for gr
 * @param gr a graph
 * @return map of string => int
 */
GraphUtil.name2nodedx = function(gr) {
    var ndx = {};
    for (var i in gr.index) {
        var name = gr.index[i].name;
        if (!(name in ndx)) {
            ndx[name] = [];
        }
        ndx[name].unshift(gr.index[i]);
    }
    return ndx;
}

var SIMPLEY_YSCALE = 0.02*10;

/**
Basic recursive y position proportional to edge weight
@param index the node name to object map
@param root the node we're currently considering
*/
GraphUtil.simpleypos = function(/**map*/ index, /**Node*/ root) {
    for (var i = 0; i < root.adjacencies.length; ++i) {
        var adj = root.adjacencies[i];
        var len = 20;
        if (adj.data.weight) {
            len += adj.data.weight * SIMPLEY_YSCALE;
        }
        
        var subn = index[root.id == adj.nodeFrom ? adj.nodeTo : adj.nodeFrom];
        if (subn.data.startyset) {
            subn.data.starty = Math.max(root.data.starty + len, subn.data.starty);
        } else {
            subn.data.starty = root.data.starty + len;
            subn.data.startyset = true;
        }
        simpleypos(index, subn);
    }
}

/**
 * Apply y positions to nodes n[] in g based upon value in n.data["key"]
 */
GraphUtil.applyY = function(/**Graph*/ g, /**string*/ key) {
    for (var k in g.index) {
        var n = g.index[k];
        n.data.starty = n.data[key];
    }
}

/**
 * Apply weighted y positions to nodes n[] in g based upon values 
 *  in n.data[keys[0].key]...n.data[keys[k].key], weighted by keys[0].w...keys[k].w
 */
GraphUtil.applyMultiY = function(/**Graph*/ g, /**Array[{key:string,w:Number}]*/ keys) {
    for (var k in g.index) {
        var n = g.index[k];
        var yp = 0;
        var wtotal = 0;
        for (var i = 0; i < keys.length; ++i) {
            if (n.data[keys[i].key] !== undefined) {
                yp += keys[i].w * n.data[keys[i].key];
                wtotal += keys[i].w;
            }
        }
        yp /= wtotal;
        if (n.data.diff != "g2") {
            n.data.starty = yp;
        }
    }
}

var testgraph = [
    {
    "adjacencies":["v2","v3"],
    "id":"v1",
    "name":"v1"
    },
    {
    "adjacencies":[],
    "id":"v2",
    "name":"v2"
    },
    {
    "adjacencies":[],
    //"data":{"$color":"#666","$type":"circle","$dim":15},
    "id":"v3",
    "name":"v3"
    }
];
