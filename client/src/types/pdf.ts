export interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  thumbnailUrl?: string;
  error?: string;
}

export interface PdfPageItem {
  id: string;
  originalPageIndex: number; // 0-based
  pageNumber: number;        // 1-based display
  rotation: number;          // 0, 90, 180, 270
  selected: boolean;
  thumbnailUrl?: string;
  sourceFileId?: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number; // 0 - 100
  statusMessage: string;
  error: string | null;
  resultUrl: string | null;
  resultFilename: string | null;
}

export type PageNumberPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type PageNumberFormat = 'number' | 'page-number' | 'n-of-total' | 'page-n-of-total';

export interface PageNumberOptions {
  position: PageNumberPosition;
  format: PageNumberFormat;
  fontSize: number;
  fontColor: string; // hex
  margin: number;
  startNumber: number;
  skipFirstPage: boolean;
}

export type WatermarkType = 'text' | 'image';
export type WatermarkPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tiled';

export interface WatermarkOptions {
  type: WatermarkType;
  text: string;
  textColor: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  imageFile?: File | null;
}

export interface TextOverlayItem {
  id: string;
  pageIndex: number;
  text: string;
  x: number; // in PDF points
  y: number; // in PDF points
  fontSize: number;
  color: string; // hex
  rotation: number;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

export interface FormFieldItem {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'option';
  value: string | boolean;
  options?: string[];
  readOnly?: boolean;
  required?: boolean;
}
