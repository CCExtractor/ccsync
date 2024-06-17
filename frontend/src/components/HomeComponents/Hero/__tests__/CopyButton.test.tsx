// CopyButton.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { CopyButton } from '../CopyButton';
import { showToast } from '../ToastNotification';

jest.mock('../ToastNotification', () => ({
    showToast: jest.fn(),
}));

describe('CopyButton Component', () => {
    test('copies text to clipboard and shows toast on copy', () => {
        const textToCopy = 'Example text';
        const label = 'Copied to clipboard';
        const { getByRole } = render(<CopyButton text={textToCopy} label={label} />);
        const button = getByRole('button');

        fireEvent.click(button);
        expect(showToast).toHaveBeenCalledWith(label);
    });
});
