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
@namespace String edit distance
*/
Sed = {};

/**
 * @param index node name to object map as created by {@link RFGraph.makegraph}
 * @param root the node we're currently considering
*/
Sed.sortChildren = function(/**map*/ index, /**Node*/ root) {
    if (!root.data.sorted) {
        root.adjacencies = root.adjacencies.sort(function(a, b) {
            if (a.nodeTo === b.nodeTo) {
                return 0;
            } else {
                return (a.nodeTo < b.nodeTo) ? -1 : 1;
            }
        });
        root.data.sorted = true;
    }
    
    for (var i = 0; i < root.adjacencies.length; ++i) {
        var adj = root.adjacencies[i];
        var subn = index[root.id == adj.nodeFrom ? adj.nodeTo : adj.nodeFrom];
        if (!subn.data.sorted) {
            Sed.sortChildren(index, subn);
        }
    }
}

/**
 * Note: Adds traversal marks to the graph
 * @param options flattening params
 *      <dl>
 *      <dt>whole</dt><dd>the entire serialized list to append to (kept as a ref)</dd>
 *      <dt>dag</dt><dd>(set by dfsFlatten) if true, the graph is a dag, if false, it *might* not be.</dd>
 *      </dl>
 * @param index node name to object map
 * @param root the node we're currently considering
 */
Sed.dfsFlatten = function(/**dict*/ options, /**map*/ index, /**Node*/ root) {
    if (!root.data.flattened) {
        options.whole.push(root);
        root.data.flattened = true;
    }
    
    //TODO: flipped DFS ordering until we do chain-insertion sensitive cost
    //  i.e. cost for subsequent insertions is lower than cost for point insertion
    //for (var i = 0; i < root.adjacencies.length; ++i) {
    for (var i = root.adjacencies.length - 1; i >= 0; --i) {
        var adj = root.adjacencies[i];
        var subn = index[root.id == adj.nodeFrom ? adj.nodeTo : adj.nodeFrom];
        if (root.id != adj.nodeFrom) {
            Util.debug("Warning: edge directionality incorrect from", root.id, adj.nodeFrom, adj.nodeTo);
        }
        if (!subn.data.flattened) {
            Sed.dfsFlatten(options, index, subn);
        } else if (subn.data.dfsdone) {
            options.dag = false;
        }
    }
    root.data.dfsdone = true; 
    
    return options;
}

/**
 * Both graphs must have been flattened to string.
 * same is a linked list of
 *  f: node in source graph g1
 *  t: node in destination graph g2
 *  p: next pointer
 * diff is a list of
 *  f: node in source graph g1
 *  t: node in destination graph g2
 *  p1: position in source graph g1
 *  p2: position in destination graph g2
 * @param g1 graph "from"
 * @param g2 graph "to"
 * @return {
 *  same: a linked list of nodes that are paired in both graphs
 *  diff: a list of edits
 * }
 */
Sed.editDistance = function(g1,g2) {
    var s1 = g1.flat;
    var s2 = g2.flat;
    /*
    var min3t = function(a,b,c) {
        if (a.length < b.length && a.length < c.length) {
            return a;
        } else if (b.length < c.length) {
            return b;
        } else {
            return c;
        }
    };
    */
    
    //allocate
    var d = [];
    for (var i = 0; i <= s1.length; ++i) {
        d[i] = [];
        for (var j = 0; j <= s2.length; ++j) {
            d[i].push([]);
        }
    }
    
    /*
    diff is a tuple of:
        p: parent
        l: length
        v: value
    same is a tuple of:
        p: parent
        f: from char
        t: to char
    */
    var mkcell = function() {
        return {same:null, diff:{p:null, l: 0, v:null}};
    }
    
    var dst = mkcell();
    for (var i = 0; i <= s1.length; ++i) {
        d[i][0] = dst;
        dst = {
            same: dst.same,
            diff: {p: dst.diff, l: dst.diff.l+1, v: {f: s1[i], t: null, p1: i, p2: 0}}
        };
    }
    dst = mkcell();
    for (var i = 0; i <= s2.length; ++i) {
        d[0][i] = dst;
        dst = {
            same: dst.same,
            diff: {p: dst.diff, l: dst.diff.l+1, v: {f: null, t: s2[i], p1: 0, p2: i}}
        };
    }
    
    for (var j = 1; j <= s2.length; ++j) {
        for (var i = 1; i <= s1.length; ++i) {
            var c1 = s1[i-1];
            var c2 = s2[j-1];
            if (c1.key === c2.key) {
                d[i][j] = {same: {f: c1, t: c2, p: d[i-1][j-1].same}, diff: d[i-1][j-1].diff};
            } else {
                var m1 = d[i-1][j], d1 = {p: m1.diff, l: m1.diff.l+1, v:{f: c1, t: null, p1: i-1, p2: j}},
                    m2 = d[i][j-1], d2 = {p: m2.diff, l: m2.diff.l+1, v:{f: null, t: c2, p1: i, p2: j-1}},
                    m3 = d[i-1][j-1], d3 = {p: m3.diff, l: m3.diff.l+1, v:{f: c1, t: c2, p1: i-1, p2: j-1}};
                var m = null;
                
                if (d1.l < d2.l && d1.l < d3.l) {
                    d[i][j] = {same: m1.same, diff: d1};
                } else if (d2.l < d3.l) {
                    d[i][j] = {same: m2.same, diff: d2};
                } else {
                    d[i][j] = {same: m3.same, diff: d3};
                }
            }
        }
    }
    
    var rv = d[s1.length][s2.length];
    rv.diff = Sed.unrollDiff(rv.diff);
    return rv;
}

/**
 * unroll a "same" linked list into a bidimap of ids in each graph to nodes in the other.
 */
Sed.unrollSame = function(same) {
    var lst = [];
    var fdmap = {};
    var revmap = {};
    var n = same;
    while (null != n) {
        lst.push({f: n.f, t: n.t});
        fdmap[n.f.id] = n.t;
        revmap[n.t.id] = n.f;
        n = n.p;
    }
    return {
        lst: lst,
        fd: fdmap,
        rev: revmap
    };
}

/**
 * unroll a "diff" linked list into a list of f/t/p1/p2 pairs
 */
Sed.unrollDiff = function(diff) {
    var lst = [];
    var d = diff;
    while (null != d.p) {
        lst.unshift(d.v);
        d = d.p;
    }
    return lst;
}