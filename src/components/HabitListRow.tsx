import { ListRow, Button } from '@toss/tds-mobile';

interface HabitListRowProps {
  title: string;
  bottomText: string;
  onRowClick?: () => void;
  onCheckInClick?: () => void;
}

export function HabitListRow({
  title,
  bottomText,
  onRowClick,
  onCheckInClick,
}: HabitListRowProps) {
  return (
    <ListRow
      onClick={onRowClick}
      contents={
        <ListRow.Texts
          type="2RowTypeA"
          top={title}
          bottom={bottomText}
        />
      }
      right={
        <Button
          variant="fill"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onCheckInClick?.();
          }}
        >
          오늘 참았어요
        </Button>
      }
    />
  );
}
