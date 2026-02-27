/**
 * @file data-display-workflows.integration.test.tsx
 * @description Integration tests for data display and presentation workflows
 * @week Week 2 Day 14
 * @testCategory Integration Testing
 */

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import React, { useState } from 'react';

// ============================================================================
// TEST COMPONENTS - Realistic Data Display Examples
// ============================================================================

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

/**
 * User Table with Sorting and Selection
 */
const UserTable = ({ onRowClick }: { onRowClick?: (user: User) => void }) => {
  const [users] = useState<User[]>([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'Editor', status: 'active' },
  ]);

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [sortField, setSortField] = useState<'name' | 'email' | 'role'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'name' | 'email' | 'role') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const modifier = sortOrder === 'asc' ? 1 : -1;
    return aValue.localeCompare(bValue) * modifier;
  });

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedUsers(selectedUsers.length === users.length ? [] : users.map((u) => u.id));
  };

  return (
    <div>
      <div className='mb-4'>
        <p>Selected: {selectedUsers.length} users</p>
        {selectedUsers.length > 0 && (
          <Button onClick={() => setSelectedUsers([])}>Clear Selection</Button>
        )}
      </div>
      <Table>
        <TableCaption>List of users in the system</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className='w-12'>
              <Checkbox
                checked={selectedUsers.length === users.length}
                onCheckedChange={toggleSelectAll}
                aria-label='Select all users'
              />
            </TableHead>
            <TableHead>
              <Button variant='ghost' onClick={() => handleSort('name')}>
                Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant='ghost' onClick={() => handleSort('email')}>
                Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant='ghost' onClick={() => handleSort('role')}>
                Role {sortField === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.map((user) => (
            <TableRow
              key={user.id}
              onClick={() => onRowClick?.(user)}
              className={selectedUsers.includes(user.id) ? 'bg-gray-100' : ''}
            >
              <TableCell>
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => toggleUserSelection(user.id)}
                  aria-label={`Select ${user.name}`}
                />
              </TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                  {user.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

/**
 * User Card - Card + Avatar + Badge Composition
 */
const UserCard = ({ user }: { user: User }) => {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center gap-4'>
        <Avatar fallback={user.name.slice(0, 2).toUpperCase()} />
        <div className='flex-1'>
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </div>
        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status}</Badge>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
          <p>
            <strong>ID:</strong> {user.id}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * User Grid - Multiple User Cards
 */
const UserGrid = ({ users }: { users: User[] }) => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' role='list'>
      {users.map((user) => (
        <div key={user.id} role='listitem'>
          <UserCard user={user} />
        </div>
      ))}
    </div>
  );
};

/**
 * Loading State - Skeleton + Progress
 */
const LoadingState = ({ progress }: { progress: number }) => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-4 w-1/2' />
        <Skeleton className='h-3 w-3/4 mt-2' />
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
          <Skeleton className='h-4 w-4/6' />
          <div className='mt-4'>
            <p className='text-sm mb-2'>Loading: {progress}%</p>
            <Progress value={progress} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Data Dashboard - Combined Data Display Components
 */
const DataDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [users] = useState<User[]>([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
  ]);

  React.useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setLoading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loading]);

  if (loading) {
    return <LoadingState progress={progress} />;
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Overview</CardTitle>
          <CardDescription>Your team members and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-3 gap-4'>
            <div>
              <p className='text-sm text-gray-500'>Total Users</p>
              <p className='text-2xl font-bold'>{users.length}</p>
            </div>
            <div>
              <p className='text-sm text-gray-500'>Active</p>
              <p className='text-2xl font-bold'>
                {users.filter((u) => u.status === 'active').length}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-500'>Inactive</p>
              <p className='text-2xl font-bold'>
                {users.filter((u) => u.status === 'inactive').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <UserGrid users={users} />
    </div>
  );
};

// ============================================================================
// INTEGRATION TESTS - Table + Sorting + Selection Workflow
// ============================================================================

