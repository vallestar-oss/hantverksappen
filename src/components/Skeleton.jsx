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
    <div className="flex items-center gap-3.5 bg-white px-4 py-[15px] animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-[#EBEBEB] rounded-full w-2/5" />
        <div className="h-3 bg-[#EBEBEB] rounded-full w-1/3" />
      </div>
      <div className="h-5 w-14 bg-[#EBEBEB] rounded-full flex-shrink-0" />
    </div>
  )
}

export function SkeletonListRow() {
  return (
    <div className="flex items-center gap-3.5 bg-white px-4 py-[15px] animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-[#EBEBEB] rounded-full w-1/3" />
        <div className="h-3 bg-[#EBEBEB] rounded-full w-1/2" />
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="h-5 w-16 bg-[#EBEBEB] rounded-full" />
        <div className="h-3 w-12 bg-[#EBEBEB] rounded-full" />
      </div>
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
