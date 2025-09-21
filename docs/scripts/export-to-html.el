;; export-to-html.el - Export Org file to HTML

;; Check if a filename is provided
(when (< (length command-line-args-left) 1)
  (error "Usage: emacs --batch -Q --script export-to-html.el <file.org>"))

;; Load required libraries
(require 'org)
(require 'ox-html)

;; Set TOC to true
(setq org-export-with-toc t)

;; Configure paths
(setq org-file (car command-line-args-left))

;; Open the Org file
(find-file org-file)

;; Perform export
(org-html-export-to-html)

;; Exit
(kill-emacs)