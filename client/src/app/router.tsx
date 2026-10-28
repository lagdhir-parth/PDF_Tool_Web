/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { Loader2 } from 'lucide-react';

const MergePdfPage = lazy(() =>
  import('../features/merge-pdf/MergePdfPage').then((m) => ({ default: m.MergePdfPage }))
);
const SplitPdfPage = lazy(() =>
  import('../features/split-pdf/SplitPdfPage').then((m) => ({ default: m.SplitPdfPage }))
);
const JpgToPdfPage = lazy(() =>
  import('../features/jpg-to-pdf/JpgToPdfPage').then((m) => ({ default: m.JpgToPdfPage }))
);
const OrganizePdfPage = lazy(() =>
  import('../features/organize-pdf/OrganizePdfPage').then((m) => ({ default: m.OrganizePdfPage }))
);
const RotatePdfPage = lazy(() =>
  import('../features/rotate-pdf/RotatePdfPage').then((m) => ({ default: m.RotatePdfPage }))
);
const AddPageNumbersPage = lazy(() =>
  import('../features/add-page-numbers/AddPageNumbersPage').then((m) => ({
    default: m.AddPageNumbersPage,
  }))
);
const WatermarkPdfPage = lazy(() =>
  import('../features/watermark-pdf/WatermarkPdfPage').then((m) => ({
    default: m.WatermarkPdfPage,
  }))
);
const DeletePdfPagesPage = lazy(() =>
  import('../features/delete-pdf-pages/DeletePdfPagesPage').then((m) => ({
    default: m.DeletePdfPagesPage,
  }))
);
const ExtractPdfPagesPage = lazy(() =>
  import('../features/extract-pdf-pages/ExtractPdfPagesPage').then((m) => ({
    default: m.ExtractPdfPagesPage,
  }))
);
const AddTextToPdfPage = lazy(() =>
  import('../features/add-text-to-pdf/AddTextToPdfPage').then((m) => ({
    default: m.AddTextToPdfPage,
  }))
);
const PdfMetadataEditorPage = lazy(() =>
  import('../features/pdf-metadata-editor/PdfMetadataEditorPage').then((m) => ({
    default: m.PdfMetadataEditorPage,
  }))
);
const FillPdfFormsPage = lazy(() =>
  import('../features/fill-pdf-forms/FillPdfFormsPage').then((m) => ({
    default: m.FillPdfFormsPage,
  }))
);

const loadingFallback = (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
    <span className="text-xs font-semibold text-slate-500">Loading PDF Tool...</span>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'merge-pdf',
        element: <Suspense fallback={loadingFallback}><MergePdfPage /></Suspense>,
      },
      {
        path: 'split-pdf',
        element: <Suspense fallback={loadingFallback}><SplitPdfPage /></Suspense>,
      },
      {
        path: 'jpg-to-pdf',
        element: <Suspense fallback={loadingFallback}><JpgToPdfPage /></Suspense>,
      },
      {
        path: 'organize-pdf',
        element: <Suspense fallback={loadingFallback}><OrganizePdfPage /></Suspense>,
      },
      {
        path: 'rotate-pdf',
        element: <Suspense fallback={loadingFallback}><RotatePdfPage /></Suspense>,
      },
      {
        path: 'add-page-numbers',
        element: <Suspense fallback={loadingFallback}><AddPageNumbersPage /></Suspense>,
      },
      {
        path: 'watermark-pdf',
        element: <Suspense fallback={loadingFallback}><WatermarkPdfPage /></Suspense>,
      },
      {
        path: 'delete-pdf-pages',
        element: <Suspense fallback={loadingFallback}><DeletePdfPagesPage /></Suspense>,
      },
      {
        path: 'extract-pdf-pages',
        element: <Suspense fallback={loadingFallback}><ExtractPdfPagesPage /></Suspense>,
      },
      {
        path: 'add-text-to-pdf',
        element: <Suspense fallback={loadingFallback}><AddTextToPdfPage /></Suspense>,
      },
      {
        path: 'pdf-metadata-editor',
        element: <Suspense fallback={loadingFallback}><PdfMetadataEditorPage /></Suspense>,
      },
      {
        path: 'fill-pdf-forms',
        element: <Suspense fallback={loadingFallback}><FillPdfFormsPage /></Suspense>,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
