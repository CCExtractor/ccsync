import { render } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from '../avatar';

const testImageSrc =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzYjgyZjYiLz4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMyIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMjUiIGN5PSIxNSIgcj0iMyIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEwIDI1IFEyMCAzMCAzMCAyNSIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';

describe('Avatar Component using Snapshot', () => {
  it('renders basic avatar with image correctly', () => {
    const { asFragment } = render(
      <Avatar>
        <AvatarImage src={testImageSrc} alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    );
    expect(asFragment()).toMatchSnapshot('basic-avatar');
  });

  it('renders avatar with fallback only correctly', () => {
    const { asFragment } = render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    expect(asFragment()).toMatchSnapshot('fallback-only');
  });

  it('renders avatar with long fallback text correctly', () => {
    const { asFragment } = render(
      <Avatar>
        <AvatarFallback>John Doe</AvatarFallback>
      </Avatar>
    );
    expect(asFragment()).toMatchSnapshot('long-fallback');
  });

  it('renders avatar with custom className correctly', () => {
    const { asFragment } = render(
      <Avatar className="w-20 h-20">
        <AvatarImage
          src={testImageSrc}
          alt="@shadcn"
          className="custom-image"
        />
        <AvatarFallback className="custom-fallback">CN</AvatarFallback>
      </Avatar>
    );
    expect(asFragment()).toMatchSnapshot('custom-classes');
  });

  it('renders avatar with broken image (shows fallback) correctly', () => {
    const { asFragment } = render(
      <Avatar>
        <AvatarImage src="broken-url.jpg" alt="Broken" />
        <AvatarFallback>BR</AvatarFallback>
      </Avatar>
    );
    expect(asFragment()).toMatchSnapshot('broken-image');
  });

  it('renders avatar without fallback correctly', () => {
    const { asFragment } = render(
      <Avatar>
        <AvatarImage src={testImageSrc} alt="@shadcn" />
      </Avatar>
    );
    expect(asFragment()).toMatchSnapshot('no-fallback');
  });

  it('renders avatar with single character fallback correctly', () => {
    const { asFragment } = render(
      <Avatar>
        <AvatarFallback>A</AvatarFallback>
      </Avatar>
    );
    expect(asFragment()).toMatchSnapshot('single-char');
  });
});
