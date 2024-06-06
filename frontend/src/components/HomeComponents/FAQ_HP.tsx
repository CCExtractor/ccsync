import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: "What is CCSync?",
    answer:
      "CCSync is a service that allows you to synchronize your tasks between your devices using Taskwarrior. It provides a hosted solution for taskchampion-sync-server, eliminating the need to set up and manage your own server.",
    value: "item-1",
  },
  {
    question:
      "What devices can I use with CCSync?",
    answer:
      "CCSync works with any device that can run Taskwarrior, including desktops, laptops, smartphones, and tablets.",
    value: "item-2",
  },
  {
    question: "How do I initialize sync between my clients?",
    answer: "The connection process is straightforward. Refer to the setup guide above for step-by-step instructions on configuring Taskwarrior to connect to our server.",
    value: "item-3",
  },
  {
    question:
      "Do you have access to my task content?",
    answer:
      "The tasks are stored securely in a Firestore database. It helps in making the tasks available on interfaces other than the PC, directly on the web!",
    value: "item-4",
  },
];

export const FAQ = () => {
  return (
    <section
      id="faq"
      className="container py-24 sm:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        Frequently Asked{" "}
        <span className="inline bg-gradient-to-r from-[#61DAFB]  to-[#1fc0f1] text-transparent bg-clip-text">
          Questions
        </span>
      </h2>

      <Accordion
        type="single"
        collapsible
        className="w-full AccordionRoot"
      >
        {FAQList.map(({ question, answer, value }: FAQProps) => (
          <AccordionItem
            key={value}
            value={value}
          >
            <AccordionTrigger className="text-left">
              {question}
            </AccordionTrigger>

            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <h3 className="font-medium mt-4">
        Still have questions?{" "}
        <a
          rel="noreferrer noopener"
          href="#contact"
          className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
          Contact us
        </a>
      </h3>
    </section>
  );
};
