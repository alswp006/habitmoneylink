import { Top, Paragraph, Spacing, ListRow, Button } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';

/**
 * Golden Home page — TDS Mobile reference template.
 *
 * AI agents writing other pages should mimic these patterns:
 * - <Top title={<Top.TitleParagraph>...}> for top navigation
 * - <Paragraph.Text typography="t5"> for body text (use t1~t7, st1~st13)
 * - <ListRow contents={<ListRow.Texts type="2RowTypeA" top bottom />}> for list items
 * - <Spacing size={N}> between sections (NEVER use margin/padding on TDS components)
 * - <Button variant="fill"> for primary CTA (variants: 'fill' | 'weak' only)
 * - Layout containers (flex/grid wrappers) MAY use inline padding for outer gutters.
 *
 * Scaffold tokens (replaced by scaffold-toss.ts at project creation):
 *   HabitMoneyLink -> the app's display name
 *   나쁜 습관(담배·커피·배달)을 끊으면 절약되는 돈을 실시간으로 쌓아 목표 자산과 연결하는 동기 부여 앱    -> the one-line description
 */

const HIGHLIGHTS = [
  { title: '간편한 사용', description: '몇 번의 터치로 결과를 확인하세요' },
  { title: '빠른 처리', description: '복잡한 입력 없이 바로 시작합니다' },
  { title: '안전한 보관', description: '데이터는 이 기기에만 저장됩니다' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <Top
        title={
          <Top.TitleParagraph>HabitMoneyLink</Top.TitleParagraph>
        }
      />

      {/* Hero subtitle */}
      <div style={{ padding: '0 24px' }}>
        <Spacing size={8} />
        <Paragraph.Text typography="t5">나쁜 습관(담배·커피·배달)을 끊으면 절약되는 돈을 실시간으로 쌓아 목표 자산과 연결하는 동기 부여 앱</Paragraph.Text>
        <Spacing size={32} />
      </div>

      {/* Feature highlights (sample list — replace or extend per app) */}
      <div>
        {HIGHLIGHTS.map((h, idx) => (
          <ListRow
            key={idx}
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={h.title}
                bottom={h.description}
              />
            }
          />
        ))}
      </div>

      <Spacing size={32} />

      {/* Primary CTA — flow-positioned (not fixed) for landing simplicity.
          Form/result screens may use position:fixed bottom with safe-area padding. */}
      <div style={{ padding: '0 24px' }}>
        <Button variant="fill" onClick={() => navigate('/')}>
          시작하기
        </Button>
      </div>

      <Spacing size={24} />
    </>
  );
}
