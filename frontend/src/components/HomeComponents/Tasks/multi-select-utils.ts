export const getFilteredItems = (
  availableItems: string[],
  selectedItems: string[],
  searchTerm: string
): string[] => {
  return availableItems.filter(
    (item) =>
      item.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedItems.includes(item)
  );
};

export const shouldShowCreateOption = (
  searchTerm: string,
  availableItems: string[],
  selectedItems: string[]
): boolean => {
  const trimmed = searchTerm.trim();
  return (
    !!trimmed &&
    !availableItems.includes(trimmed) &&
    !selectedItems.includes(trimmed)
  );
};