describe('Integration: Table + Sorting + Selection Workflow', () => {
  describe('Component Integration', () => {
    it('should render table with all components', () => {
      render(<UserTable />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText(/list of users in the system/i)).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(5); // 1 header + 4 data rows
    });

    it('should integrate Badge components in table cells', () => {
      render(<UserTable />);

      const activeBadges = screen.getAllByText(/active/i);
      const inactiveBadges = screen.getAllByText(/inactive/i);

      expect(activeBadges.length).toBeGreaterThan(0);
      expect(inactiveBadges.length).toBeGreaterThan(0);
    });

    it('should integrate Checkbox components in table', () => {
      render(<UserTable />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0); // Select all + row checkboxes
    });
  });

  describe('User Workflow: Row Selection', () => {
    it('should select individual rows', async () => {
      const user = userEvent.setup();
      render(<UserTable />);

      // Select John Doe
      const johnCheckbox = screen.getByLabelText(/select john doe/i);
      await user.click(johnCheckbox);

      expect(screen.getByText(/selected: 1 users/i)).toBeInTheDocument();
      expect(johnCheckbox).toBeChecked();
    });

    it('should select multiple rows', async () => {
      const user = userEvent.setup();
      render(<UserTable />);

      await user.click(screen.getByLabelText(/select john doe/i));
      await user.click(screen.getByLabelText(/select jane smith/i));

      expect(screen.getByText(/selected: 2 users/i)).toBeInTheDocument();
    });

    it('should deselect rows', async () => {
      const user = userEvent.setup();
      render(<UserTable />);

      const johnCheckbox = screen.getByLabelText(/select john doe/i);

      // Select
      await user.click(johnCheckbox);
      expect(screen.getByText(/selected: 1 users/i)).toBeInTheDocument();

      // Deselect
      await user.click(johnCheckbox);
      expect(screen.getByText(/selected: 0 users/i)).toBeInTheDocument();
    });

    it('should select all rows with select all checkbox', async () => {
      const user = userEvent.setup();
      render(<UserTable />);

      const selectAllCheckbox = screen.getByLabelText(/select all users/i);
      await user.click(selectAllCheckbox);

      expect(screen.getByText(/selected: 4 users/i)).toBeInTheDocument();
      expect(selectAllCheckbox).toBeChecked();
    });

    it('should clear selection', async () => {
      const user = userEvent.setup();
      render(<UserTable />);

      // Select all
      await user.click(screen.getByLabelText(/select all users/i));
      expect(screen.getByText(/selected: 4 users/i)).toBeInTheDocument();

      // Clear selection
      await user.click(screen.getByRole('button', { name: /clear selection/i }));
      expect(screen.getByText(/selected: 0 users/i)).toBeInTheDocument();
    });
  });

  describe('User Workflow: Table Sorting', () => {
    it('should sort by name', async () => {
      const user = userEvent.setup();
      render(<UserTable />);

      const rows = screen.getAllByRole('row');
      const firstDataRow = within(rows[1]).getAllByRole('cell');

      // Default sort is by name ascending, so first user should be Alice.
      expect(firstDataRow[1]).toHaveTextContent(/alice williams/i);
    });

    it('should toggle sort order', async () => {
      const user = userEvent.setup();
      render(<UserTable />);

      const nameButton = screen.getByRole('button', { name: /name/i });

      // Initial state is ascending
      expect(nameButton).toHaveTextContent(/↑/);

      // First click toggles to descending
      await user.click(nameButton);
      expect(nameButton).toHaveTextContent(/↓/);

      // Second click toggles back to ascending
      await user.click(nameButton);
      expect(nameButton).toHaveTextContent(/↑/);
    });

    it('should sort by different columns', async () => {
      const user = userEvent.setup();
      render(<UserTable />);

      // Sort by role
      await user.click(screen.getByRole('button', { name: /role/i }));

      const rows = screen.getAllByRole('row');
      const firstDataRow = within(rows[1]).getAllByRole('cell');

      // First role should be "Admin" (alphabetically first)
      expect(firstDataRow[3]).toHaveTextContent(/admin/i);
    });
  });

  describe('User Workflow: Row Click', () => {
    it('should handle row click events', async () => {
      const user = userEvent.setup();
      const handleRowClick = vi.fn();
      render(<UserTable onRowClick={handleRowClick} />);

      const rows = screen.getAllByRole('row');
      await user.click(rows[1]); // Click first data row

      // With default sorting (name asc), the first row is Alice.
      expect(handleRowClick).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alice Williams' })
      );
    });
  });

  describe('Accessibility: Table', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<UserTable />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible checkbox labels', () => {
      render(<UserTable />);

      expect(screen.getByLabelText(/select all users/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select john doe/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select jane smith/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Card + Avatar + Badge Composition
// ============================================================================

describe('Integration: Card + Avatar + Badge Composition', () => {
  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
  };

  describe('Component Integration', () => {
    it('should render card with all subcomponents', () => {
      render(<UserCard user={mockUser} />);

      expect(screen.getByRole('heading', { name: /john doe/i })).toBeInTheDocument();
      expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    it('should integrate Avatar component in card header', () => {
      render(<UserCard user={mockUser} />);

      const avatar = screen.getByText('JO'); // Avatar fallback
      expect(avatar).toBeInTheDocument();
    });

    it('should integrate Badge component for status', () => {
      render(<UserCard user={mockUser} />);

      const badge = screen.getByText(/active/i);
      expect(badge).toHaveClass('bg-primary');
    });

    it('should display user details in card content', () => {
      render(<UserCard user={mockUser} />);

      expect(screen.getByText(/role:/i)).toBeInTheDocument();
      expect(screen.getByText(/admin/i)).toBeInTheDocument();
      expect(screen.getByText(/id:/i)).toBeInTheDocument();
      expect(screen.getByText(/1/)).toBeInTheDocument();
    });
  });

  describe('Multiple Card Grid', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive' },
    ];

    it('should render multiple user cards in grid', () => {
      render(<UserGrid users={mockUsers} />);

      expect(screen.getByRole('heading', { name: /john doe/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /jane smith/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /bob johnson/i })).toBeInTheDocument();
    });

    it('should render correct number of cards', () => {
      render(<UserGrid users={mockUsers} />);

      const cards = screen.getAllByRole('listitem');
      expect(cards).toHaveLength(3);
    });

    it('should display different badge variants for status', () => {
      render(<UserGrid users={mockUsers} />);

      const activeBadges = screen.getAllByText(/^active$/i);
      const inactiveBadges = screen.getAllByText(/^inactive$/i);

      expect(activeBadges).toHaveLength(2);
      expect(inactiveBadges).toHaveLength(1);
    });
  });

  describe('Accessibility: Card Composition', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<UserCard user={mockUser} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with grid', async () => {
      const mockUsers: User[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
      ];
      const { container } = render(<UserGrid users={mockUsers} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Loading State: Skeleton + Progress
// ============================================================================

describe('Integration: Loading State with Skeleton + Progress', () => {
  describe('Component Integration', () => {
    it('should render skeleton components', () => {
      render(<LoadingState progress={50} />);

      // Check for skeleton elements (implementation may vary)
      expect(screen.getByText(/loading: 50%/i)).toBeInTheDocument();
    });

    it('should integrate Progress component', () => {
      render(<LoadingState progress={75} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('should display progress percentage', () => {
      render(<LoadingState progress={30} />);

      expect(screen.getByText(/loading: 30%/i)).toBeInTheDocument();
    });
  });

  describe('Loading Progress', () => {
    it('should render at 0% progress', () => {
      render(<LoadingState progress={0} />);

      expect(screen.getByText(/loading: 0%/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('should render at 100% progress', () => {
      render(<LoadingState progress={100} />);

      expect(screen.getByText(/loading: 100%/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Accessibility: Loading State', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<LoadingState progress={50} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper progressbar ARIA attributes', () => {
      render(<LoadingState progress={60} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Data Dashboard: Combined Components
// ============================================================================

describe('Integration: Data Dashboard Combined Workflow', () => {
  describe('Loading to Loaded Transition', () => {
    it('should show loading state initially', () => {
      render(<DataDashboard />);

      expect(screen.getByText(/loading:/i)).toBeInTheDocument();
    });

    it('should transition to loaded state', async () => {
      render(<DataDashboard />);

      // Wait for loading to complete (100ms * 10 iterations = 1000ms)
      await screen.findByRole('heading', { name: /dashboard overview/i }, { timeout: 2000 });

      expect(screen.queryByText(/loading:/i)).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /dashboard overview/i })).toBeInTheDocument();
    });

    it('should display user grid after loading', async () => {
      render(<DataDashboard />);

      await screen.findByRole('heading', { name: /dashboard overview/i }, { timeout: 2000 });

      expect(screen.getByRole('heading', { name: /john doe/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /jane smith/i })).toBeInTheDocument();
    });
  });

  describe('Dashboard Statistics', () => {
    it('should display correct user statistics', async () => {
      render(<DataDashboard />);

      await screen.findByRole('heading', { name: /dashboard overview/i }, { timeout: 2000 });

      const totalUsersBlock = screen.getByText(/total users/i, { selector: 'p' }).closest('div');
      expect(totalUsersBlock).not.toBeNull();
      expect(within(totalUsersBlock as HTMLElement).getByText('2')).toBeInTheDocument();

      const activeUsersBlock = screen.getByText(/^active$/i, { selector: 'p' }).closest('div');
      expect(activeUsersBlock).not.toBeNull();
      expect(within(activeUsersBlock as HTMLElement).getByText('2')).toBeInTheDocument();

      const inactiveUsersBlock = screen.getByText(/^inactive$/i, { selector: 'p' }).closest('div');
      expect(inactiveUsersBlock).not.toBeNull();
      expect(within(inactiveUsersBlock as HTMLElement).getByText('0')).toBeInTheDocument();
    });
  });

  describe('Accessibility: Dashboard', () => {
    it('should have no accessibility violations when loaded', async () => {
      const { container } = render(<DataDashboard />);

      await screen.findByRole('heading', { name: /dashboard overview/i }, { timeout: 2000 });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ============================================================================
// SUMMARY: Data Display Integration Tests
// ============================================================================
// Total Test Categories: 5 data display workflows
// Total Tests: 35+ integration tests
// Coverage:
// - Table + Sorting + Selection + Badge integration
// - Card + Avatar + Badge composition
// - User Grid with multiple cards
// - Loading State: Skeleton + Progress
// - Data Dashboard: Combined workflows with loading states
// - Row selection and bulk operations
// - Column sorting with visual indicators
// - Accessibility (jest-axe)
// - Real-world data presentation patterns
