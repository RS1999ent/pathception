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
@namespace Sugiyama layout
Based on implementation by C. Schanck (chris at schanck dot net) of Sugiyama layout algorithm
*/
var Layout = function(/**Graph*/ g, /**string*/ name) {
    this.name = name;
    this.g = g;
};

Layout.prototype.compute = function() {
    var g = this.g;
    var levels = this.levelFillWrap();
    this.levels = levels;

    this.gridsize = 0;
    for (var i = 0; i < this.levels.length; ++i) {
        this.gridsize = Math.max(this.gridsize, levels[i].length);
    }
    this.info("gridsize=", this.gridsize);
    
    //solve edge crosses
    this.uncrossAll(g, levels);
    
    //move to barycenter
    this.moveNodes(g, levels, this.gridsize);
    
    //move nodes into place based on grid position
    this.assignPos(levels, 400, 60);

    this.applyExtended(g);
}

Layout.prototype.applyExtended = function(g) {
    var thisex = $.extend({}, LAYOUTEX["all"], LAYOUTEX[this.name]);
    for (var i = 0; i < g.parsed.length; ++i) {
        var n = g.parsed[i];
        if (n.id in thisex) {
            n.data.startx = thisex[n.id].x;
        }
    }
}

var maxUndef = function() {
    var args = arguments;
    for (var i = 0; i < args.length; ++i) {
        if (!args[i]) {
            args[i] = 0;
        }
    }
    return Math.max.apply(Math, args);
}

var minUndef = function() {
    var args = arguments;
    for (var i = 0; i < args.length; ++i) {
        if (!args[i]) {
            args[i] = 0;
        }
    }
    return Math.min.apply(Math, args);
}

Layout.FROM = 1;
Layout.TO = 2;
Layout.BOTH = 4;

Layout.lr = PAPER ? 100 : 200;
Layout.basedist = 10;
Layout.efn = function(l, basedist) {
    //return l/200 + basedist * 2;
    //return l/500 + basedist;
    return (2.0/(1.0+Math.exp(-l/Layout.lr))-1.0) * Layout.lr * 2 + ((PAPER) ? 35 : Layout.basedist);
};

/**
 * @param basedist the shortest node-node distance
 * @param computeflags bit string with flags from Layout.FROM, Layout.TO, Layout.BOTH
 */
Layout.prototype.longestPath = function(/**Number*/ basedist, /**Array*/ levels, /**int*/ computeflags) {
    var g = this.g, n = g.topnode;
    //flatten the topological sort
    var topo = [];
    for (var i = 0; i < levels.length; ++i) {
        for (var j = 0; j < levels[i].length; ++j) {
            var n = levels[i][j];
            //length to in combined graph
            if (computeflags & Layout.BOTH) {
                n.data.lentob = 0;
                n.data.critpb = 0;
            }
            //length to in "to" graph
            if (computeflags & Layout.TO) { //&&!(n.data.diff == "into")
                n.data.lentot = 0;
                n.data.critpt = 0;
            }
            //length to in "from" graph
            if (computeflags & Layout.FROM) {
                n.data.lentof = 0;
                n.data.critpf = 0;
            }

            topo.push(n);
        }
    }

    Layout.basedist = basedist;

    //TODO: keep a queue of unconverged nodes
    for (var loop = 0; loop < 10; ++loop) {
        for (var i = 0; i < topo.length; ++i) {
            var v = topo[i];
            for (var j = 0; j < v.adjacencies.length; ++j) {
                var e = v.adjacencies[j];
                var w = g.index[(e.nodeFrom == v.id) ? e.nodeTo : e.nodeFrom];

                if (w) {
                    var wboth = maxUndef(e.data.weightf, e.data.weightt);
                    if (computeflags & Layout.BOTH) {
                        if (!e.data.scwboth) {
                            e.data.scwboth = Layout.efn(wboth);
                        }
                        if (w.data.lentob <= v.data.lentob + e.data.scwboth) {
                            w.data.lentob = v.data.lentob + e.data.scwboth;
                        }
                        if (w.data.critpb <= v.data.critpb + wboth) {
                            w.data.critpb = v.data.critpb + wboth;
                        }
                    }
                    if (computeflags & Layout.TO) {
                        if (e.data.weightt !== undefined) {
                            if (e.data.scweightt === undefined) {
                                e.data.scweightt = Layout.efn(e.data.weightt);
                            }
                            if (w.data.lentot <= v.data.lentot + e.data.scweightt) {
                                w.data.lentot = v.data.lentot + e.data.scweightt;
                            }
                            if (w.data.critpt <= v.data.critpt + e.data.weightt) {
                                w.data.critpt = v.data.critpt + e.data.weightt;
                            }
                        } else {
                            this.info("No to weight for edge when computing Layout.TO ", e);
                        }
                    }
                    if (computeflags & Layout.FROM) {
                        if (e.data.weightf !== undefined) {
                            if (e.data.scweightf === undefined) {
                                e.data.scweightf = Layout.efn(e.data.weightf);
                            }
                            if (w.data.lentof <= v.data.lentof + e.data.scweightf) {
                                w.data.lentof = v.data.lentof + e.data.scweightf;
                            }
                            if (w.data.critpf <= v.data.critpf + e.data.weightf) {
                                w.data.critpf = v.data.critpf + e.data.weightf;
                            }
                        } else {
                            this.info("No from weight for edge when computing Layout.FROM", e);
                        }
                    }
                } else {
                    this.info("Warning: no node found in graph for " + e.nodeTo);
                }
            }
        }
    }
}

