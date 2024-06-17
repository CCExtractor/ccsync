import { toast } from 'react-toastify';
import '@testing-library/jest-dom';
import { showToast, ToastNotification } from '../ToastNotification';
import { render } from '@testing-library/react';

jest.mock('react-toastify/dist/ReactToastify.css', () => ({}));

jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
    },
    ToastContainer: jest.fn(() => null),
}));

describe('Toast Notification Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('showToast function should call toast.success with correct message', () => {
        const text = 'Test Text';
        showToast(text);
        expect(toast.success).toHaveBeenCalledWith(`${text} copied to clipboard!`, {
            position: 'bottom-left',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    });
});

describe('ToastNotification', () => {
    test('renders ToastContainer with correct properties', () => {
        render(<ToastNotification />);

        expect(jest.requireMock('react-toastify').ToastContainer).toHaveBeenCalledWith(
            expect.objectContaining({
                position: 'bottom-center',
                autoClose: 3000,
                hideProgressBar: false,
                newestOnTop: false,
                closeOnClick: true,
                rtl: false,
                pauseOnFocusLoss: true,
                draggable: true,
                pauseOnHover: true,
            }),
            {}
        );
    });
});
