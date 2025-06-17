import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer",
        className
      )}
    >
      {children}
    </div>
  );
}

interface MetricShimmerProps {
  className?: string;
}

export function MetricShimmer({ className }: MetricShimmerProps) {
  return (
    <div className={cn("bg-white/70 backdrop-blur rounded-xl p-6 border-0 shadow-lg", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Shimmer className="h-8 w-16 rounded" />
          <Shimmer className="h-4 w-24 rounded" />
        </div>
        <Shimmer className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}

interface ScoreShimmerProps {
  className?: string;
}

export function ScoreShimmer({ className }: ScoreShimmerProps) {
  return (
    <div className={cn("bg-slate-50 border-2 border-slate-200 rounded-xl p-8", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Shimmer className="h-16 w-16 rounded-lg" />
            <div className="space-y-2">
              <Shimmer className="h-6 w-32 rounded" />
              <Shimmer className="h-4 w-20 rounded" />
            </div>
          </div>
          <Shimmer className="h-3 w-full rounded-full" />
        </div>
        <div className="text-right space-y-2">
          <Shimmer className="h-8 w-12 rounded" />
          <Shimmer className="h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

interface KeywordShimmerProps {
  count?: number;
}

export function KeywordShimmer({ count = 3 }: KeywordShimmerProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex-1 space-y-2">
            <Shimmer className="h-5 w-32 rounded" />
            <Shimmer className="h-4 w-24 rounded" />
          </div>
          <div className="flex items-center space-x-3">
            <Shimmer className="h-6 w-8 rounded" />
            <Shimmer className="h-4 w-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface RecommendationShimmerProps {
  count?: number;
}

export function RecommendationShimmer({ count = 2 }: RecommendationShimmerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 bg-slate-50 rounded-xl border-l-4 border-l-blue-500 space-y-3">
          <div className="flex items-start justify-between">
            <Shimmer className="h-5 w-48 rounded" />
            <Shimmer className="h-5 w-16 rounded-full" />
          </div>
          <Shimmer className="h-4 w-full rounded" />
          <Shimmer className="h-4 w-3/4 rounded" />
          <Shimmer className="h-4 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}

interface TechnicalCheckShimmerProps {
  count?: number;
}

export function TechnicalCheckShimmer({ count = 4 }: TechnicalCheckShimmerProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <Shimmer className="h-4 w-32 rounded" />
          <Shimmer className="h-5 w-5 rounded-full" />
        </div>
      ))}
    </div>
  );
}