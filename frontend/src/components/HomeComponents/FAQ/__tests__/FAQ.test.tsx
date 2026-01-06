import React from 'react';
import { render, screen } from '@testing-library/react';
import { FAQ } from '../FAQ';
import { FAQList } from '../faq-utils';
import { url } from '@/components/utils/URLs';

jest.mock('../faq-utils', () => ({
  FAQList: [
    {
      question: 'What is React?',
      answer: 'A JavaScript library for building user interfaces.',
      value: 'q1',
    },
    {
      question: 'What is TypeScript?',
      answer:
        'A typed superset of JavaScript that compiles to plain JavaScript.',
      value: 'q2',
    },
  ],
}));

jest.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('../FAQItem', () => ({
  FAQItem: ({ question, answer }: { question: string; answer: string }) => (
    <div>
      <h3>{question}</h3>
      <p>{answer}</p>
    </div>
  ),
}));

describe('FAQ component', () => {
  test('renders without crashing', () => {
    render(<FAQ />);
  });

  test('renders the section title correctly', () => {
    render(<FAQ />);
    const titleElement = screen.getByText(/Frequently Asked/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders the FAQ items correctly', () => {
    render(<FAQ />);
    FAQList.forEach(({ question }) => {
      const questionElement = screen.getByText(question);
      expect(questionElement).toBeInTheDocument();
    });
  });

  test('renders the contact link correctly', () => {
    render(<FAQ />);
    const contactLink = screen.getByText(/Contact us/i);
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute('href', url.zulipURL);
  });
});

describe('FAQ component using snapshot', () => {
  test('renders correctly', () => {
    const { asFragment } = render(<FAQ />);
    expect(asFragment()).toMatchSnapshot();
  });
});
