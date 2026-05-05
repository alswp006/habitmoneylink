import { useState } from 'react';
import { Top, Paragraph, Spacing, TextField, Button, Toast } from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAppStore } from '@/lib/store/AppStore';

export default function GoalPage() {
  const { activeGoal, upsertActiveGoal, isHydrating } = useAppStore();

  const [title, setTitle] = useState(activeGoal?.title ?? '');
  const [amount, setAmount] = useState(
    activeGoal?.targetAmountKRW ? String(activeGoal.targetAmountKRW) : '',
  );
  const [amountError, setAmountError] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  if (isHydrating) {
    return <Paragraph.Text typography="t6">불러오는 중</Paragraph.Text>;
  }

  const handleSave = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const parsed = parseInt(amount, 10);
    if (
      !amount ||
      !/^\d+$/.test(amount) ||
      isNaN(parsed) ||
      parsed < 1_000 ||
      parsed > 100_000_000
    ) {
      setAmountError('목표 금액은 1,000원부터 입력할 수 있어요');
      return;
    }

    setAmountError('');
    upsertActiveGoal({ title: title.trim() || '목표', targetAmountKRW: parsed });
    generateHapticFeedback({ type: 'success' });
    setToastOpen(true);
  };

  return (
    <>
      <Top title={<Top.TitleParagraph>목표 설정</Top.TitleParagraph>} />

      <Spacing size={16} />
      <TextField
        variant="box"
        label="목표 이름"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Spacing size={16} />
      <TextField
        variant="box"
        label="목표 금액"
        inputMode="numeric"
        help={amountError || '목표 금액은 1,000원부터 입력할 수 있어요'}
        hasError={!!amountError}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <Spacing size={24} />
      <Button variant="fill" onClick={handleSave}>
        저장
      </Button>

      <Toast
        open={toastOpen}
        position="bottom"
        text="목표를 저장했어요"
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}
