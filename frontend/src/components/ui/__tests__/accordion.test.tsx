import { render } from '@testing-library/react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../accordion';

describe('Accordion Component using Snapshot', () => {
  it('renders basic accordion correctly', () => {
    const { asFragment } = render(
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    expect(asFragment()).toMatchSnapshot('basic-accordion');
  });

  it('renders accordion with multiple items correctly', () => {
    const { asFragment } = render(
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Is it styled?</AccordionTrigger>
          <AccordionContent>
            Yes. It comes with default styles that matches the other components'
            aesthetic.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Is it animated?</AccordionTrigger>
          <AccordionContent>
            Yes. It's animated by default, but you can disable it if you prefer.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    expect(asFragment()).toMatchSnapshot('multiple-items');
  });

  it('renders accordion with custom className correctly', () => {
    const { asFragment } = render(
      <Accordion type="single" collapsible className="w-full custom-accordion">
        <AccordionItem value="item-1" className="custom-item">
          <AccordionTrigger className="custom-trigger">
            Custom Trigger
          </AccordionTrigger>
          <AccordionContent className="custom-content">
            Custom content with custom styling.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    expect(asFragment()).toMatchSnapshot('custom-classes');
  });

  it('renders accordion with disabled item correctly', () => {
    const { asFragment } = render(
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Enabled Item</AccordionTrigger>
          <AccordionContent>This item can be clicked.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" disabled>
          <AccordionTrigger>Disabled Item</AccordionTrigger>
          <AccordionContent>This item is disabled.</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    expect(asFragment()).toMatchSnapshot('disabled-item');
  });

  it('renders accordion with long content correctly', () => {
    const { asFragment } = render(
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Long Content</AccordionTrigger>
          <AccordionContent>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    expect(asFragment()).toMatchSnapshot('long-content');
  });
});
