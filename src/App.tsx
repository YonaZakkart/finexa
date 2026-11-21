import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingScreen } from '@/components/layout/RouteFallback';
import { Button } from '@/components/ui/Button';
import { ROUTE_LOADERS } from '@/lib/route-preload';
import { useAppStore } from '@/stores/app.store';

const Onboarding = lazy(() => ROUTE_LOADERS.onboarding().then((m) => ({ default: m.Onboarding })));
const Dashboard = lazy(() => ROUTE_LOADERS.dashboard().then((m) => ({ default: m.Dashboard })));
const NewExpense = lazy(() => ROUTE_LOADERS.newExpense().then((m) => ({ default: m.NewExpense })));
const EditExpense = lazy(() =>
  ROUTE_LOADERS.editExpense().then((m) => ({ default: m.EditExpense }))
);
const History = lazy(() => ROUTE_LOADERS.history().then((m) => ({ default: m.History })));
const Summary = lazy(() => ROUTE_LOADERS.summary().then((m) => ({ default: m.Summary })));
const Debts = lazy(() => ROUTE_LOADERS.debts().then((m) => ({ default: m.Debts })));
const Money = lazy(() => ROUTE_LOADERS.money().then((m) => ({ default: m.Money })));
const Investments = lazy(() =>
  ROUTE_LOADERS.investments().then((m) => ({ default: m.Investments }))
);
const PortfolioDetail = lazy(() =>
  ROUTE_LOADERS.portfolioDetail().then((m) => ({ default: m.PortfolioDetail }))
);
const NewInvestment = lazy(() =>
  ROUTE_LOADERS.newInvestment().then((m) => ({ default: m.NewInvestment }))
);
const InvestmentHistory = lazy(() =>
  ROUTE_LOADERS.investmentHistory().then((m) => ({ default: m.InvestmentHistory }))
);

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
      <Suspense fallback={<LoadingScreen />}>
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
            <Route path="/money" element={<Money />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/investments/history" element={<InvestmentHistory />} />
            <Route path="/investments/:portfolioId" element={<PortfolioDetail />} />
            <Route path="/investments/:portfolioId/new" element={<NewInvestment />} />
            <Route
              path="/investments/:portfolioId/edit/:investmentId"
              element={<NewInvestment />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export function App() {
  return <AppRoutes />;
}
