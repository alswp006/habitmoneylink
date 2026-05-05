import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Top, Paragraph, Spacing, TextField, Switch, Button, AlertDialog, Toast,
} from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAppStore } from '@/lib/store/AppStore';

export default function HabitEditPage() {
  const navigate = useNavigate();
  const { habitId } = useParams<{ habitId: string }>();
  const { habitsById, updateHabit, deleteHabit, isHydrating } = useAppStore();

  const habit = habitId ? habitsById.get(habitId) : undefined;

  const [title, setTitle] = useState(habit?.title ?? '');
  const [amount, setAmount] = useState(habit?.unitPriceKRW ? String(habit.unitPriceKRW) : '');
  const [isActive, setIsActive] = useState(habit?.isActive ?? true);
  const [amountError, setAmountError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  if (isHydrating) {
    return <Paragraph.Text typography="t6">불러오는 중</Paragraph.Text>;
  }

  if (!habit) {
    return (
      <>
        <Top title={<Top.TitleParagraph>습관 수정</Top.TitleParagraph>} />
        <Spacing size={16} />
        <Paragraph.Text typography="st8">습관을 찾을 수 없어요</Paragraph.Text>
      </>
    );
  }

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setIsActive(next);
    updateHabit(habitId!, { isActive: next });
    generateHapticFeedback({ type: 'tickWeak' });
  };

  const handleSave = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const parsed = parseInt(amount, 10);
    if (!amount || !/^\d+$/.test(amount) || isNaN(parsed) || parsed < 1 || parsed > 1_000_000) {
      setAmountError('금액을 확인해줘요');
      return;
    }
    setAmountError('');
    const finalTitle = title.trim() || habit.title;
    updateHabit(habitId!, { title: finalTitle, unitPriceKRW: parsed });
    generateHapticFeedback({ type: 'success' });
    setToastOpen(true);
    navigate('/');
  };

  const handleDelete = () => {
    deleteHabit(habitId!);
    generateHapticFeedback({ type: 'success' });
    navigate('/');
  };

  return (
    <>
      <Top title={<Top.TitleParagraph>습관 수정</Top.TitleParagraph>} />

      <Spacing size={16} />
      <TextField
        variant="box"
        label="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Spacing size={16} />
      <TextField
        variant="box"
        label="하루에 아끼는 금액"
        inputMode="numeric"
        help={amountError || '숫자만 입력할 수 있어요'}
        hasError={!!amountError}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <Spacing size={16} />
      <Switch checked={isActive} onChange={handleToggle} />

      <Spacing size={24} />
      <Button variant="fill" onClick={handleSave}>
        저장
      </Button>

      <Spacing size={12} />
      <Button variant="weak" onClick={() => setDeleteDialogOpen(true)}>
        삭제
      </Button>

      <AlertDialog
        open={deleteDialogOpen}
        title="정말 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요."
        alertButton={
          <AlertDialog.AlertButton onClick={handleDelete}>삭제</AlertDialog.AlertButton>
        }
        onClose={() => setDeleteDialogOpen(false)}
      />

      <Toast
        open={toastOpen}
        position="bottom"
        text="저장했어요"
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}
