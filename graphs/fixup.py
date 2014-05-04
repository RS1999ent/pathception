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


#requires pydot (built against release 1.0.28)
#	easy_install pydot
import pydot
import json
import os

def getattrs(o):
	return o.obj_dict["attributes"]
def nodebyname(g,name):
	n = g.get_node(name)[0]
	return (n, getattrs(n))

#convert internal node label/strings to ones suitable for json output
# idempotent for our purposes
def jsonstr(s):
	return s.strip('"').replace("\\n","\n")

def edge_repr(e):
	return "%s->%s" % (e.get_source(), e.get_destination())
def edge_label_repr(e,g):
	lf = nodebyname(g,e.get_source())[1]["label"]
	lt = nodebyname(g,e.get_destination())[1]["label"]
	return "%s->%s" % (lf, lt)

#Parse an edge label into times
class Timings:
	def __init__(self,st):
		if isinstance(st,pydot.Edge):
			st = jsonstr(getattrs(st)["label"])
		lines = st.split("\n")
		assert len(lines) == 3, lines
		self.p = float(lines[0].split(":")[1])
		self.a = self.parseas(lines[1])
		self.s = self.parseas(lines[2])
	
	def parseas(self,st):
		return map(lambda x: int(x.strip(" us")), st.strip(" ")[2:].split("/"))

	#return to Spectroscope format
	def unparse(self):
		return "p:%.2f\n   a: %dus / %dus\n   s: %dus / %dus" % \
			(self.p, self.a[0], self.a[1], self.s[0], self.s[1])

	def add(self,o):
		self.a[0] += o.a[0]
		self.a[1] += o.a[1]
		self.s[0] += o.s[0]
		self.s[1] += o.s[1]

	def subtract(self,o):
		self.a[0] -= o.a[0]
		self.a[1] -= o.a[1]
		self.s[0] -= o.s[0]
		self.s[1] -= o.s[1]

	def multiply(self,c):
		self.a = [int(v*c) for v in self.a]
		self.s = [int(v*c) for v in self.s]

	def maxzero(self):
		self.a = [max(v,0) for v in self.a]
		self.s = [max(v,0) for v in self.s]

	def copy(self):
		return Timings(self.unparse())

	def __str__(self):
		return "Timings(" + \
			" p=" + self.p.__str__() + \
			" a=" + self.a.__str__() + \
			" s=" + self.s.__str__() + " )"

#Build node->list(edges) map
class AdjMap:
	def __init__(self, g):
		dct = {}
		for e in g.get_edges():
			src = e.get_source()
			dst = e.get_destination()
			if not src in dct:
				dct[src] = self.__emptyen()
			if not dst in dct:
				dct[dst] = self.__emptyen()
			dct[src]["adj"].append(e)
			dct[dst]["inc"].append(e)		
		self.dct = dct

	def __emptyen(self):
		return {"adj":list(),"inc":list()}

	def get(self, n, k="adj"):
		en = self.dct.get(n,None)
		if en == None:
			return []
		else:
			return en[k]

def edgeeq(e1,e2):
	return e1.get_source() == e2.get_source() and \
		e1.get_destination() == e2.get_destination()

#Cut edges that cut across an RPC from the graph
# splice times into first and last edges on path
def apply_rpctimes(g):
	#for it in dir(g):
	#	print it
	
	adjmap = AdjMap(g)

	#are we done?
	iters_done = True

	for e in g.get_edges():
		src = e.get_source()
		dst = e.get_destination()
		#print src, "->", dst
		(srcn, srca) = nodebyname(g,src)
		(dstn, dsta) = nodebyname(g,dst)

		#remove direct call to reply edges
		if "RPC_CALL_TYPE" in srca["label"] and \
			"RPC_REPLY_TYPE" in dsta["label"]:
			print ">> start walk on ", edge_label_repr(e,g)
			fulltim = Timings(e)

			#walk to the destination node
			#look for other path...
			srcoute = []
			for e2 in adjmap.get(src):
				if not edgeeq(e2,e):
					srcoute.append(e2)
			#...assume there's only one
			cur = srcoute[0].get_destination()
			#do the walk
			while cur != dst:
				outes = adjmap.get(cur)
				if len(outes) == 1:
					#subtract timings
					#variance of sum is sum of variance if uncorrelated...
					tims = Timings(outes[0])
					fulltim.subtract(tims)
					cur = outes[0].get_destination()
				else:
					break
			#successful walk to destination node
			if cur == dst:
				#original times
				firstet = Timings(srcoute[0])
				lastet = Timings(outes[0])
				firstet.add(lastet)
				firstet.multiply(0.5)

				#split times by half
				fulltim.multiply(0.5)
				fulltim.maxzero()
				print "\tOrig Sum/2: %s" % (firstet)
				print "\t New Sum/2: %s" % (fulltim)

				#apply new timings
				srcoute[0].set("label", fulltim.unparse())
				outes[0].set("label", fulltim.unparse())

				deleted = g.del_edge(src, dst)
				if deleted:
					print "\tDeleted!"
			else:
				#nested call... additional iteration needed
				iters_done = False
	
	return iters_done

#Extract information from the "1" node of the graph
def getinfo(g):
	if not g.get_node("1"):
		return None
	
	(n, a) = nodebyname(g,"1")
	dct = dict()
	for (k,v) in a.iteritems():
		v = jsonstr(v)
		if k == "label":
			lines = [[s.strip() for s in l.split(":")] for l in v.split("\n")]
			for l in lines:
				if len(l) == 2:
					dct[l[0]] = l[1]
		else:
			dct[k] = v
	return dct

#convert to our json format
def tojsonobj(g,nodes=None,edges=None):
	if nodes == None:
		nodes = g.get_nodes()
	if edges == None:
		edges = g.get_edges()
	
	jnodes = []
	for n in nodes:
		dct = dict()
		dct["id"] = jsonstr(n.get_name())
		for k,v in getattrs(n).iteritems():
			dct[k] = jsonstr(v)
		jnodes.append(dct)

	jedges = []
	for e in edges:
		dct = dict()
		dct["from"] = jsonstr(e.get_source())
		dct["to"] = jsonstr(e.get_destination())
		for k,v in getattrs(e).iteritems():
			dct[k] = jsonstr(v)
		jedges.append(dct)

	obj = dict()
	obj["nodes"] = jnodes
	obj["edges"] = jedges
	return obj

#save *g* to *outfile* in format *fmt*
#if unspecified, take *fmt* from the extension 
def savegraph(g,outfile,fmt=None):
	if fmt == None:
		fmt = outfile.split(".")[-1]
	if fmt == "json":
		fp = open(outfile,"w")
		json.dump(tojsonobj(g),fp,indent=2)
		fp.close()
	elif fmt == "dot":
		g.write_dot(outfile)
	elif fmt == "png":
		g.write_png(outfile)

def runall(fname):
	gs = pydot.graph_from_dot_file(fname)
	if not isinstance(gs,list):
		gs = [gs]

	gdx = 0
	for g in gs:
		info = getinfo(g)
		done = True
		iters = 0
		while not done and iters < 10:
			done = apply_rpctimes(g)
			iters += 1
	
		outname = "%d" % gdx
		if info:
			outname = info["Cluster ID"]
		savegraph(g, outname + ".json")
		gdx += 1

if __name__ == '__main__':
	#thedir = "mds_prefetch_50/orig"
	thedir = "hadoop_compressed/orig"

	#fname = "weighted_combined_ranked_graphs.dot"
	#fname = "originating_clusters.dot" 
	fname = "write_compressed_graphs.dot"

	runall(os.path.join(thedir, fname))