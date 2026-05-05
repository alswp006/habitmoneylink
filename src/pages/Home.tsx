import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Top, Paragraph, Spacing, ListRow, Button, Toast, AlertDialog } from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAppStore } from '@/lib/store/AppStore';
import { HeroSummaryCard } from '@/components/HeroSummaryCard';
import { HabitListRow } from '@/components/HabitListRow';
import { AdSlot } from '@/components/AdSlot';
import { getTodayKstYmd } from '@/lib/date/kst';
import type { Goal, CheckIn } from '@/lib/types';

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

function computeGoalSummary(
  activeGoal: Goal | null,
  totalSaved: number,
  checkIns: CheckIn[],
): string {
  if (!activeGoal) return '';
  const remaining = activeGoal.targetAmountKRW - totalSaved;
  if (remaining <= 0) return `${activeGoal.title} 달성!`;

  const uniqueDays = new Set(checkIns.map((ci) => ci.date)).size;
  if (uniqueDays === 0 || totalSaved === 0) return activeGoal.title;

  const avgDaily = totalSaved / uniqueDays;
  const daysLeft = Math.ceil(remaining / avgDaily);
  return `${activeGoal.title}까지 D-${daysLeft}`;
}

export default function HomePage() {
  const navigate = useNavigate();
  const {
    isHydrating, habits, checkIns, activeGoal, storageError,
    createCheckIn, resetAll,
  } = useAppStore();

  const [toastOpen, setToastOpen] = useState(false);

  if (isHydrating) {
    return <Paragraph.Text typography="t6">불러오는 중</Paragraph.Text>;
  }

  const today = getTodayKstYmd();
  const activeHabits = habits.filter((h) => h.isActive);
  const totalSaved = checkIns.reduce((sum, ci) => sum + ci.savedAmountKRW, 0);
  const isSchemaError =
    storageError?.code === 'PARSE_ERROR' || storageError?.code === 'SCHEMA_MISMATCH';

  const goalSummary = computeGoalSummary(activeGoal, totalSaved, checkIns);

  const handleCheckIn = (habitId: string, savedAmountKRW: number) => {
    try {
      createCheckIn({ habitId, date: today, savedAmountKRW });
      generateHapticFeedback({ type: 'success' });
      setToastOpen(true);
    } catch {
      // DUPLICATE: already checked in today — ignore
    }
  };

  return (
    <>
      <Top title={<Top.TitleParagraph>세이브스트릭</Top.TitleParagraph>} />

      <Spacing size={16} />
      <HeroSummaryCard
        accumulatedLabel="누적 절약액"
        accumulatedValue={formatKRW(totalSaved)}
        goalSummary={goalSummary}
        onGoalClick={() => {
          generateHapticFeedback({ type: 'tickWeak' });
          navigate('/goal');
        }}
      />

      <Spacing size={16} />
      <AdSlot adGroupId="savestreak-home-banner" />

      <Spacing size={24} />
      <Paragraph.Text typography="t4">오늘의 습관</Paragraph.Text>
      <Spacing size={12} />

      {activeHabits.length === 0 ? (
        <>
          <Paragraph.Text typography="st8">
            아직 습관이 없어요. 습관을 추가해보세요.
          </Paragraph.Text>
          <Spacing size={12} />
          <Button
            variant="weak"
            onClick={() => {
              generateHapticFeedback({ type: 'tickWeak' });
              navigate('/habit/new');
            }}
          >
            습관 추가
          </Button>
        </>
      ) : (
        activeHabits.map((habit) => (
          <HabitListRow
            key={habit.id}
            title={habit.title}
            bottomText={`${formatKRW(habit.unitPriceKRW)} 아꼈어요`}
            onRowClick={() => {
              generateHapticFeedback({ type: 'tickWeak' });
              navigate(`/habit/${habit.id}/edit`);
            }}
            onCheckInClick={() => handleCheckIn(habit.id, habit.unitPriceKRW)}
          />
        ))
      )}

      <Spacing size={24} />
      <Paragraph.Text typography="t4">둘러보기</Paragraph.Text>
      <Spacing size={12} />
      <ListRow
        onClick={() => {
          generateHapticFeedback({ type: 'tickWeak' });
          navigate('/habit/new');
        }}
        contents={
          <ListRow.Texts type="2RowTypeA" top="습관 추가" bottom="새 절약 습관을 만들어요" />
        }
      />
      <ListRow
        onClick={() => {
          generateHapticFeedback({ type: 'tickWeak' });
          navigate('/report');
        }}
        contents={
          <ListRow.Texts type="2RowTypeA" top="주간 리포트" bottom="이번 주 절약을 확인해요" />
        }
      />
      <ListRow
        onClick={() => {
          generateHapticFeedback({ type: 'tickWeak' });
          navigate('/badge');
        }}
        contents={
          <ListRow.Texts type="2RowTypeA" top="배지 보관함" bottom="스트릭 배지를 모아요" />
        }
      />

      <Toast
        open={toastOpen}
        position="bottom"
        text="오늘도 절약 성공!"
        onClose={() => setToastOpen(false)}
      />

      <AlertDialog
        open={isSchemaError}
        title="데이터를 불러올 수 없어요"
        description="초기화하면 다시 사용할 수 있어요."
        alertButton={
          <AlertDialog.AlertButton
            onClick={() => {
              generateHapticFeedback({ type: 'tickMedium' });
              resetAll();
            }}
          >
            초기화
          </AlertDialog.AlertButton>
        }
        onClose={() => {}}
      />
    </>
  );
}
