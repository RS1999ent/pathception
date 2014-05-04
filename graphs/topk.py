#
# Copyright (c) 2014, Carnegie Mellon University.
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
# 1. Redistributions of source code must retain the above copyright
#    notice, this list of conditions and the following disclaimer.
# 2. Redistributions in binary form must reproduce the above copyright
#    notice, this list of conditions and the following disclaimer in the
#    documentation and/or other materials provided with the distribution.
# 3. Neither the name of the University nor the names of its contributors
#    may be used to endorse or promote products derived from this software
#    without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT
# HOLDERS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
# INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
# BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS
# OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
# AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
# LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY
# WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.
#


#extract the top k clusters from an output directory and place in a new one.
import sys, json, os, shutil

def topk(indir, k, outdir):
    idxfile = open(os.path.join(indir, "index.json"),"r")
    idx = json.load(idxfile)
    idxfile.close()
    
    for i in xrange(1,k+1):
        for j in xrange(1):
            n = str(idx[i][j])+".json"
            shutil.copy2(os.path.join(indir, n), os.path.join(outdir, n))

    outdxfile = open(os.path.join(outdir, "index.json"),"w")
    json.dump(idx[:k+1], outdxfile)
    outdxfile.close()

def usage(prog):
    print "usage: %s indir k outdir" % (prog)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        usage(sys.argv[0])
        sys.exit(1)
    topk(sys.argv[1], int(sys.argv[2]), sys.argv[3])