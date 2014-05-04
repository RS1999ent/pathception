#!/usr/bin/python

#Parse GraphML format and dump to JSON

import xml.parsers.expat, sys, json

class Parser:
    def __init__(self):
        self.parser = xml.parsers.expat.ParserCreate()
        self.parser.CharacterDataHandler = self.cbChars
        self.parser.StartElementHandler = self.cbStart
        self.parser.EndElementHandler = self.cbEnd
        
        self.graphs = []
        self.curgraph = None
    
    def parse(self, fp):
        self.parser.ParseFile(fp)
    
    def cbChars(self, data):
        pass
    
    def cbStart(self, data, atts):
        if data == "graph":
            self.curgraph = Graph(atts.get("id", "?"))
        elif data == "node":
            self.curgraph.addnode(Node(atts.get("id", "?")))
        elif data == "edge":
            self.curgraph.addedge(Edge(atts.get("id", "?"), atts.get("source", "?"), atts.get("target", "?")))
        
    def cbEnd(self, data):
        if data == "graph":
            self.graphs.append(self.curgraph)
            self.curgraph = None
            
    def toJSON(self):
        return json.dumps(self.graphs[-1], indent=4, cls=GraphEncoder)

class Graph:
    def __init__(self, name):
        self.name = name
        self.nodes = []
        self.edges = []
        
    def addnode(self, n):
        self.nodes.append(n)
    def addedge(self, e):
        self.edges.append(e)
        
class Node:
    def __init__(self, id):
        self.id = id
        self.label = id

class Edge:
    def __init__(self, id, src, dst):
        self.id = id
        self.src = src
        self.dst = dst

class GraphEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Node):
            return {"id": obj.id, "label": obj.label}
        elif isinstance(obj, Graph):
            return {"nodes": obj.nodes, "edges": obj.edges}
        elif isinstance(obj, Edge):
            return {"from": obj.src, "to": obj.dst}
        return json.JSONEncoder.default(self, obj)  
        
def usage(argv):
    print "Usage: %s [file.graphml]" % (argv[0])
    
if __name__ == '__main__':
    if len(sys.argv) < 2:
        usage(sys.argv)
    else:
        parse = Parser()
        parse.parse(open(sys.argv[1], "r"))
        print parse.toJSON()