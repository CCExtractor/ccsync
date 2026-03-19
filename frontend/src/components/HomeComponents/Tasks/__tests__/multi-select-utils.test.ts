import {
  getFilteredItems,
  shouldShowCreateOption,
} from '../multi-select-utils';

describe('getFilteredItems', () => {
  it('should return items matching the search term', () => {
    const result = getFilteredItems(['apple', 'banana', 'apricot'], [], 'ap');
    expect(result).toEqual(['apple', 'apricot']);
  });

  it('should perform case insensitive matching', () => {
    const result = getFilteredItems(['Apple', 'BANANA', 'apricot'], [], 'ap');
    expect(result).toEqual(['Apple', 'apricot']);
  });

  it('should exclude already selected items', () => {
    const result = getFilteredItems(
      ['apple', 'banana', 'apricot'],
      ['apple'],
      'ap'
    );
    expect(result).toEqual(['apricot']);
  });

  it('should return an empty array when no items match', () => {
    const result = getFilteredItems(['apple', 'banana'], [], 'xyz');
    expect(result).toEqual([]);
  });

  it('should return an empty array when all matching items are selected', () => {
    const result = getFilteredItems(
      ['apple', 'apricot'],
      ['apple', 'apricot'],
      'ap'
    );
    expect(result).toEqual([]);
  });

  it('should return all unselected items when search term is empty', () => {
    const result = getFilteredItems(['apple', 'banana'], ['banana'], '');
    expect(result).toEqual(['apple']);
  });

  it('should return an empty array when availableItems is empty', () => {
    const result = getFilteredItems([], [], 'ap');
    expect(result).toEqual([]);
  });

  it('should return all items when selectedItems is empty and search term is empty', () => {
    const result = getFilteredItems(['apple', 'banana'], [], '');
    expect(result).toEqual(['apple', 'banana']);
  });
});

describe('shouldShowCreateOption', () => {
  it('should return true when the search term is not in either of the lists', () => {
    const result = shouldShowCreateOption('cherry', ['apple', 'banana'], []);
    expect(result).toBe(true);
  });

  it('should return false if the search term exists in availableItems', () => {
    const result = shouldShowCreateOption('apple', ['apple', 'banana'], []);
    expect(result).toBe(false);
  });

  it('should return false when search term exists in selectedItems', () => {
    const result = shouldShowCreateOption('apple', [], ['apple']);
    expect(result).toBe(false);
  });

  it('should return false when the search term is already empty', () => {
    const result = shouldShowCreateOption('', ['apple'], []);
    expect(result).toBe(false);
  });

  it('should return false when the search term is only whitespace', () => {
    const result = shouldShowCreateOption('   ', ['apple'], []);
    expect(result).toBe(false);
  });

  it('should trim whitespace before comparing', () => {
    const result = shouldShowCreateOption('  cherry  ', ['apple'], []);
    expect(result).toBe(true);
  });

  it('should return false when the trimmed search term matches an available item', () => {
    const result = shouldShowCreateOption('  apple  ', ['apple'], []);
    expect(result).toBe(false);
  });

  it('should return true when both the lists are empty and search term is provided', () => {
    const result = shouldShowCreateOption('newItem', [], []);
    expect(result).toBe(true);
  });
});
