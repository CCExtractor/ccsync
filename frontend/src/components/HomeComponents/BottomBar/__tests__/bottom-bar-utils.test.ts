import { BottomBarProps, RouteProps, routeList } from '../bottom-bar-utils';

describe('RouteProps interface', () => {
  it('should have href and label properties', () => {
    const exampleRoute: RouteProps = { href: '#', label: 'Example' };
    expect(exampleRoute).toHaveProperty('href');
    expect(exampleRoute).toHaveProperty('label');
  });
});

describe('BottomBarProps interface', () => {
  it('should have project and status properties', () => {
    const example: BottomBarProps = {
      projects: [''],
      selectedProject: '',
      setSelectedProject: jest.fn(),
      status: [''],
      selectedStatus: '',
      setSelectedStatus: jest.fn(),
    };
    expect(example).toHaveProperty('projects');
    expect(example).toHaveProperty('selectedProject');
    expect(example).toHaveProperty('setSelectedProject');
    expect(example).toHaveProperty('status');
    expect(example).toHaveProperty('selectedStatus');
    expect(example).toHaveProperty('setSelectedStatus');
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
