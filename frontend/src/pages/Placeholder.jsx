import React from 'react';
import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

const Placeholder = ({ title, description }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
        <Construction className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900">{title}</h1>
      <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">{description}</p>
      <div className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          Return to Home Page
        </Link>
      </div>
    </div>
  );
};

export const PlaceholderPage = Placeholder;
export default Placeholder;
