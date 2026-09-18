import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-20 h-20 bg-emerald-50 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
        <FileQuestion className="w-10 h-10" />
      </div>
      
      <div className="space-y-2 max-w-md mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          404 Error
        </span>
        <h1 className="text-3xl font-black text-slate-900">Page Not Found</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>

      <div className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
