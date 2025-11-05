interface TooltipProps {
  children: React.ReactNode;
  title: string;
  position?: 'top' | 'bottom';
}

const Tooltip = ({ children, title, position }: TooltipProps) => {
  const topClasses =
    'after:-translate-x-1/2 after:left-1/2 group-hover:bottom-full group-hover:opacity-100 -translate-y-2.5 bottom-1/2 group-focus:opacity-100 group-focus:bottom-full';
  const bottomClasses =
    'after:top-0 after:-translate-y-1/2 after:left-1/2 after:-translate-x-1/2 top-1/2 group-hover:top-full group-hover:opacity-100 translate-y-2.5 group-focus:opacity-100 group-focus:top-full';

  return (
    <div className="relative group" tabIndex={0}>
      {children}
      <span
        className={`pointer-events-none z-10 bg-stone-700 opacity-0 text-white px-2 text-nowrap py-1 text-xs absolute left-1/2 -translate-x-1/2 rounded-sm transition-['transform,opacity'] shadow-slate-900/60 duration-200 after:size-2 after:rotate-45 after:block after:bg-stone-700 after:absolute shadow-md ${position === 'top' ? topClasses : bottomClasses}`}
      >
        {title}
      </span>
    </div>
  );
};

export default Tooltip;
