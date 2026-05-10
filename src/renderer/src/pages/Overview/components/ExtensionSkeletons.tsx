import { Skeleton } from "../../../components/ui/Skeleton";

export function ExtensionTableSkeleton() {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50">
          <th className="w-1/3 px-4 py-3 text-left text-xs font-medium text-slate-500">Extension</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Installed In</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Not Installed In</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {[1, 2, 3].map((index) => (
          <tr key={index}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-5.5 w-5.5 rounded-full" />
                ))}
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} className="h-5.5 w-5.5 rounded-full" />
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-7 w-7" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

export function EditorGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {[1, 2, 3].map((index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Skeleton className="h-7 w-7" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
