import { render, screen } from '@testing-library/react';
import { Contact, ContactProps } from '../Contact';
import { AiOutlineDiscord } from 'react-icons/ai';
import { SlackIcon, GithubIcon, MailIcon } from 'lucide-react';

jest.mock('lucide-react', () => ({
  SlackIcon: jest.fn().mockReturnValue(<div data-testid="mocked-slack-icon" />),
  GithubIcon: jest.fn().mockReturnValue(<div data-testid="mocked-github-icon" />),
  MailIcon: jest.fn().mockReturnValue(<div data-testid="mocked-mail-icon" />),
}));

jest.mock('react-icons/ai', () => ({
  AiOutlineDiscord: jest.fn().mockReturnValue(<div data-testid="mocked-discord-icon" />),
}));

describe('Contact component', () => {
  const mockContactList: ContactProps[] = [
    {
      icon: <SlackIcon size={45} />,
      name: 'Slack',
      position: 'Join our slack channel',
      url: '',
    },
    {
      icon: <GithubIcon size={45} />,
      name: 'Github',
      position: 'Check out our Github repository',
      url: '',
    },
    {
      icon: <AiOutlineDiscord size={45} />,
      name: 'Discord',
      position: 'Join us at Discord for discussions',
      url: '',
    },
    {
      icon: <MailIcon size={45} />,
      name: 'Email',
      position: 'Email us for any queries',
      url: '',
    },
  ];

  beforeEach(() => {
    render(<Contact />);
  });

  test('renders all contact cards', () => {
    mockContactList.forEach(({ name, position }) => {
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getByText(position)).toBeInTheDocument();
    });
  });

  test('renders Slack icon', () => {
    expect(screen.getByTestId('mocked-slack-icon')).toBeInTheDocument();
  });

  test('renders Github icon', () => {
    expect(screen.getByTestId('mocked-github-icon')).toBeInTheDocument();
  });

  test('renders Discord icon', () => {
    expect(screen.getByTestId('mocked-discord-icon')).toBeInTheDocument();
  });

  test('renders Email icon', () => {
    expect(screen.getByTestId('mocked-mail-icon')).toBeInTheDocument();
  });
});
