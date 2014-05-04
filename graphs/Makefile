PROBLEM=training
SOURCEDIR=$(PROBLEM)/orig
DOTDIR=$(PROBLEM)/dotted
JSONDIR=$(PROBLEM)/out

dodot:
	dot $(SOURCEDIR)/originating_clusters.dot > $(DOTDIR)/precursors.dot
	dot $(SOURCEDIR)/weighted_combined_ranked_graphs.dot > $(DOTDIR)/mutations.dot
genjson:
	python extract.py $(SOURCEDIR)/originating_clusters.dot $(JSONDIR)
	python extract.py $(SOURCEDIR)/weighted_combined_ranked_graphs.dot $(JSONDIR)
task-response:
	python extract.py $(SOURCEDIR)/task2.dot $(JSONDIR)
task-structural:
	python extract.py $(SOURCEDIR)/precursor.dot $(JSONDIR)
	python extract.py $(SOURCEDIR)/mutation.dot $(JSONDIR)