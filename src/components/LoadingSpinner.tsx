import React from 'react';
import { BookOpen } from 'lucide-react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">TaskFlow</h2>
        <p className="text-gray-600">Loading your workspace...</p>
      </div>
    </div>
  );
};