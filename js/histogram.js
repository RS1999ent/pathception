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
@namespace Displayable histogram
*/
var Histogram = {};

/**
 * Compute a histogram of edge lengths for the given graph
 * @param nodes the list of graph nodes
 * @param bw the bin width
 */
Histogram.disthistRaw = function(/**Node[]*/ nodes, /**int*/ bw) {
    var hist = [];
    for (var i = 0; i < nodes.length; ++i) {
        for (var j = 0; j < nodes[i].adjacencies.length; ++j) {
            var adj = nodes[i].adjacencies[j];
            if (adj.data.weight) {
                var bdx = Math.floor(adj.data.weight / bw);
                if (hist[bdx]) {
                    hist[bdx] += 1;
                } else {
                    hist[bdx] = 1;
                }
            }
        }
    }
    return hist;
}

Histogram.histtopx = function(/**int[]*/ hist) {
    var px = 0;
    var map = [];
    for (var i = 0; i < hist.length; ++i) {
        if (hist[i]) {
            for (var j = px; j < px + hist[i]; ++j) {
                map[j] = i;
            }
            px += hist[i];
        }
    }
    
    return map;
}

Histogram.LOG = function(dta) { return Math.log(dta)/Math.log(10); }
Histogram.DELOG = function(dta) { return Math.pow(10,dta); }
Histogram.KF_F = function(dta) { return dta.weightf; }
Histogram.KF_LOGF = function(dta) { return Histogram.LOG(Histogram.KF_F(dta)+1); }
Histogram.KF_T = function(dta) { return dta.weightt; }
Histogram.KF_LOGT = function(dta) { return Histogram.LOG(Histogram.KF_T(dta)+1); }
Histogram.KF_D = function(dta) { return dta.weightt - dta.weightf; }
Histogram.KF_LOGD = function(dta) {
    var d = Histogram.KF_D(dta);
    if (isNaN(d)) {
        return NaN;
    } else {
        return Histogram.LOG(Math.abs(d) + 1) * ((d < 0) ? -1 : 1);
    }
}

/**
 * Find maximum/minimum length for precursor/mutation/individual-edge-difference
 *  edges in the graph
 */
Histogram.findBounds = function(
    /**Graph*/ g,
    /**Function*/ keyfn) {
    var bounds = {min:1e20,max:0};

    for (var i = 0; i < g.parsed.length; ++i) {
        for (var j = 0; j < g.parsed[i].adjacencies.length; ++j) {
            var adjd = g.parsed[i].adjacencies[j].data;
            var val = keyfn(adjd);
            if (!isNaN(val)) {
                bounds.max = Math.max(bounds.max, val);
                bounds.min = Math.min(bounds.min, val);
            }
        }
    }

    return bounds;
}

/**
 * @param g graph to compute histogram over
 * @param keyfn function to extract a key
 * @param b bounds with {max:,min:}
 * @param nbins number of bins for histogram
 */
Histogram.compute = function(
    /**Graph*/ g,
    /**Function*/ keyfn,  
    /**Bounds*/ b, 
    /**int*/ nbins) {
    var bins = [];
    var bdiff = b.max - b.min;
    for (var i = 0; i < nbins + 1; ++i) {
        bins.push([i/nbins*bdiff+b.min, 0]);
    }

    for (var i = 0; i < g.parsed.length; ++i) {
        for (var j = 0; j < g.parsed[i].adjacencies.length; ++j) {
            var adjd = g.parsed[i].adjacencies[j].data;
            var val = keyfn(adjd);
            var bindx = Math.floor((val-b.min)/bdiff*nbins);
            if (!isNaN(val) && !isNaN(bindx)) {
                bins[bindx][1] += 1;
            }
        }
    }

    return bins;
}

Histogram.cumsum = function(bins) {
    var newbins = [];
    var sum = 0;
    for (var i = 0; i < bins.length; ++i) {
        sum += bins[i][1];
        newbins.push([bins[i][0],sum]);
    }
    return newbins;
}
/**
 * Normalize a CDF
 */
Histogram.normalize = function(bins) {
    var newbins = [];
    var sum = 0;
    var maxval = bins[bins.length-1][1];
    for (var i = 0; i < bins.length; ++i) {
        newbins.push([bins[i][0],bins[i][1]/maxval]);
    }
    return newbins;   
}