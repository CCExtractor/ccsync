import { Accordion } from "@/components/ui/accordion";
import { FAQItem } from "./FAQItem";
import { FAQList } from "./faq-utils";
import { BlueHeading } from "@/lib/utils";

export const FAQ = () => {
  return (
    <section id="faq" className="container py-24 sm:py-32">
      <BlueHeading prefix="Frequently Asked" suffix="Questions" />

      <Accordion type="single" collapsible className="w-full AccordionRoot">
        {FAQList.map(({ question, answer, value }) => (
          <FAQItem key={value} question={question} answer={answer} value={value} />
        ))}
      </Accordion>

      <h3 className="font-medium mt-4">
        Still have questions?{" "}
        <a
          rel="noreferrer noopener"
          href="#contact"
          className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text"
        >
          Contact us
        </a>
      </h3>
    </section>
  );
};
