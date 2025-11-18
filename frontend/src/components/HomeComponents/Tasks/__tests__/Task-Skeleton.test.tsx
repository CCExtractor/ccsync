import { render } from '@testing-library/react';
import { Taskskeleton } from '../Task-Skeleton';

// Mock Table components
jest.mock('@/components/ui/table', () => ({
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
}));

describe('Taskskeleton', () => {
  describe('Rendering', () => {
    it('renders correct number of skeleton rows', () => {
      const { container } = render(<Taskskeleton count={5} />);
      const rows = container.querySelectorAll('tr');
      expect(rows).toHaveLength(5);
    });

    it('renders single skeleton row when count is 1', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const rows = container.querySelectorAll('tr');
      expect(rows).toHaveLength(1);
    });

    it('renders no skeleton rows when count is 0', () => {
      const { container } = render(<Taskskeleton count={0} />);
      const rows = container.querySelectorAll('tr');
      expect(rows).toHaveLength(0);
    });

    it('renders correct number of skeleton rows for large count', () => {
      const { container } = render(<Taskskeleton count={20} />);
      const rows = container.querySelectorAll('tr');
      expect(rows).toHaveLength(20);
    });

    it('renders correct number of cells per row', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const cells = container.querySelectorAll('td');
      expect(cells).toHaveLength(3); // ID, Description, Status
    });
  });

  describe('Styling and Animation', () => {
    it('applies animate-pulse class to skeleton rows', () => {
      const { container } = render(<Taskskeleton count={3} />);
      const rows = container.querySelectorAll('tr');

      rows.forEach((row) => {
        expect(row).toHaveClass('animate-pulse');
      });
    });

    it('applies correct background color to skeleton elements', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const skeletonDivs = container.querySelectorAll('div');

      // Check that at least one skeleton div has the correct background color
      const hasBgClass = Array.from(skeletonDivs).some((div) =>
        div.className.includes('bg-[#252528]')
      );
      expect(hasBgClass).toBe(true);
    });

    it('applies correct padding to cells', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const cells = container.querySelectorAll('td');

      cells.forEach((cell) => {
        expect(cell).toHaveClass('py-3');
      });
    });

    it('applies rounded corners to skeleton elements', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const skeletonDivs = container.querySelectorAll('div');

      // Check that elements have appropriate rounded corners
      const hasRoundedClasses = Array.from(skeletonDivs).some(
        (div) =>
          div.className.includes('rounded-md') ||
          div.className.includes('rounded-full') ||
          div.className.includes('rounded-xl')
      );
      expect(hasRoundedClasses).toBe(true);
    });
  });

  describe('Skeleton Structure', () => {
    it('renders ID column skeleton with correct dimensions', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const idSkeleton = container.querySelector('td:first-child div');

      expect(idSkeleton).toHaveClass('h-5');
      expect(idSkeleton).toHaveClass('w-6');
    });

    it('renders description column with priority indicator and text skeletons', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const descriptionCell = container.querySelector('td:nth-child(2)');
      const skeletonElements = descriptionCell?.querySelectorAll('div');

      expect(skeletonElements?.length).toBeGreaterThan(1); // Priority + text + badge
    });

    it('renders priority indicator as circular skeleton', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const skeletonDivs = container.querySelectorAll('div');

      // Check that there's a circular skeleton element (rounded-full)
      const hasCircularSkeleton = Array.from(skeletonDivs).some((div) =>
        div.className.includes('rounded-full')
      );
      expect(hasCircularSkeleton).toBe(true);
    });

    it('renders description text skeleton with responsive width', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const descriptionText = container.querySelector(
        'td:nth-child(2) div:nth-child(2)'
      );

      expect(descriptionText).toHaveClass('w-16');
      expect(descriptionText).toHaveClass('md:w-48');
    });

    it('renders project badge skeleton', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const badgeSkeleton = container.querySelector(
        'td:nth-child(2) div:nth-child(3)'
      );

      expect(badgeSkeleton).toHaveClass('w-12');
      expect(badgeSkeleton).toHaveClass('md:w-16');
    });

    it('renders status column skeleton with correct dimensions', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const statusSkeleton = container.querySelector('td:last-child div');

      expect(statusSkeleton).toHaveClass('h-5');
      expect(statusSkeleton).toHaveClass('w-6');
    });

    it('applies flex layout to description cell content', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const descriptionContent = container.querySelector(
        'td:nth-child(2) > div'
      );

      expect(descriptionContent).toHaveClass('flex');
      expect(descriptionContent).toHaveClass('items-center');
      expect(descriptionContent).toHaveClass('space-x-2');
    });
  });

  describe('Multiple Rows', () => {
    it('renders each row with unique key', () => {
      const { container } = render(<Taskskeleton count={5} />);
      const rows = container.querySelectorAll('tr');

      // Check that each row is rendered (React would warn if keys weren't unique)
      expect(rows).toHaveLength(5);
    });

    it('renders consistent structure across multiple rows', () => {
      const { container } = render(<Taskskeleton count={3} />);
      const rows = container.querySelectorAll('tr');

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        expect(cells).toHaveLength(3);
        expect(row).toHaveClass('animate-pulse');
      });
    });

    it('renders identical skeleton structure for each row', () => {
      const { container } = render(<Taskskeleton count={3} />);
      const rows = container.querySelectorAll('tr');

      const firstRowHTML = rows[0].innerHTML;
      rows.forEach((row) => {
        expect(row.innerHTML).toBe(firstRowHTML);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles negative count gracefully', () => {
      const { container } = render(<Taskskeleton count={-1} />);
      const rows = container.querySelectorAll('tr');
      expect(rows).toHaveLength(0);
    });

    it('handles very large count', () => {
      const { container } = render(<Taskskeleton count={100} />);
      const rows = container.querySelectorAll('tr');
      expect(rows).toHaveLength(100);
    });

    it('renders fragment wrapper correctly', () => {
      const { container } = render(<Taskskeleton count={2} />);

      // The component returns a fragment, so the container's first child should be the first tr
      expect(container.firstChild?.nodeName).toBe('TR');
    });
  });

  describe('Accessibility', () => {
    it('maintains proper table structure for screen readers', () => {
      const { container } = render(<Taskskeleton count={3} />);

      // All rows should have cells
      const rows = container.querySelectorAll('tr');
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        expect(cells.length).toBeGreaterThan(0);
      });
    });

    it('does not contain any interactive elements', () => {
      const { container } = render(<Taskskeleton count={3} />);

      // Skeleton should not have buttons, links, or inputs
      expect(container.querySelectorAll('button')).toHaveLength(0);
      expect(container.querySelectorAll('a')).toHaveLength(0);
      expect(container.querySelectorAll('input')).toHaveLength(0);
    });
  });

  describe('Visual Consistency', () => {
    it('uses consistent color scheme across all skeleton elements', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const skeletonDivs = container.querySelectorAll('div');

      // Check that skeleton divs with backgrounds use the consistent color
      const bgDivs = Array.from(skeletonDivs).filter((div) =>
        div.className.includes('bg-')
      );
      expect(bgDivs.length).toBeGreaterThan(0);
    });

    it('maintains spacing between elements', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const descriptionContent = container.querySelector(
        'td:nth-child(2) > div'
      );

      expect(descriptionContent).toHaveClass('space-x-2');
    });

    it('uses correct height values for skeleton elements', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const skeletonDivs = container.querySelectorAll('div');

      // Check that skeleton divs have height classes
      const hasHeightClasses = Array.from(skeletonDivs).some(
        (div) => div.className.includes('h-4') || div.className.includes('h-5')
      );
      expect(hasHeightClasses).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive width classes to description text', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const descriptionText = container.querySelector(
        'td:nth-child(2) div:nth-child(2)'
      );

      // Should have base and md breakpoint widths
      expect(descriptionText?.className).toContain('w-16');
      expect(descriptionText?.className).toContain('md:w-48');
    });

    it('applies responsive width classes to badge skeleton', () => {
      const { container } = render(<Taskskeleton count={1} />);
      const badgeSkeleton = container.querySelector(
        'td:nth-child(2) div:nth-child(3)'
      );

      expect(badgeSkeleton?.className).toContain('w-12');
      expect(badgeSkeleton?.className).toContain('md:w-16');
    });
  });
});
