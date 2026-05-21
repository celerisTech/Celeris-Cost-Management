'use client';
import { Suspense } from 'react';
import EditItemContent from './EditItemContent';
import LoadingState from '@/app/components/LoadingState';

export default function EditItemPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <EditItemContent />
    </Suspense>
  );
}
