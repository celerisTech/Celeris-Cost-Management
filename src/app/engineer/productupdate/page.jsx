import { Suspense } from 'react';
import ProductUpdateClient from './ProductUpdateClient';

export default function ProductUpdatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-sm w-full">
          <div className="animate-pulse flex flex-col items-center">
            <div className="rounded-full  h-16 w-16 mb-4"></div>
            <div className="h-4  rounded w-3/4 mb-2"></div>
            <div className="h-3  rounded w-1/2"></div>
            <div className="mt-6 w-full">
              <div className="h-6  rounded mb-4"></div>
              <div className="h-32  rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ProductUpdateClient />
    </Suspense>
  );
}