Layout.prototype.info = function() {
    Util.info.apply(Util, arguments);
}

Layout.MAX_ITERATIONS = 100;

Layout.prototype.levelFillWrap = function() {
    return this.levelFillStackDAG(this.g, this.g.topnode, [], 0);
}

/**
Non-recursive version of levelFill
*/
Layout.prototype.levelFillStack = function(/**Graph*/ g, /**Node*/ n, /**Array[Array]*/ levels) {
    var stk = [];
    stk.push({lvl: 0, n: n});
    
    while (stk.length > 0) {
        var top = stk.pop();
        var n = top.n;
        var curlvl = top.lvl;
        
        if (!n.data[this.name]) {
            if (!levels[curlvl]) {
                levels[curlvl] = [];
            }
            levels[curlvl].push(n);
            n.data[this.name] = {
                levelno: curlvl,
                crossno: levels[curlvl].length,
                crossadd: 0,
                priority: 0,
                gridpos: 0
            };
            
            //for (var i = 0; i < n.adjacencies.length; ++i) {
            for (var i = n.adjacencies.length-1; i >= 0; --i) {
                var adj = n.adjacencies[i];
                var other = g.index[(adj.nodeFrom == n.id) ? adj.nodeTo : adj.nodeFrom];
                stk.push({lvl: curlvl+1, n: other});
            }
        }
    }
    
    return levels;
}

/**
Non-recursive version of levelFill
*/
Layout.prototype.levelFillStackDAG = function(/**Graph*/ g, /**Node*/ n, /**Array[Array]*/ levels) {
    var stk = [];
    stk.push({lvl: 0, n: n});
    
    for (var i = 0; i < g.parsed.length; ++i) {
        var n = g.parsed[i];
        n.data[this.name] = {
            levelno: 0,
            crossno: 0, //levels[curlvl].length,
            crossadd: 0,
            priority: 0,
            gridpos: 0
        };       
    }

    var iter = 0;
    while (stk.length > 0) {
        ++iter;
        var top = stk.pop();
        var n = top.n;
        var curlvl = top.lvl;
        n.data[this.name].levelno = Math.max(curlvl, n.data[this.name].levelno);
        
        //for (var i = 0; i < n.adjacencies.length; ++i) {
        for (var i = n.adjacencies.length-1; i >= 0; --i) {
            var adj = n.adjacencies[i];
            var other = g.index[adj.nodeTo]; //g.index[(adj.nodeFrom == n.id) ? adj.nodeTo : adj.nodeFrom];
            stk.push({lvl: curlvl+1, n: other});
        }
    }

    var lvldx = 0;
    for (var i = 0; i < g.parsed.length; ++i) {
        var n = g.parsed[i];
        var curlvl = n.data[this.name].levelno;
        while (lvldx <= curlvl) {
            if (!levels[lvldx]) {
                levels[lvldx] = [];
            }
            ++lvldx
        }
        levels[curlvl].push(n);
        n.data[this.name].crossno = levels[curlvl].length;
    }
    
    return levels;
}

/**
Recursive version of levelFill
*/
Layout.prototype.levelFill = function(/**Graph*/ g, /**Node*/ n, /**Array[Array]*/ levels, /**int*/ curlvl) {
    if (levels.length == curlvl) {
        levels.push([]);
    }
    
    if (!n.data[this.name]) {
        levels[curlvl].push(n);
        n.data[this.name] = {
            levelno: curlvl,
            crossno: levels[curlvl].length,
            crossadd: 0,
            priority: 0,
            gridpos: 0
        };
       
        for (var i = 0; i < n.adjacencies.length; ++i) {
            var adj = n.adjacencies[i];
            var other = g.index[(adj.nodeFrom == n.id) ? adj.nodeTo : adj.nodeFrom];
            this.levelFill(g, other, levels, curlvl + 1);
        }
    }
    
    return levels;
}

Layout.prototype.uncrossAll = function(/**Graph*/ g, /**Array[Array]*/ levels) {
    for (var iterations = 0; iterations < Layout.MAX_ITERATIONS; ++iterations) {
        var movements = 0;
        
        for (var i = 0; i < levels.length-1; ++i) {
            movements += this.uncrossLayer(g, levels[i], i, true);
        }
        
        for (var i = levels.length-1; i > 0; --i) {
            movements += this.uncrossLayer(g, levels[i], i, false);
        }
        
        this.info("uncross movements:", movements);
        if (0 == movements) {
            break;
        }
    }
}

Layout.prototype.crossind = function(/**Node*/ n) {
    return (n.data[this.name].crossadd == 0) ? 0 : n.data[this.name].crossno / n.data[this.name].crossadd;
}

