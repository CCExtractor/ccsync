import { Accordion } from '@/components/ui/accordion';
import { FAQItem } from './FAQItem';
import { FAQList } from './faq-utils';
import { BlueHeading } from '@/lib/utils';
import { url } from '@/components/utils/URLs';
import { HighlightLink } from '@/components/ui/link-highlight';

export const FAQ = () => {
  return (
    <section id="faq" className="container py-24 sm:py-32">
      <BlueHeading prefix="Frequently Asked" suffix="Questions" />

      <Accordion type="single" collapsible className="w-full AccordionRoot">
        {FAQList.map(({ question, answer, value }) => (
          <FAQItem
            key={value}
            question={question}
            answer={answer}
            value={value}
          />
        ))}
      </Accordion>

      <h3 className="font-medium mt-4">
        Still have questions?{' '}
        <HighlightLink rel="noreferrer noopener" href={url.githubRepoURL}>
                      Contact us
                    </HighlightLink>
      
      </h3>
    </section>
  );
};
