import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Footer } from '../Footer';

// mock the logo import
jest.mock('../../../../assets/logo.png', () => 'logo-path');

describe('Footer component', () => {
    test('renders without crashing', () => {
        render(<Footer />);
    });

    test('renders the logo with correct alt text', () => {
        render(<Footer />);
        const logoElement = screen.getByAltText('Logo');
        expect(logoElement).toBeInTheDocument();
    });
});
