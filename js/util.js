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
@namespace General Utilities
*/
Util = {};

/**
Import module into namespace target.
*/
Util.importTo = function(/**dict*/ module, /**Object*/ target) {
    for (e in module) {
        target[e] = module[e];
    }
};

/**
@return a random integer between l and h
*/
Util.rint = function(/**int*/ l,/**int*/ h) {
    return Math.floor((Math.random()*(h+1-l))+l);
}

/**
@return arr[dx] if (dx in arr) else def
*/
Util.getdefault = function(arr, dx, def) {
    if (arr[dx]) {
        return arr[dx];
    } else {
        return def;
    }
}

/**
Print info
*/
Util.info = function() {
    console.log.apply(console, arguments);
}
/**
Print log
*/
Util.log = function() {
    console.log.apply(console, arguments);    
}

Util.MAXDEBUG = 100;
Util.debugn = 0;

/**
Print debug up to Util.MAXDEBUG messages
*/
Util.debug = function() {
    if (++Util.debugn < Util.MAXDEBUG) {
        console.log.apply(console, arguments);
    }
}

/**
Remove newlines from s
*/
Util.remnl = function(/**string*/ s) {
    return s.replace("\n", "");
}