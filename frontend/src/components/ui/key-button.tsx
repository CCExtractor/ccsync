export const Key = ({ lable }: { lable: string }) => {
  return (
    <img
      src={`https://key.pics/key/${lable.toUpperCase()}.svg?size=15&color=dark&fontStyle=Bold&fontSize=12`}
      alt={lable}
      className="hidden md:inline-block ml-2"
    ></img>
  );
};
