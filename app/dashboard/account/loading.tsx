import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function AccountLoading() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-5xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="bg-slate-50 px-6 py-8 border-b border-slate-200">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="text-center md:text-left">
              <Skeleton className="h-8 w-48 mb-2" />
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <Skeleton className="h-7 w-48 mb-4" />
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                  <div className="flex flex-col">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Skeleton className="h-7 w-48 mb-4" />
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Skeleton className="h-7 w-48 mb-4" />
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                  <div className="flex flex-col">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
