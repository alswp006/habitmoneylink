import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Top, Paragraph, Spacing, ListRow, BottomSheet, TextField, Button, Toast } from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAppStore } from '@/lib/store/AppStore';
import type { HabitCategory, RouteState } from '@/lib/types';

const CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: 'smoking', label: '담배' },
  { value: 'coffee', label: '커피' },
  { value: 'delivery', label: '배달' },
  { value: 'alcohol', label: '술' },
  { value: 'impulse', label: '충동구매' },
  { value: 'etc', label: '기타' },
];

export default function HabitNewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createHabit } = useAppStore();
  const prefill = (location.state as RouteState['/habit/new'])?.prefill;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [category, setCategory] = useState<HabitCategory | null>(prefill?.category ?? null);
  const [title, setTitle] = useState(prefill?.title ?? '');
  const [amount, setAmount] = useState(
    prefill?.unitPriceKRW ? String(prefill.unitPriceKRW) : '',
  );
  const [amountError, setAmountError] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  const categoryLabel = category
    ? (CATEGORIES.find((c) => c.value === category)?.label ?? '')
    : null;

  const handleSave = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (!category) {
      setAmountError('카테고리를 선택해주세요');
      return;
    }

    const parsed = parseInt(amount, 10);
    if (!amount || !/^\d+$/.test(amount) || isNaN(parsed) || parsed < 1 || parsed > 1_000_000) {
      setAmountError('금액을 확인해줘요');
      return;
    }

    setAmountError('');
    const finalTitle = title.trim() || categoryLabel || category;
    createHabit({ category, title: finalTitle, unitPriceKRW: parsed });
    generateHapticFeedback({ type: 'success' });
    setToastOpen(true);
    navigate('/');
  };

  return (
    <>
      <Top title={<Top.TitleParagraph>습관 추가</Top.TitleParagraph>} />

      <Spacing size={16} />
      <Paragraph.Text typography="t4">어떤 습관을 참았나요?</Paragraph.Text>
      <Spacing size={12} />

      <ListRow
        onClick={() => setSheetOpen(true)}
        contents={
          <ListRow.Texts
            type="2RowTypeA"
            top="카테고리"
            bottom={categoryLabel ?? '선택해주세요'}
          />
        }
      />

      <Spacing size={16} />
      <TextField
        variant="box"
        label="제목(선택)"
        help="비워두면 카테고리 이름으로 저장해요"
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

      <Spacing size={24} />
      <Button variant="fill" onClick={handleSave}>
        저장
      </Button>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Paragraph.Text typography="t4">카테고리를 골라주세요</Paragraph.Text>
        <Spacing size={12} />
        {CATEGORIES.map((cat) => (
          <ListRow
            key={cat.value}
            onClick={() => {
              setCategory(cat.value);
              setSheetOpen(false);
              generateHapticFeedback({ type: 'tickWeak' });
            }}
            contents={<ListRow.Texts type="2RowTypeA" top={cat.label} bottom="" />}
          />
        ))}
      </BottomSheet>

      <Toast
        open={toastOpen}
        position="bottom"
        text="습관을 추가했어요"
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}
