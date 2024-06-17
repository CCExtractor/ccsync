import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../Pagination'; // Adjust the import path as necessary

describe('Pagination', () => {
    const mockPaginate = jest.fn();
    const mockGetDisplayedPages = jest.fn((totalPages, _currentPage) => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    });

    beforeEach(() => {
        mockPaginate.mockClear();
    });

    const renderComponent = (currentPage: number, totalPages: number) => {
        return render(
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                paginate={mockPaginate}
                getDisplayedPages={mockGetDisplayedPages}
            />
        );
    };

    it('renders correctly with given props', () => {
        renderComponent(1, 5);

        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('disables the "Previous" button on the first page', () => {
        renderComponent(1, 5);

        expect(screen.getByText('Previous')).toBeDisabled();
        expect(screen.getByText('Next')).toBeEnabled();
    });

    it('disables the "Next" button on the last page', () => {
        renderComponent(5, 5);

        expect(screen.getByText('Previous')).toBeEnabled();
        expect(screen.getByText('Next')).toBeDisabled();
    });

    it('calls paginate with correct arguments when a page button is clicked', () => {
        renderComponent(3, 5);

        fireEvent.click(screen.getByText('1'));
        fireEvent.click(screen.getByText('4'));

        expect(mockPaginate).toHaveBeenCalledWith(1);
        expect(mockPaginate).toHaveBeenCalledWith(4);
    });

    it('calls paginate with correct arguments when "Previous" and "Next" buttons are clicked', () => {
        renderComponent(3, 5);

        fireEvent.click(screen.getByText('Previous'));
        expect(mockPaginate).toHaveBeenCalledWith(2);

        fireEvent.click(screen.getByText('Next'));
        expect(mockPaginate).toHaveBeenCalledWith(4);
    });
});
