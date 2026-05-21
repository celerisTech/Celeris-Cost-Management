'use client';

import { useRouter } from 'next/navigation';
import AllocationRequestsDashboard from '@/app/manager/components/AllocationRequestsDashboard';
import Navbar from '../components/Navbar';


export default function ManagerDashboard() {
  const router = useRouter();

  return (
    <div className="flex h-screen ">
      {/* Sidebar */}
      <Navbar />
      <div className="flex-1 overflow-y-auto">


        {/* 👇 Embed Allocation Requests directly */}
        <div className="bg-white">

          <AllocationRequestsDashboard />
        </div>
      </div>
    </div>
  );
}
