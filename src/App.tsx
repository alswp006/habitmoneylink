import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { getIsTossLoginIntegratedService } from '@apps-in-toss/web-framework';
import { AppStoreProvider, useAppStore } from '@/lib/store/AppStore';
import { Tab, Toast } from '@toss/tds-mobile';
import { TossRewardAd } from '@/components/TossRewardAd';
import BlockingPage from '@/pages/Blocking';
import HomePage from '@/pages/Home';
import HabitNewPage from '@/pages/HabitNew';
import HabitEditPage from '@/pages/HabitEdit';
import GoalPage from '@/pages/Goal';
import ReportPage from '@/pages/Report';
import BadgePage from '@/pages/Badge';
import BadgeUnlockPage from '@/pages/BadgeUnlock';

// Dev-only TDS Gallery — tree-shaken from prod builds
const DevTdsGallery = import.meta.env.DEV
  ? lazy(() => import('./pages/__TdsGallery'))
  : null;

function InnerApp() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { storageError } = useAppStore();
  const [quotaToastDismissed, setQuotaToastDismissed] = useState(false);

  const quotaOpen = storageError?.code === 'QUOTA_EXCEEDED' && !quotaToastDismissed;

  return (
    <>
      <div style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/habit/new" element={<HabitNewPage />} />
          <Route path="/habit/:habitId/edit" element={<HabitEditPage />} />
          <Route path="/goal" element={<GoalPage />} />
          <Route
            path="/report"
            element={
              <TossRewardAd slotId="report-unlock">
                <ReportPage />
              </TossRewardAd>
            }
          />
          <Route path="/badge" element={<BadgePage />} />
          <Route
            path="/badge/unlock"
            element={
              <TossRewardAd slotId="badge-unlock">
                <BadgeUnlockPage />
              </TossRewardAd>
            }
          />
          {DevTdsGallery && (
            <Route
              path="/__tds-gallery"
              element={
                <Suspense fallback={null}>
                  <DevTdsGallery />
                </Suspense>
              }
            />
          )}
        </Routes>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          zIndex: 100,
        }}
      >
        <Tab
          onChange={(i) => {
            const paths = ['/', '/report', '/badge'];
            const path = paths[i];
            if (path) navigate(path);
          }}
        >
          <Tab.Item selected={pathname === '/'}>홈</Tab.Item>
          <Tab.Item selected={pathname === '/report'}>리포트</Tab.Item>
          <Tab.Item selected={pathname === '/badge'}>배지</Tab.Item>
        </Tab>
      </div>

      <Toast
        open={quotaOpen}
        position="bottom"
        text="저장공간이 부족해요. 용량을 비우고 다시 시도해줘요"
        onClose={() => setQuotaToastDismissed(true)}
      />
    </>
  );
}

export default function App() {
  const [guardState, setGuardState] = useState<'loading' | 'ok' | 'blocked'>('loading');

  useEffect(() => {
    getIsTossLoginIntegratedService()
      .then(() => setGuardState('ok'))
      .catch(() => setGuardState('blocked'));
  }, []);

  if (guardState === 'loading') return null;
  if (guardState === 'blocked') return <BlockingPage />;

  return (
    <AppStoreProvider>
      <InnerApp />
    </AppStoreProvider>
  );
}
