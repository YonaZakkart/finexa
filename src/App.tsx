import { lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppStore } from '@/stores/app.store';

const Onboarding = lazy(() =>
  import('@/features/onboarding/Onboarding').then((m) => ({ default: m.Onboarding }))
);
const Dashboard = lazy(() =>
  import('@/features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const NewExpense = lazy(() =>
  import('@/features/expenses/NewExpense').then((m) => ({ default: m.NewExpense }))
);
const EditExpense = lazy(() =>
  import('@/features/expenses/EditExpense').then((m) => ({ default: m.EditExpense }))
);
const History = lazy(() =>
  import('@/features/expenses/History').then((m) => ({ default: m.History }))
);
const Summary = lazy(() =>
  import('@/features/summary/Summary').then((m) => ({ default: m.Summary }))
);
const Debts = lazy(() => import('@/features/debts/Debts').then((m) => ({ default: m.Debts })));
const Investments = lazy(() =>
  import('@/features/investments/Investments').then((m) => ({ default: m.Investments }))
);
const PortfolioDetail = lazy(() =>
  import('@/features/investments/PortfolioDetail').then((m) => ({ default: m.PortfolioDetail }))
);
const NewInvestment = lazy(() =>
  import('@/features/investments/NewInvestment').then((m) => ({ default: m.NewInvestment }))
);

function LoadingFallback() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 p-6">
      <Skeleton className="h-8 w-32 rounded-md" />
      <Skeleton className="h-4 w-48 rounded-md" />
      <Skeleton className="h-4 w-64 rounded-md" />
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-4 p-6">
      <LoadingFallback />
    </main>
  );
}

function HydrationError({ onRetry }: { onRetry: () => Promise<void> }) {
  const { t } = useTranslation('common');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-4 p-6 text-center">
      <p role="alert" className="text-sm text-negative">
        {t('loadError')}
      </p>
      <Button onClick={() => void onRetry()}>{t('retry')}</Button>
    </main>
  );
}

function useAppHydration() {
  const hydrated = useAppStore((state) => state.hydrated);
  const error = useAppStore((state) => state.error);
  const hydrate = useAppStore((state) => state.hydrate);

  useEffect(() => {
    if (!hydrated && !error) {
      void hydrate();
    }
  }, [hydrated, error, hydrate]);

  return { hydrated, error, hydrate };
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { hydrated, error, hydrate } = useAppHydration();
  const onboardingCompleted = useAppStore((state) => state.settings?.onboardingCompleted);

  if (error) {
    return <HydrationError onRetry={hydrate} />;
  }

  if (!hydrated) {
    return <LoadingScreen />;
  }

  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function OnboardingRoute() {
  const { hydrated, error, hydrate } = useAppHydration();
  const onboardingCompleted = useAppStore((state) => state.settings?.onboardingCompleted);

  if (error) {
    return <HydrationError onRetry={hydrate} />;
  }

  if (!hydrated) {
    return <LoadingScreen />;
  }

  if (onboardingCompleted) {
    return <Navigate to="/" replace />;
  }

  return <Onboarding />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingRoute />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses/new" element={<NewExpense />} />
          <Route path="/expenses/:id/edit" element={<EditExpense />} />
          <Route path="/history" element={<History />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/investments/:portfolioId" element={<PortfolioDetail />} />
          <Route path="/investments/:portfolioId/new" element={<NewInvestment />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export function App() {
  return <AppRoutes />;
}
