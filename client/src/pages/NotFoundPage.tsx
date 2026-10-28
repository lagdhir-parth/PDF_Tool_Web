import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        The tool or page you are looking for does not exist or has been moved.
      </p>

      <Link to="/">
        <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to All Tools
        </Button>
      </Link>
    </div>
  );
};
