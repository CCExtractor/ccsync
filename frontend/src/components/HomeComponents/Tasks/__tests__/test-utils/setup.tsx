export const createMockProps = () => ({
  origin: '',
  email: 'test@example.com',
  encryptionSecret: 'mockEncryptionSecret',
  UUID: 'mockUUID',
  isLoading: false,
  setIsLoading: jest.fn(),
});

export const mockTasks = [
  ...Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    description: `Task ${i + 1}`,
    status: 'pending',
    project: i % 2 === 0 ? 'ProjectA' : 'ProjectB',
    tags: i % 3 === 0 ? ['tag1'] : ['tag2'],
    uuid: `uuid-${i + 1}`,
    due: i === 0 ? '20200101T120000Z' : undefined,
  })),
  {
    id: 13,
    description:
      'Task 13: Prepare quarterly financial analysis report for review',
    status: 'pending',
    project: 'Finance',
    tags: ['report', 'analysis'],
    uuid: 'uuid-corp-1',
  },
  {
    id: 14,
    description: 'Task 14: Schedule client onboarding meeting with Sales team',
    status: 'pending',
    project: 'Sales',
    tags: ['meeting', 'client'],
    uuid: 'uuid-corp-2',
  },
  {
    id: 15,
    description:
      'Task 15: Draft technical documentation for API integration module',
    status: 'pending',
    project: 'Engineering',
    tags: ['documentation', 'api'],
    uuid: 'uuid-corp-3',
  },
  {
    id: 16,
    description: 'Completed Task 1',
    status: 'completed',
    project: 'ProjectA',
    tags: ['completed'],
    uuid: 'uuid-completed-1',
  },
  {
    id: 17,
    description: 'Deleted Task 1',
    status: 'deleted',
    project: 'ProjectB',
    tags: ['deleted'],
    uuid: 'uuid-deleted-1',
  },
];

export const createToastMock = () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
});

export const createTasksUtilsMock = () => {
  const originalModule = jest.requireActual('../../tasks-utils');
  return {
    ...originalModule,
    markTaskAsCompleted: jest.fn(),
    bulkMarkTasksAsCompleted: jest.fn().mockResolvedValue(true),
    markTaskAsDeleted: jest.fn(),
    bulkMarkTasksAsDeleted: jest.fn().mockResolvedValue(true),
    getTimeSinceLastSync: jest
      .fn()
      .mockReturnValue('Last updated 5 minutes ago'),
    hashKey: jest.fn((key: string) => `mockHashedKey-${key}`),
    getPinnedTasks: jest.fn().mockReturnValue(new Set()),
    togglePinnedTask: jest.fn(),
  };
};

export const createHooksMock = () => ({
  TasksDatabase: jest.fn(() => ({
    tasks: {
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue(mockTasks),
          delete: jest.fn().mockResolvedValue(undefined),
        })),
      })),
      bulkPut: jest.fn().mockResolvedValue(undefined),
    },
    transaction: jest.fn(async (_mode, _table, callback) => {
      await callback();
      return Promise.resolve();
    }),
  })),
  fetchTaskwarriorTasks: jest.fn().mockResolvedValue([]),
  addTaskToBackend: jest.fn().mockResolvedValue({}),
  editTaskOnBackend: jest.fn().mockResolvedValue({}),
  modifyTaskOnBackend: jest.fn().mockResolvedValue({}),
});

export const selectMock = {
  Select: ({ children, onValueChange, value }: any) => (
    <select
      data-testid="project-select"
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => children,
  SelectValue: ({ placeholder }: any) => (
    <option value="" disabled hidden>
      {placeholder}
    </option>
  ),
  SelectContent: ({ children }: any) => children,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
};
