export interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

export const FAQList: FAQProps[] = [
  {
    question: 'What is CCSync?',
    answer:
      'CCSync is a service that allows you to synchronize your tasks between your devices using Taskwarrior. It provides a hosted solution for taskchampion-sync-server, eliminating the need to set up and manage your own server.',
    value: 'item-1',
  },
  {
    question: 'What devices can I use with CCSync?',
    answer:
      'CCSync works with any device that can run Taskwarrior, including desktops, laptops, smartphones, and tablets.',
    value: 'item-2',
  },
  {
    question: 'How do I initialize sync between my clients?',
    answer:
      'The connection process is straightforward. Refer to the setup guide above for step-by-step instructions on configuring Taskwarrior to connect to our server.',
    value: 'item-3',
  },
  {
    question: 'Do you have access to my task content?',
    answer:
      'The tasks are stored securely in a Firestore database. It helps in making the tasks available on interfaces other than the PC, directly on the web!',
    value: 'item-4',
  },
];
