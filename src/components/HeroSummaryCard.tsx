import { Paragraph, Button, Spacing } from '@toss/tds-mobile';

interface HeroSummaryCardProps {
  accumulatedLabel: string;
  accumulatedValue: string;
  goalSummary: string;
  onGoalClick?: () => void;
}

export function HeroSummaryCard({
  accumulatedLabel,
  accumulatedValue,
  goalSummary,
  onGoalClick,
}: HeroSummaryCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--tds-color-grey50)',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <Paragraph.Text typography="st11" color="var(--tds-color-grey500)">
        {accumulatedLabel}
      </Paragraph.Text>
      <Spacing size={8} />
      <Paragraph.Text typography="t1">{accumulatedValue}</Paragraph.Text>

      <Spacing size={16} />
      <Paragraph.Text typography="st11" color="var(--tds-color-grey500)">
        목표
      </Paragraph.Text>
      <Spacing size={8} />
      {goalSummary ? (
        <Paragraph.Text typography="st8">{goalSummary}</Paragraph.Text>
      ) : (
        <Paragraph.Text typography="st8" color="var(--tds-color-grey400)">
          목표를 설정하면 D-day를 볼 수 있어요
        </Paragraph.Text>
      )}

      <Spacing size={16} />
      <Button variant="weak" onClick={onGoalClick}>
        목표 설정
      </Button>
    </div>
  );
}
