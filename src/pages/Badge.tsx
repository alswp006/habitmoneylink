import { useNavigate } from 'react-router-dom';
import { Top, Paragraph, Spacing, ListRow } from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAppStore } from '@/lib/store/AppStore';

export default function BadgePage() {
  const navigate = useNavigate();
  const { badges, isHydrating } = useAppStore();

  if (isHydrating) {
    return <Paragraph.Text typography="t6">불러오는 중</Paragraph.Text>;
  }

  const lockedStreak7 = badges.find((b) => b.id === 'streak_7' && b.unlockedAt === null);

  const handleUnlockTap = (badgeId: string) => {
    generateHapticFeedback({ type: 'tickWeak' });
    navigate('/badge/unlock', { state: { badgeId } });
  };

  return (
    <>
      <Top title={<Top.TitleParagraph>배지 보관함</Top.TitleParagraph>} />

      <Spacing size={16} />

      {badges.map((badge) => (
        <ListRow
          key={badge.id}
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top={badge.title}
              bottom={badge.unlockedAt ? '획득함' : '잠김'}
            />
          }
        />
      ))}

      {lockedStreak7 && (
        <>
          <Spacing size={8} />
          <ListRow
            onClick={() => handleUnlockTap(lockedStreak7.id)}
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top="배지 잠금 해제"
                bottom="보상형 광고를 보고 배지를 열어요"
              />
            }
          />
        </>
      )}
    </>
  );
}
