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


import sys, os, re

#parse options
EXPECT_SEMI = False # do we expect a semicolon at the end of a line?

#states
S_OUTSIDE = 1
S_INSIDE_V = 2
S_INSIDE_E = 3

TEMPNAME = "temp.json"

def doread(fil, outdir):
    state = S_OUTSIDE
    liststart = " "
    fileno = 1
    
    curclusterid = ""
    curclusterpred = ""
    
    #create an index of precursor/mutation pairs
    #This index is written when the mutation DOT file is parsed
    indexfile = open(outdir + "/index.json","w")
    indexfile.write("[")
    indexfile.write("{}\n")
    
    #write out ordered IDs for other utils (e.g. copy top k)
    clustersfile = open(outdir + "/index.txt","w")
    
    outp = open(TEMPNAME,"w")
    fp = open(fil,"r")
    line = ""
    for curl in fp:
        curl = curl.strip()
        if len(curl) == 0 or curl[0] == "#":
            continue
        
        #deal with dot's breaking across lines
        if EXPECT_SEMI:
            line += curl
            if line[-1] not in ["{",";","}"]:
                continue
        else:
            line = curl
            
        if state == S_OUTSIDE:
            if line[-1] == "{":
                n = line[:-1].strip()
                #outp.write("graphs['%s'] = {\n" % n)
                outp.write("{")
                outp.write('  "nodes": [\n')
                liststart = " "
                state = S_INSIDE_V
        else:
            if (state == S_INSIDE_V) or (state == S_INSIDE_E):
                if line[-1] == "}":
                    outp.write("    ]\n")
                    outp.write("}\n")
                    state = S_OUTSIDE
                    outp.close()
                    try:
                        os.rename(TEMPNAME, outdir + "/" + curclusterid + ".json")
                    except:
                        print "Ignorning existing cluster " + curclusterid
                    outp = open(TEMPNAME, "w")
            if state == S_INSIDE_V:
                if "->" in line:
                    outp.write("  ],\n")
                    state = S_INSIDE_E
                    outp.write('  "edges": [\n')
                    liststart = " "
                    #fall through to S_INSIDE_E
                else:
                    sloc = line.find(" ")
                    s3loc = line.rfind("]")
                    data = convdata(line[sloc+2:s3loc])
                    theid = line[:sloc]
                    #the information line has id=1
                    if theid == "1":
                        #XXX: this should be parsed more cleanly
                        res = re.search(r"Cluster ID: (\d+)",data)
                        curclusterid = res.group(1)
                        res = re.search(r"riginating clusters: (\d+)",data)
                        curprecursorid = curclusterid
                        if res != None:
                            curprecursorid = res.group(1)
                        curcost = "0"
                        res = re.search(r"Cost: (\d+)",data)
                        if res != None:
                            curcost = res.group(1)
                        curmuttype = "null"
                        res = re.search(r"Specific Mutation Type: ([A-Za-z ]+)",data)
                        if res != None:
                            curmuttype = '"' + res.group(1) + '"'

                        indexfile.write(',{"id":' + curclusterid + 
                            ',"precursor":' + curprecursorid + 
                            ',"cost":' + curcost + 
                            ',"type":' + curmuttype + '}\n')
                        clustersfile.write(curclusterid + " " + curprecursorid + "\n")

                    outp.write('    %s{"id":"%s", %s}\n' % (liststart, theid, data))
                    if liststart == " ":
                        liststart = ","
            if state == S_INSIDE_E:
                s1loc = line.find(" -> ")
                s2loc = line.find(" ", s1loc+5)
                s3loc = line.rfind("]")
                data = convdata(line[s2loc+2:s3loc])
                outp.write('    %s{"from":"%s", "to":"%s", %s}\n' % (liststart, line[:s1loc], line[s1loc+4:s2loc], data))
                if liststart == " ":
                    liststart = ","
        line = ""
    fp.close()
    
    indexfile.write("]")
    indexfile.close()
    
    clustersfile.close()

#convert DOT-format data string to JSON K/V string
def convdata(st):
    return convdata_nocomma(st)

def convdata_comma(st):
    #sub: substring
    #edx: index of =
    def convsingle(sub, edx):
        edx = sub.find("=")
        if sub[edx+1] == '"':
            return '"' + sub[:edx] + '":' + sub[edx+1:]
        else:
            return sub[:edx] + ':"' + sub[edx+1:] + '"'
    arr = st.split(",")
    lret = []
    curs = ""
    for dx in xrange(len(arr)):
        sa = arr[len(arr) - dx - 1]
        if curs == "":
            curs = sa + curs
        else:
            curs = sa + "," + curs
        edx = curs.find("=")
        if edx > -1:
            lret.append(convsingle(curs,edx))
            curs = ""
        
    lret.reverse()
    return ",".join(lret)
    
kvmatch = re.compile("([^ =]+)=\"([^\"]*)\"")
def convdata_nocomma(st):
    sret = ""
    for v in kvmatch.finditer(st):
        sret += '"' + v.group(1) + '":"' + v.group(2) + '",'
    return sret[:-1]

def usage():
    print "Usage: %s dotfile outdir" % (sys.argv[0])

if __name__ == '__main__':
    if len(sys.argv) < 3:
        usage()
        sys.exit(1)
    doread(sys.argv[1], sys.argv[2])