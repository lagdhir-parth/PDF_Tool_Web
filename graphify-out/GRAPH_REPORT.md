# Graph Report - PDF_Tool_Web  (2026-10-28)

## Corpus Check
- 62 files · ~20,759 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 297 nodes · 958 edges · 12 communities (11 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- compilerOptions
- compilerOptions
- router.tsx
- package.json
- pdf-services.test.ts
- DownloadResult.tsx
- SplitPdfPage.tsx
- Button
- tsconfig.json
- JpgToPdfPage.tsx
- usePdfDocument.ts
- ExtractPdfPagesPage.tsx

## God Nodes (most connected - your core abstractions)
1. `Button()` - 33 edges
2. `react` - 31 edges
3. `lucide-react` - 26 edges
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

## Communities (12 total, 1 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 1 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 2 - "router.tsx"
Cohesion: 0.09
Nodes (25): react-dom@^19.3.1, App(), AddPageNumbersPage, AddTextToPdfPage, DeletePdfPagesPage, MergePdfPage, OrganizePdfPage, PdfMetadataEditorPage (+17 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (41): @tailwindcss/vite@^4.3.3, devDependencies, eslint@^10.13.0, @eslint/js@^10.0.1, eslint-plugin-react-hooks@^7.1.1, eslint-plugin-react-refresh@^0.5.7, globals@^17.13.0, @types/canvas-confetti@^1.9.0 (+33 more)

### Community 4 - "pdf-services.test.ts"
Cohesion: 0.11
Nodes (26): WatermarkPdfPage, validateImageFile(), validatePdfFile(), ValidationResult, CoordinateContext, screenToPdfCoordinates(), createPdfDocument(), loadPdfLibDoc() (+18 more)

### Community 5 - "DownloadResult.tsx"
Cohesion: 0.07
Nodes (35): dependencies, canvas-confetti@^1.9.4, @dnd-kit/core@^6.3.1, @dnd-kit/sortable@^10.0.0, @dnd-kit/utilities@^3.2.2, jszip@^3.10.2, lucide-react@^1.62.0, pdf-lib@^1.17.1 (+27 more)

### Community 6 - "SplitPdfPage.tsx"
Cohesion: 0.12
Nodes (24): FillPdfFormsPage, ButtonProps, ErrorMessageProps, FileUploaderProps, ProgressIndicatorProps, ToolLayoutProps, addTextToPdf(), hexToRgb() (+16 more)

### Community 7 - "Button"
Cohesion: 0.40
Nodes (24): Button(), DownloadResult(), ErrorMessage(), FileUploader(), ProgressIndicator(), ToolLayout(), PdfPageGrid(), AddPageNumbersPage() (+16 more)

### Community 9 - "JpgToPdfPage.tsx"
Cohesion: 0.29
Nodes (8): JpgToPdfPage, ImageFileItem, imagesToPdf(), ImagesToPdfOptions, MARGIN_MAP, MarginOption, PageOrientationOption, PageSizeOption

### Community 10 - "usePdfDocument.ts"
Cohesion: 0.39
Nodes (6): pdfjs-dist@^6.4.299, load(), getPdfPageCount(), loadPdfJsDocument(), renderPageToThumbnail(), pdfjs-dist

### Community 11 - "ExtractPdfPagesPage.tsx"
Cohesion: 0.43
Nodes (5): ExtractPdfPagesPage, PageRangeInput(), PageRangeInputProps, formatPageIndices(), parsePageRange()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `router.tsx` to `package.json`, `pdf-services.test.ts`, `DownloadResult.tsx`, `SplitPdfPage.tsx`, `Button`, `JpgToPdfPage.tsx`, `usePdfDocument.ts`, `ExtractPdfPagesPage.tsx`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `SplitPdfPage.tsx` to `router.tsx`, `package.json`, `pdf-services.test.ts`, `DownloadResult.tsx`, `Button`, `JpgToPdfPage.tsx`, `ExtractPdfPagesPage.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Why does `pdf-lib` connect `pdf-services.test.ts` to `JpgToPdfPage.tsx`, `package.json`, `DownloadResult.tsx`, `SplitPdfPage.tsx`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `router.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0945945945945946 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06765327695560254 - nodes in this community are weakly interconnected._