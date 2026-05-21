import { Suspense } from 'react';
import ProductsAllocationClient from './ProductsAllocationClient';
import LoadingState from '@/app/components/LoadingState'; // Create this if you haven't already

export default function ProductsAllocationPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProductsAllocationClient />
    </Suspense>
  );
}
