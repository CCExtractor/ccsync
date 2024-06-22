export const BlueHeading = ({ prefix, suffix }: { prefix: any, suffix: any }) => {
  return (
    <h2 className="text-3xl md:text-4xl font-bold mb-4">
      {prefix}{" "}
      <span className="inline bg-gradient-to-r from-[#61DAFB] to-[#1fc0f1] text-transparent bg-clip-text">
        {suffix}
      </span>
    </h2>
  );
};

