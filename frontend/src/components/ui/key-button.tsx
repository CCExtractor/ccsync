export const Key = ({ label }: { label: string }) => {
  return (
    <img
      src={`https://key.pics/key/${label.toUpperCase()}.svg?size=15&color=dark&fontStyle=Bold&fontSize=12`}
      alt={label}
      className="hidden md:inline-block ml-2"
    ></img>
  );
};
