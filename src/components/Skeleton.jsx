// Skeleton loader variants — all use animate-pulse, bg-[#E5E5E5], rounded-xl

export function SkeletonLine({ width = 'w-full', height = 'h-4' }) {
  return <div className={`${width} ${height} bg-[#E5E5E5] rounded-xl animate-pulse`} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-[#E5E5E5] rounded-xl" />
        <div className="w-9 h-9 bg-[#E5E5E5] rounded-xl" />
      </div>
      <div className="h-7 w-16 bg-[#E5E5E5] rounded-xl" />
      <div className="h-3 w-20 bg-[#E5E5E5] rounded-xl" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-[#E5E5E5] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-[#E5E5E5] rounded-xl w-2/5" />
        <div className="h-3 bg-[#E5E5E5] rounded-xl w-1/3" />
      </div>
      <div className="w-4 h-4 bg-[#E5E5E5] rounded-xl flex-shrink-0" />
    </div>
  )
}

// SkeletonListRow — thinner row for list-style pages (Quotes, Invoices)
export function SkeletonListRow() {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-[#E5E5E5] rounded-xl w-1/3" />
        <div className="h-3 bg-[#E5E5E5] rounded-xl w-1/2" />
      </div>
      <div className="h-5 w-14 bg-[#E5E5E5] rounded-full" />
      <div className="w-4 h-4 bg-[#E5E5E5] rounded-xl" />
    </div>
  )
}

// SkeletonPage — detail page placeholder: header strip + card blocks
export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* fake header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#E5E5E5] rounded-xl" />
        <div className="h-5 bg-[#E5E5E5] rounded-xl w-32" />
      </div>
      {/* fake status strip */}
      <div className="h-10 bg-[#E5E5E5]" />
      {/* fake content cards */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="h-3 bg-[#E5E5E5] rounded-xl w-24" />
          <div className="space-y-3">
            <div className="h-4 bg-[#E5E5E5] rounded-xl w-full" />
            <div className="h-4 bg-[#E5E5E5] rounded-xl w-4/5" />
            <div className="h-4 bg-[#E5E5E5] rounded-xl w-3/5" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="h-3 bg-[#E5E5E5] rounded-xl w-20" />
          <div className="space-y-3">
            <div className="h-4 bg-[#E5E5E5] rounded-xl w-full" />
            <div className="h-4 bg-[#E5E5E5] rounded-xl w-3/4" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="h-3 bg-[#E5E5E5] rounded-xl w-28" />
          <div className="space-y-3">
            <div className="h-4 bg-[#E5E5E5] rounded-xl w-full" />
            <div className="h-4 bg-[#E5E5E5] rounded-xl w-2/3" />
            <div className="h-4 bg-[#E5E5E5] rounded-xl w-4/5" />
          </div>
        </div>
      </div>
    </div>
  )
}
