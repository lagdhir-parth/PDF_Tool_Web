# Graph Report - PDF_Tool_Web  (2026-11-06)

## Corpus Check
- 63 files · ~27,599 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 319 nodes · 987 edges · 18 communities (14 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f72b96bc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- compilerOptions
- router.tsx
- eslint.config.js
- AddPageNumbersPage.tsx
- MergePdfPage.tsx
- devDependencies
- Button
- tsconfig.json
- ThumbnailCacheManager
- dependencies
- SplitPdfPage.tsx
- package.json
- vite.config.ts
- scripts
- FillPdfFormsPage.tsx
- validation.ts
- coordinates.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 33 edges
2. `Button()` - 33 edges
3. `lucide-react` - 27 edges
4. `DownloadResult()` - 26 edges
5. `FileUploader()` - 26 edges
6. `ToolLayout()` - 26 edges
7. `ErrorMessage()` - 25 edges
8. `ProgressIndicator()` - 25 edges
9. `usePdfProcessing()` - 25 edges
10. `loadPdfLibDoc()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `NotFoundPage()` --calls--> `Button()`  [EXTRACTED]
  client/src/pages/NotFoundPage.tsx → client/src/components/common/Button.tsx
- `DownloadResult()` --calls--> `downloadBlob()`  [EXTRACTED]
  client/src/components/common/DownloadResult.tsx → client/src/lib/files/download.ts
- `DownloadResult()` --calls--> `fireConfetti()`  [EXTRACTED]
  client/src/components/common/DownloadResult.tsx → client/src/lib/files/download.ts
- `ExtractPdfPagesPage()` --calls--> `PageRangeInput()`  [EXTRACTED]
  client/src/features/extract-pdf-pages/ExtractPdfPagesPage.tsx → client/src/components/pdf/PageRangeInput.tsx
- `SplitPdfPage()` --calls--> `PageRangeInput()`  [EXTRACTED]
  client/src/features/split-pdf/SplitPdfPage.tsx → client/src/components/pdf/PageRangeInput.tsx

## Import Cycles
- None detected.

## Communities (18 total, 4 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 1 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 2 - "router.tsx"
Cohesion: 0.09
Nodes (27): App(), DeletePdfPagesPage, ExtractPdfPagesPage, JpgToPdfPage, OrganizePdfPage, RotatePdfPage, router, Footer() (+19 more)

### Community 3 - "eslint.config.js"
Cohesion: 0.15
Nodes (12): eslint@^10.13.0, @eslint/js@^10.0.1, eslint-plugin-react-hooks@^7.1.1, eslint-plugin-react-refresh@^0.5.7, globals@^17.13.0, typescript-eslint@^8.72.0, eslint, @eslint/js (+4 more)

### Community 4 - "AddPageNumbersPage.tsx"
Cohesion: 0.11
Nodes (26): AddPageNumbersPage, AddTextToPdfPage, PdfMetadataEditorPage, WatermarkPdfPage, ButtonProps, ErrorMessageProps, FileUploaderProps, ProgressIndicatorProps (+18 more)

### Community 5 - "MergePdfPage.tsx"
Cohesion: 0.08
Nodes (31): @dnd-kit/utilities@^3.2.2, MergePdfPage, PdfPageGridProps, SortableThumbnailItem(), SortableThumbnailItemProps, clamp(), IconButton(), IconButtonProps (+23 more)

### Community 6 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @types/canvas-confetti@^1.9.0, @types/node@^24.19.2, @types/react@^19.3.0, @types/react-dom@^19.3.0, typescript@~5.9.3, vitest@^5.0.5, @types/canvas-confetti (+5 more)

### Community 7 - "Button"
Cohesion: 0.43
Nodes (23): Button(), DownloadResult(), ErrorMessage(), FileUploader(), ProgressIndicator(), ToolLayout(), PdfPageGrid(), AddPageNumbersPage() (+15 more)

### Community 10 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, canvas-confetti@^1.9.4, @dnd-kit/core@^6.3.1, @dnd-kit/sortable@^10.0.0, jszip@^3.10.2, lucide-react@^1.62.0, pdf-lib@^1.17.1, @pdf-lib/fontkit@^1.1.1 (+10 more)

### Community 11 - "SplitPdfPage.tsx"
Cohesion: 0.19
Nodes (14): SplitPdfPage, DownloadResultProps, PageRangeInput(), PageRangeInputProps, downloadBlob(), downloadZip(), fireConfetti(), formatPageIndices() (+6 more)

### Community 12 - "package.json"
Cohesion: 0.18
Nodes (10): react-dom@^19.3.1, react-dropzone@^20.1.4, tailwindcss@^4.3.3, name, private, type, version, react-dom (+2 more)

### Community 13 - "vite.config.ts"
Cohesion: 0.29
Nodes (6): @tailwindcss/vite@^4.3.3, vite@^8.3.5, @vitejs/plugin-react@^6.1.2, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 14 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test

### Community 15 - "FillPdfFormsPage.tsx"
Cohesion: 0.19
Nodes (15): FillPdfFormsPage, createPdfDocument(), loadPdfLibDoc(), deletePdfPages(), extractPdfPages(), fillPdfForm(), getPdfFormFields(), organizePdf() (+7 more)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `router.tsx` to `AddPageNumbersPage.tsx`, `MergePdfPage.tsx`, `Button`, `dependencies`, `SplitPdfPage.tsx`, `package.json`, `FillPdfFormsPage.tsx`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `AddPageNumbersPage.tsx` to `router.tsx`, `MergePdfPage.tsx`, `Button`, `dependencies`, `SplitPdfPage.tsx`, `package.json`, `FillPdfFormsPage.tsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Why does `ThumbnailCacheManager` connect `ThumbnailCacheManager` to `MergePdfPage.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `router.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09146341463414634 - nodes in this community are weakly interconnected._
- **Should `AddPageNumbersPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10853658536585366 - nodes in this community are weakly interconnected._