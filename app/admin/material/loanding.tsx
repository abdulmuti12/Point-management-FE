export default function MaterialLoading() {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-slate-200 rounded animate-pulse w-64 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded animate-pulse w-96"></div>
          </div>
          <div className="h-10 bg-slate-200 rounded animate-pulse w-32"></div>
        </div>
  
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border border-slate-200 rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-20"></div>
                  <div className="h-4 w-4 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded animate-pulse w-16 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded animate-pulse w-24"></div>
              </div>
            </div>
          ))}
        </div>
  
        <div className="border border-slate-200 rounded-lg">
          <div className="p-6">
            <div className="h-6 bg-slate-200 rounded animate-pulse w-48 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded animate-pulse w-32 mb-4"></div>
  
            <div className="space-y-4">
              <div className="h-10 bg-slate-200 rounded animate-pulse"></div>
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-16 bg-slate-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
  