Layout.prototype.uncrossLayer = function(/**Graph*/ g, /**Array*/ level, /**int*/ leveldx, /**bool*/ down) {
    var self = this;
    var movements = 0;
    
    var prevsort = level.slice(0);
    level.sort(function(a, b) {
        return self.crossind(b) - self.crossind(a);
    });
    
    for (var i = 0; i < level.length; ++i) {
        if (level[i].data[this.name].crossno != prevsort[i].data[this.name].crossno) {
            ++movements;
        }
    }
    
    this.info("uncrosslayer movements=", movements);
    
    for (var i = level.length-1; i > -1; --i) {
        var n = level[i];
        
        var iterarr = down ? n.adjacencies : n.incoming;
        for (var j = 0; j < iterarr.length; ++j) {
            var adj = iterarr[j];
            var other = g.index[(adj.nodeFrom == n.id) ? adj.nodeTo : adj.nodeFrom];
            
            //this condition should always fail... 
            if (!other) {
                continue;
            }
            
            if ( (down && other.levelno > leveldx) || (!down && other.levelno < leveldx) ) {
                other.data[this.name].crossno += this.crossind(n);
                other.data[this.name].crossadd += 1;
            }
        }
    }
    
    return movements;
}

Layout.prototype.moveNodes = function(/**Graph*/ g, /**Array[Array]*/ levels, /**int*/ gridsize) {
    for (var i = 0; i < g.parsed.length; ++i) {
        var n = g.parsed[i];
        
        for (var j = 0; j < n.adjacencies.length + n.incoming.length; ++j) {
            var adj = (j < n.adjacencies.length) ? n.adjacencies[j] : n.incoming[j-n.adjacencies.length];
            var other = g.index[(adj.nodeFrom == n.id) ? adj.nodeTo : adj.nodeFrom];
            
            //this condition should always fail... 
            if (!other) {
                continue;
            }
            
            if (other.levelno != n.levelno) {
                n.data[this.name].priority += 1;
            }
        }
    }
    for (var i = 0; i < levels.length; ++i) {
        for (var j = 0; j < levels[i].length; ++j) {
            levels[i][j].data[this.name].gridpos = j;
        }
    }
    
    for (var iterations = 0; iterations < Layout.MAX_ITERATIONS; ++iterations) {
        var movements = 0;
        
        for (var i = 0; i < levels.length-1; ++i) {
            movements += this.moveLevel(g, levels[i], i, gridsize);
        }
        
        for (var i = levels.length-1; i > 0; --i) {
            movements += this.moveLevel(g, levels[i], i, gridsize);
        }
        
        this.info("movenodes movements:", movements);
        if (0 == movements) {
            break;
        }
    }
}

Layout.prototype.moveLevel = function(/**Graph*/ g, /**Array*/ level, /**int*/ levelno, /**int*/ gridsize) {
    var movements = 0;
    
    for (var i = 0; i < level.length; ++i) {
        var n = level[i];
        var possum = 0;
        var nnodes = 0;
        
        for (var j = 0; j < n.adjacencies.length + n.incoming.length; ++j) {
            var adj = (j < n.adjacencies.length) ? n.adjacencies[j] : n.incoming[j-n.adjacencies.length];
            var other = g.index[(adj.nodeFrom == n.id) ? adj.nodeTo : adj.nodeFrom];
            
            possum += n.data[this.name].gridpos;
            ++nnodes;
        }
        
        if (nnodes > 0) {
            var newpos = Math.round(possum/nnodes);
            var toright = newpos > n.data[this.name].gridpos;
            var moved = true;
            while (newpos != n.data[this.name].gridpos && moved) {
                moved = this.move(toright, level, i, n.data[this.name].priority, gridsize);
                movements += (moved) ? 1 : 0;
            }
        }
    }
    
    return movements;
}

Layout.prototype.move = function(/**bool*/ toright, /**Array*/ level, /**int*/ dx, /**int*/ priority, /**int*/ gridsize) {
    var n = level[dx];
    var moved = false;
    var targetdx = dx + (toright) ? 1 : -1;
    var targetgp = n.data[this.name].gridpos + (toright) ? 1 : -1;
    
    if (targetgp < 0 || targetgp >= gridsize) {
        return false;
    }
    
    if ( (toright && dx == level.length - 1) || (!toright && dx == 0) ) {
        moved = true;
    } else {
        var n2 = level[targetdx];
        if (n2.data[this.name].gridpos == targetgp) {
            if (n2.data[this.name].priority >= priority) {
                return false;
            } else {
                moved = this.move(toright, level, targetdx, priority, gridsize);
            }
        } else {
            moved = true;
        }
    }
    
    if (moved) {
        n.data[this.name].gridpos = targetgp;
    }
    return moved;
}

Layout.prototype.assignPos = function(/**Array[Array]*/ levels, /**int*/ hspace, /**int*/ vspace) {
    for (var i = 0; i < levels.length; ++i) {
        for (var j = 0; j < levels[i].length; ++j) {
            var n = levels[i][j];
            
            n.data.startx = n.data[this.name].gridpos * hspace;
            n.data.starty = n.data[this.name].levelno * vspace;
        }
    }
}