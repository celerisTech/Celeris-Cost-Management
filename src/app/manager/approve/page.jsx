import AllocationApprovalManager from '@/app/manager/components/AllocationApprovalManager';
import Navbar from '@/app/components/Navbar';
import { Suspense } from 'react';

export default function ManagerApprovalPage() {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Navbar />
      <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <AllocationApprovalManager />
        </Suspense>
      </div>
    </div>
  );
}
