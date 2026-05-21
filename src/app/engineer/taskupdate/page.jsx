import { Suspense } from 'react';
import TaskUpdateClient from './TaskUpdateClient';

export default function TaskUpdatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen">
        <div className="p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-gray-600 text-lg font-medium">Loading task details...</p>
          </div>
        </div>
      </div>
    }>
      <TaskUpdateClient />
    </Suspense>
  );
}
