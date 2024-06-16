import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

export const FAQItem = ({ question, answer, value }: FAQProps) => (
  <AccordionItem key={value} value={value}>
    <AccordionTrigger className="text-left">
      {question}
    </AccordionTrigger>
    <AccordionContent>{answer}</AccordionContent>
  </AccordionItem>
);
