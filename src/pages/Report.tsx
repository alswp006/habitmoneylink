import { Paragraph, Spacing, Top } from '@toss/tds-mobile';
import { useAppStore } from '@/lib/store/AppStore';
import { getTodayKstYmd } from '@/lib/date/kst';

function getWeekStart(today: string): string {
  const d = new Date(today);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = (day - 1 + 7) % 7;
  const ms = d.getTime() - daysFromMonday * 86400 * 1000;
  const start = new Date(ms);
  const y = start.getUTCFullYear();
  const m = String(start.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(start.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export default function ReportPage() {
  const { checkIns, habitsById, isHydrating } = useAppStore();

  if (isHydrating) {
    return <Paragraph.Text typography="t6">불러오는 중</Paragraph.Text>;
  }

  const today = getTodayKstYmd();
  const weekStart = getWeekStart(today);

  const weekCheckIns = checkIns.filter(
    (c) => c.date >= weekStart && c.date <= today,
  );

  const total = weekCheckIns.reduce((sum, c) => sum + c.savedAmountKRW, 0);

  const byHabit = new Map<string, number>();
  for (const c of weekCheckIns) {
    byHabit.set(c.habitId, (byHabit.get(c.habitId) ?? 0) + c.savedAmountKRW);
  }

  return (
    <>
      <Top title={<Top.TitleParagraph>주간 리포트</Top.TitleParagraph>} />

      <Spacing size={24} />
      <Paragraph.Text typography="t6">이번 주 절약</Paragraph.Text>
      <Spacing size={8} />
      <Paragraph.Text typography="t2">{formatKRW(total)}</Paragraph.Text>

      <Spacing size={24} />

      {weekCheckIns.length === 0 ? (
        <Paragraph.Text typography="st8" color="secondary">
          이번 주에는 아직 체크인이 없어요
        </Paragraph.Text>
      ) : (
        <>
          {Array.from(byHabit.entries()).map(([habitId, amount]) => {
            const habit = habitsById.get(habitId);
            const name = habit?.title ?? habitId;
            return (
              <div key={habitId}>
                <Paragraph.Text typography="st8">{name}</Paragraph.Text>
                <Paragraph.Text typography="st8">{formatKRW(amount)}</Paragraph.Text>
                <Spacing size={8} />
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
