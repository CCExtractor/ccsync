import { BottomBarProps, RouteProps, routeList } from '../bottom-bar-utils';

describe('RouteProps interface', () => {
  it('should have href and label properties', () => {
    const exampleRoute: RouteProps = { href: '#', label: 'Example' };
    expect(exampleRoute).toHaveProperty('href');
    expect(exampleRoute).toHaveProperty('label');
  });
});

describe('BottomBarProps interface', () => {
  it('should have project, status, and tag properties', () => {
    const example: BottomBarProps = {
      projects: [''],
      setSelectedProject: jest.fn(),
      status: [''],
      setSelectedStatus: jest.fn(),
      tags: [''],
      setSelectedTag: jest.fn(),
    };
    expect(example).toHaveProperty('projects');
    expect(example).toHaveProperty('setSelectedProject');
    expect(example).toHaveProperty('status');
    expect(example).toHaveProperty('setSelectedStatus');
    expect(example).toHaveProperty('tags');
    expect(example).toHaveProperty('setSelectedTag');
  });
});

describe('routeList array', () => {
  it('should be an array', () => {
    expect(Array.isArray(routeList)).toBe(true);
  });

  it('should contain objects with href and label properties', () => {
    routeList.forEach((route) => {
      expect(route).toHaveProperty('href');
      expect(route).toHaveProperty('label');
    });
  });

  it('should contain correct number of routes', () => {
    expect(routeList.length).toBe(2);
  });

  it('should match the predefined routes', () => {
    expect(routeList).toEqual([
      { href: '#', label: 'Home' },
      { href: '#tasks', label: 'Tasks' },
    ]);
  });
});
