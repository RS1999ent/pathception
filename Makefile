#Place jsdoc-toolkit here.
DOCDIR=util/jsdoc-toolkit

#Generate docs from .js
docs:
	java -Djsdoc.dir=doc/gen -jar $(DOCDIR)/jsrun.jar $(DOCDIR)/app/run.js ./js -t=$(DOCDIR)/templates/jsdoc -d=doc/gen

#Clean docs
clean:
	rm -rf doc/gen