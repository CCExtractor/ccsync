// CopyButton.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { CopyButton } from '../CopyButton';
import { showToast } from '../ToastNotification';

jest.mock('../ToastNotification', () => ({
  showToast: jest.fn(),
}));

const textToCopy = 'Example text';
const label = 'Copied to clipboard';

describe('CopyButton Component', () => {
  test('copies text to clipboard and shows toast on copy', () => {
    const { getByRole } = render(
      <CopyButton text={textToCopy} label={label} />
    );
    const button = getByRole('button');

    fireEvent.click(button);
    expect(showToast).toHaveBeenCalledWith(label);
  });
});

describe('CopyButton Component using snapshot', () => {
  test('renders correctly', () => {
    const { asFragment } = render(
      <CopyButton text={textToCopy} label={label} />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
