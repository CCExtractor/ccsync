import { Button } from '@/components/ui/button';
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  paginate: (page: number) => void;
  getDisplayedPages: (totalPages: number, currentPage: number) => number[];
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, paginate, getDisplayedPages }) => {
  return (
    <div className="flex justify-center mt-4 space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <nav>
        <ul className="flex space-x-2">
          {getDisplayedPages(totalPages, currentPage).map(page => (
            <li key={page}>
              <Button
                size="sm"
                variant={currentPage === page ? "secondary" : "outline"}
                onClick={() => paginate(page)}
              >
                {page}
              </Button>
            </li>
          ))}
        </ul>
      </nav>
      <Button
        variant="outline"
        size="sm"
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
