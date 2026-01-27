// LoadingState.jsx
export default function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-[#F5F5F5]">
      <div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-sm border border-[#E0E0E0]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#4A90E2] border-t-transparent"></div>
        </div>
        <div className="mt-6 text-center">
          <h3 className="text-lg font-semibold text-[#333333] mb-2">Loading Request Details</h3>
          <p className="text-[#666666] text-sm">Please wait while we fetch the information...</p>
        </div>
      </div>
    </div>
  );
}
