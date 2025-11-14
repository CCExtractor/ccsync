import { render, screen, fireEvent } from '@testing-library/react';
import { FAQItem } from '../FAQItem';
import { Accordion } from '@/components/ui/accordion';

const question = 'What is your return policy?';
const answer = 'You can return any item within 30 days of purchase.';
const value = 'faq-1';

describe('FAQItem', () => {
  test('renders question and answer correctly', () => {
    render(
      <Accordion type="single" collapsible className="w-full AccordionRoot">
        <FAQItem
          key={value}
          question={question}
          answer={answer}
          value={value}
        />
      </Accordion>
    );

    // check if the question is rendered
    expect(screen.getByText(question)).toBeInTheDocument();

    // clicking the trigger to expand the accordion
    fireEvent.click(screen.getByText(question));

    // check if the answer is visible after clicking
    expect(screen.getByText(answer)).toBeVisible();
  });
});

describe('FAQItem using Snapshot', () => {
  test('renders correctly', () => {
    const { asFragment } = render(
      <Accordion type="single" collapsible className="w-full AccordionRoot">
        <FAQItem question={question} answer={answer} value={value} />
      </Accordion>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
