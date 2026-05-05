import { Top, Paragraph, Spacing } from '@toss/tds-mobile';

export default function BlockingPage() {
  return (
    <>
      <Top
        title={
          <Top.TitleParagraph>세션을 확인할 수 없어요</Top.TitleParagraph>
        }
      />
      <Spacing size={24} />
      <Paragraph.Text typography="t6" color="secondary">
        토스 앱에서 다시 열어주세요.
      </Paragraph.Text>
    </>
  );
}
