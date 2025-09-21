# Simplified Makefile for Org exports

SOURCE = informe.org
PDF    = informe.pdf
HTML   = informe.html

EMACS  = emacs --batch -Q

all: $(PDF) $(HTML)

$(PDF): $(SOURCE)
	@$(MAKE) execute-code-blocks
	@$(EMACS) --script scripts/export-to-pdf.el $<

$(HTML): $(SOURCE)
	@$(MAKE) execute-code-blocks
	@$(EMACS) --script scripts/export-to-html.el $<
	@$(MAKE) pages

execute-code-blocks:
	@$(EMACS) -l scripts/process-org.el

pages:
	@mkdir -p dist
	@cp $(HTML) dist/index.html
	@cp -r assets dist/

clean:
	rm -f $(PDF) $(HTML)

.PHONY: all clean execute-code-blocks github-pages
