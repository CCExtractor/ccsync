import { TableCell, TableRow } from '@/components/ui/table';

export const Taskskeleton = ({ count }: { count: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          <TableCell className="py-3">
            <div className="h-5 w-6 bg-[#252528] rounded-md"></div>
          </TableCell>

          <TableCell className="py-3">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-[#252528] rounded-full"></div>
              <div className="h-5 w-16 md:w-48 bg-[#252528] rounded-xl"></div>
              <div className="h-5 w-12 md:w-16 bg-[#252528] rounded-xl"></div>
            </div>
          </TableCell>
          <TableCell className="py-3">
            <div className="h-5 w-6 bg-[#252528] rounded-md"></div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};
