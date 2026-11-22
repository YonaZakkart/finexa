import { Skeleton } from '@/components/ui/Skeleton';

export function LoadingFallback() {
  return (
    <div
      aria-busy="true"
      className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 p-6"
    >
      <Skeleton className="h-8 w-32 rounded-md" />
      <Skeleton className="h-4 w-48 rounded-md" />
      <Skeleton className="h-4 w-64 rounded-md" />
    </div>
  );
}

export function LoadingScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-4 p-6">
      <LoadingFallback />
    </main>
  );
}
