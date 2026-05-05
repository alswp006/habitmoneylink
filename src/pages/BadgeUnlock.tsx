import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Top, Paragraph, Spacing, Button, Toast } from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAppStore } from '@/lib/store/AppStore';
import { StorageError } from '@/lib/types';
import type { RouteState } from '@/lib/types';

export default function BadgeUnlockPage() {
  const location = useLocation();
  const { unlockBadge } = useAppStore();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastText, setToastText] = useState('');

  const state = location.state as RouteState['/badge/unlock'];
  const badgeId = state?.badgeId ?? null;

  const handleUnlock = () => {
    if (!badgeId) return;
    try {
      unlockBadge(badgeId, new Date().toISOString());
      generateHapticFeedback({ type: 'success' });
    } catch (err) {
      if (err instanceof StorageError && err.code === 'DUPLICATE') {
        setToastText('이미 획득한 배지예요');
        setToastOpen(true);
      }
    }
  };

  return (
    <>
      <Top title={<Top.TitleParagraph>배지 잠금 해제</Top.TitleParagraph>} />

      <Spacing size={24} />

      {!badgeId ? (
        <Paragraph.Text typography="st8" color="secondary">
          배지를 선택해줘요
        </Paragraph.Text>
      ) : (
        <>
          <Paragraph.Text typography="t6">
            보상형 광고를 보고 배지를 잠금 해제할 수 있어요.
          </Paragraph.Text>
          <Spacing size={24} />
          <Button variant="fill" onClick={handleUnlock}>
            잠금 해제하기
          </Button>
        </>
      )}

      <Toast
        open={toastOpen}
        position="bottom"
        text={toastText}
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}
