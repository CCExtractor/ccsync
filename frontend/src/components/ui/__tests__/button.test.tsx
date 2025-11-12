import { render } from '@testing-library/react';
import { Button } from '../button';

describe('Button Component using Snapshot', () => {
  it('renders default button correctly', () => {
    const { asFragment } = render(<Button>Default Button</Button>);
    expect(asFragment()).toMatchSnapshot('default-button');
  });
  it('renders destructive variant correctly', () => {
    const { asFragment } = render(
      <Button variant="destructive">Delete</Button>
    );
    expect(asFragment()).toMatchSnapshot('destructive-variant');
  });
  it('renders outline variant correctly', () => {
    const { asFragment } = render(<Button variant="outline">Outline</Button>);
    expect(asFragment()).toMatchSnapshot('outline-variant');
  });
  it('renders secondary variant correctly', () => {
    const { asFragment } = render(
      <Button variant="secondary">Secondary</Button>
    );
    expect(asFragment()).toMatchSnapshot('secondary-variant');
  });
  it('renders ghost variant correctly', () => {
    const { asFragment } = render(<Button variant="ghost">Ghost</Button>);
    expect(asFragment()).toMatchSnapshot('ghost-variant');
  });
  it('renders link variant correctly', () => {
    const { asFragment } = render(<Button variant="link">Link</Button>);
    expect(asFragment()).toMatchSnapshot('link-variant');
  });
  it('renders small size correctly', () => {
    const { asFragment } = render(<Button size="sm">Small</Button>);
    expect(asFragment()).toMatchSnapshot('small-size');
  });
  it('renders large size correctly', () => {
    const { asFragment } = render(<Button size="lg">Large</Button>);
    expect(asFragment()).toMatchSnapshot('large-size');
  });
  it('renders icon size correctly', () => {
    const { asFragment } = render(<Button size="icon">🔍</Button>);
    expect(asFragment()).toMatchSnapshot('icon-size');
  });

  it('renders with custom className correctly', () => {
    const { asFragment } = render(
      <Button className="custom-class another-class">Custom Button</Button>
    );
    expect(asFragment()).toMatchSnapshot('custom-classname');
  });

  it('renders asChild with link correctly', () => {
    const { asFragment } = render(
      <Button asChild>
        <a href="#test" target="_blank">
          Link Button
        </a>
      </Button>
    );
    expect(asFragment()).toMatchSnapshot('as-child-link');
  });

  it('renders asChild with button correctly', () => {
    const { asFragment } = render(
      <Button asChild>
        <button type="submit" form="myForm">
          Submit Button
        </button>
      </Button>
    );
    expect(asFragment()).toMatchSnapshot('as-child-button');
  });

  it('renders disabled correctly', () => {
    const { asFragment } = render(<Button disabled>Disabled Button</Button>);
    expect(asFragment()).toMatchSnapshot('disabled-button');
  });

  it('renders with onClick handler correctly', () => {
    const handleClick = jest.fn();
    const { asFragment } = render(
      <Button onClick={handleClick}>Clickable Button</Button>
    );
    expect(asFragment()).toMatchSnapshot('with-onclick');
  });

  it('renders with all props combined correctly', () => {
    const { asFragment } = render(
      <Button
        variant="outline"
        size="lg"
        className="combined-classes"
        disabled
        data-testid="test-button"
        aria-label="Test button"
      >
        Combined Props Button
      </Button>
    );
    expect(asFragment()).toMatchSnapshot('all-props-combined');
  });
});
