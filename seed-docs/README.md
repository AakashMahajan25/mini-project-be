# Seed documents

Files in this folder are loaded into the shared RAG corpus, so every user's chat can retrieve and cite them.
Good candidates: company annual reports, quarterly results, SEBI / RBI investor-education guides, index factsheets.

1. Copy PDF, DOCX, DOC or TXT files here (text-based PDFs; scanned image PDFs have no extractable text).
2. Run `npm run seed:docs` from `frruit-be/`. Files that were already loaded are skipped; `-- --force` re-embeds them.
