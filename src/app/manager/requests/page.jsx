import Navbar from '@/app/components/Navbar';
import AllocationRequestsDashboard from '@/app/manager/components/AllocationRequestsDashboard';


export default function ManagerRequestsPage() {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Navbar />
      <div className="flex-1 mx-auto overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
        <AllocationRequestsDashboard />
      </div>
    </div>
  );
}
