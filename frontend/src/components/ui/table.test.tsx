import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

expect.extend(toHaveNoViolations);

describe('Table', () => {
  describe('Table Root', () => {
    it('renders table element', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('applies default styles', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('w-full');
      expect(table).toHaveClass('caption-bottom');
      expect(table).toHaveClass('text-sm');
    });

    it('accepts custom className', () => {
      render(
        <Table className="custom-table">
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('custom-table');
    });

    it('renders children correctly', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Test content</td>
            </tr>
          </tbody>
        </Table>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('has overflow-auto wrapper', () => {
      const { container } = render(
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const wrapper = container.querySelector('.overflow-auto');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('TableHeader', () => {
    it('renders thead element', () => {
      render(
        <Table>
          <TableHeader>
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </Table>
      );

      const thead = screen.getByRole('rowgroup');
      expect(thead.tagName).toBe('THEAD');
    });

    it('applies default border styles', () => {
      render(
        <Table>
          <TableHeader>
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </Table>
      );

      const thead = screen.getByRole('rowgroup');
      expect(thead).toHaveClass('[&_tr]:border-b');
    });

    it('accepts custom className', () => {
      render(
        <Table>
          <TableHeader className="custom-header">
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </Table>
      );

      const thead = screen.getByRole('rowgroup');
      expect(thead).toHaveClass('custom-header');
    });

    it('renders multiple header rows', () => {
      render(
        <Table>
          <TableHeader>
            <tr>
              <th>First Row</th>
            </tr>
            <tr>
              <th>Second Row</th>
            </tr>
          </TableHeader>
        </Table>
      );

      expect(screen.getByText('First Row')).toBeInTheDocument();
      expect(screen.getByText('Second Row')).toBeInTheDocument();
    });
  });

  describe('TableBody', () => {
    it('renders tbody element', () => {
      render(
        <Table>
          <thead>
            <tr>
              <th>Header</th>
            </tr>
          </thead>
          <TableBody>
            <tr>
              <td>Body cell</td>
            </tr>
          </TableBody>
        </Table>
      );

      const tbody = screen.getAllByRole('rowgroup')[1]; // Second rowgroup is tbody
      expect(tbody.tagName).toBe('TBODY');
    });

    it('applies default border styles', () => {
      render(
        <Table>
          <TableBody>
            <tr>
              <td>Cell</td>
            </tr>
          </TableBody>
        </Table>
      );

      const tbody = screen.getByRole('rowgroup');
      expect(tbody).toHaveClass('[&_tr:last-child]:border-0');
    });

    it('accepts custom className', () => {
      render(
        <Table>
          <TableBody className="custom-body">
            <tr>
              <td>Cell</td>
            </tr>
          </TableBody>
        </Table>
      );

      const tbody = screen.getByRole('rowgroup');
      expect(tbody).toHaveClass('custom-body');
    });

    it('renders multiple rows', () => {
      render(
        <Table>
          <TableBody>
            <tr>
              <td>Row 1</td>
            </tr>
            <tr>
              <td>Row 2</td>
            </tr>
            <tr>
              <td>Row 3</td>
            </tr>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Row 1')).toBeInTheDocument();
      expect(screen.getByText('Row 2')).toBeInTheDocument();
      expect(screen.getByText('Row 3')).toBeInTheDocument();
    });
  });

  describe('TableFooter', () => {
    it('renders tfoot element', () => {
      render(
        <Table>
          <TableBody>
            <tr>
              <td>Body</td>
            </tr>
          </TableBody>
          <TableFooter>
            <tr>
              <td>Footer</td>
            </tr>
          </TableFooter>
        </Table>
      );

      const tfoot = screen.getAllByRole('rowgroup')[1]; // Second rowgroup is tfoot
      expect(tfoot.tagName).toBe('TFOOT');
    });

    it('applies default footer styles', () => {
      render(
        <Table>
          <TableFooter>
            <tr>
              <td>Footer</td>
            </tr>
          </TableFooter>
        </Table>
      );

      const tfoot = screen.getByRole('rowgroup');
      expect(tfoot).toHaveClass('border-t');
      expect(tfoot).toHaveClass('bg-muted/50');
      expect(tfoot).toHaveClass('font-medium');
    });

    it('accepts custom className', () => {
      render(
        <Table>
          <TableFooter className="custom-footer">
            <tr>
              <td>Footer</td>
            </tr>
          </TableFooter>
        </Table>
      );

      const tfoot = screen.getByRole('rowgroup');
      expect(tfoot).toHaveClass('custom-footer');
    });

    it('renders footer content', () => {
      render(
        <Table>
          <TableFooter>
            <tr>
              <td>Total: 100</td>
            </tr>
          </TableFooter>
        </Table>
      );

      expect(screen.getByText('Total: 100')).toBeInTheDocument();
    });
  });

  describe('TableRow', () => {
    it('renders tr element', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <td>Cell</td>
            </TableRow>
          </TableBody>
        </Table>
      );

      const row = screen.getByRole('row');
      expect(row).toBeInTheDocument();
      expect(row.tagName).toBe('TR');
    });

    it('applies default row styles', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <td>Cell</td>
            </TableRow>
          </TableBody>
        </Table>
      );

      const row = screen.getByRole('row');
      expect(row).toHaveClass('border-b');
      expect(row).toHaveClass('transition-colors');
      expect(row).toHaveClass('hover:bg-muted/50');
    });

    it('accepts custom className', () => {
      render(
        <Table>
          <TableBody>
            <TableRow className="custom-row">
              <td>Cell</td>
            </TableRow>
          </TableBody>
        </Table>
      );

      const row = screen.getByRole('row');
      expect(row).toHaveClass('custom-row');
    });

    it('renders with data-state attribute', () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-state="selected">
              <td>Selected row</td>
            </TableRow>
          </TableBody>
        </Table>
      );

      const row = screen.getByRole('row');
      expect(row).toHaveAttribute('data-state', 'selected');
    });

    it('applies selected styling', () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-state="selected">
              <td>Cell</td>
            </TableRow>
          </TableBody>
        </Table>
      );

      const row = screen.getByRole('row');
      expect(row).toHaveClass('data-[state=selected]:bg-muted');
    });
  });

  describe('TableHead', () => {
    it('renders th element', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      const th = screen.getByRole('columnheader');
      expect(th).toBeInTheDocument();
      expect(th.tagName).toBe('TH');
    });

    it('applies default head styles', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      const th = screen.getByRole('columnheader');
      expect(th).toHaveClass('h-10');
      expect(th).toHaveClass('px-2');
      expect(th).toHaveClass('text-left');
      expect(th).toHaveClass('align-middle');
      expect(th).toHaveClass('font-medium');
      expect(th).toHaveClass('text-muted-foreground');
    });

    it('accepts custom className', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="custom-head">Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      const th = screen.getByRole('columnheader');
      expect(th).toHaveClass('custom-head');
    });

    it('renders head content', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('supports checkbox styling', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type="checkbox" role="checkbox" />
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      const th = screen.getByRole('columnheader');
      expect(th).toHaveClass('[&:has([role=checkbox])]:pr-0');
    });
  });

  describe('TableCell', () => {
    it('renders td element', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const td = screen.getByRole('cell');
      expect(td).toBeInTheDocument();
      expect(td.tagName).toBe('TD');
    });

    it('applies default cell styles', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const td = screen.getByRole('cell');
      expect(td).toHaveClass('p-2');
      expect(td).toHaveClass('align-middle');
    });

    it('accepts custom className', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="custom-cell">Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const td = screen.getByRole('cell');
      expect(td).toHaveClass('custom-cell');
    });

    it('renders cell content', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Test data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Test data')).toBeInTheDocument();
    });

    it('supports checkbox styling', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <input type="checkbox" role="checkbox" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const td = screen.getByRole('cell');
      expect(td).toHaveClass('[&:has([role=checkbox])]:pr-0');
    });

    it('renders multiple cells in a row', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell 1</TableCell>
              <TableCell>Cell 2</TableCell>
              <TableCell>Cell 3</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Cell 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 2')).toBeInTheDocument();
      expect(screen.getByText('Cell 3')).toBeInTheDocument();
    });
  });

  describe('TableCaption', () => {
    it('renders caption element', () => {
      render(
        <Table>
          <TableCaption>Table caption</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const caption = screen.getByText('Table caption');
      expect(caption.tagName).toBe('CAPTION');
    });

    it('applies default caption styles', () => {
      render(
        <Table>
          <TableCaption>Caption</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const caption = screen.getByText('Caption');
      expect(caption).toHaveClass('mt-4');
      expect(caption).toHaveClass('text-sm');
      expect(caption).toHaveClass('text-muted-foreground');
    });

    it('accepts custom className', () => {
      render(
        <Table>
          <TableCaption className="custom-caption">Caption</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const caption = screen.getByText('Caption');
      expect(caption).toHaveClass('custom-caption');
    });

    it('renders caption content', () => {
      render(
        <Table>
          <TableCaption>A list of your recent invoices</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('A list of your recent invoices')).toBeInTheDocument();
    });
  });

  describe('Complete Table Structure', () => {
    it('renders full table with all components', () => {
      render(
        <Table>
          <TableCaption>User data table</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell>2 users</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      // Verify caption
      expect(screen.getByText('User data table')).toBeInTheDocument();

      // Verify headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();

      // Verify body content
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();

      // Verify footer
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('2 users')).toBeInTheDocument();
    });

    it('renders table without caption', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
    });

    it('renders table without footer', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(screen.queryByText('Total')).not.toBeInTheDocument();
    });

    it('renders simple table with just body', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Simple data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Simple data')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations - basic table', async () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John</TableCell>
              <TableCell>30</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations - with caption', async () => {
      const { container } = render(
        <Table>
          <TableCaption>List of users</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations - complete table', async () => {
      const { container } = render(
        <Table>
          <TableCaption>Employee data</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Salary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Alice</TableCell>
              <TableCell>Engineering</TableCell>
              <TableCell>$100,000</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Bob</TableCell>
              <TableCell>Marketing</TableCell>
              <TableCell>$80,000</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell>2 employees</TableCell>
              <TableCell>$180,000</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('table has proper semantic structure', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const columnheader = screen.getByRole('columnheader');
      expect(columnheader).toBeInTheDocument();
      
      const cell = screen.getByRole('cell');
      expect(cell).toBeInTheDocument();
    });

    it('caption provides table description', () => {
      render(
        <Table>
          <TableCaption>Monthly sales report for Q1 2024</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const caption = screen.getByText('Monthly sales report for Q1 2024');
      expect(caption).toBeInTheDocument();
      expect(caption.tagName).toBe('CAPTION');
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders user list table', () => {
      const users = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
      ];

      render(
        <Table>
          <TableCaption>List of registered users</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );

      users.forEach((user) => {
        expect(screen.getByText(user.name)).toBeInTheDocument();
        expect(screen.getByText(user.email)).toBeInTheDocument();
      });
    });

    it('renders invoice table with footer totals', () => {
      render(
        <Table>
          <TableCaption>Recent invoices</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>INV-001</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>$250.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>INV-002</TableCell>
              <TableCell>Pending</TableCell>
              <TableCell>$150.00</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total</TableCell>
              <TableCell>$400.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      expect(screen.getByText('INV-001')).toBeInTheDocument();
      expect(screen.getByText('INV-002')).toBeInTheDocument();
      expect(screen.getByText('$400.00')).toBeInTheDocument();
    });

    it('renders data table with selectable rows', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type="checkbox" role="checkbox" aria-label="Select all" />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <input type="checkbox" role="checkbox" aria-label="Select row" />
              </TableCell>
              <TableCell>Item 1</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow data-state="selected">
              <TableCell>
                <input type="checkbox" role="checkbox" checked aria-label="Select row" />
              </TableCell>
              <TableCell>Item 2</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3); // 1 header + 2 rows
      expect(checkboxes[2]).toBeChecked();
    });

    it('renders product catalog table', () => {
      render(
        <Table>
          <TableCaption>Product catalog - Winter 2024</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Winter Jacket</TableCell>
              <TableCell>WJ-001</TableCell>
              <TableCell>$89.99</TableCell>
              <TableCell>45</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Snow Boots</TableCell>
              <TableCell>SB-001</TableCell>
              <TableCell>$129.99</TableCell>
              <TableCell>23</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Winter Jacket')).toBeInTheDocument();
      expect(screen.getByText('Snow Boots')).toBeInTheDocument();
      expect(screen.getByText('WJ-001')).toBeInTheDocument();
      expect(screen.getByText('$129.99')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty table body', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody></TableBody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('handles table with no header', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data 1</TableCell>
              <TableCell>Data 2</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Data 1')).toBeInTheDocument();
      expect(screen.getByText('Data 2')).toBeInTheDocument();
    });

    it('handles very long cell content', () => {
      const longText =
        'This is a very long text that might overflow the table cell and needs to be handled properly with appropriate styling and overflow behavior to ensure the table remains usable and readable.';
      
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>{longText}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles many columns', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Col 1</TableHead>
              <TableHead>Col 2</TableHead>
              <TableHead>Col 3</TableHead>
              <TableHead>Col 4</TableHead>
              <TableHead>Col 5</TableHead>
              <TableHead>Col 6</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Data 1</TableCell>
              <TableCell>Data 2</TableCell>
              <TableCell>Data 3</TableCell>
              <TableCell>Data 4</TableCell>
              <TableCell>Data 5</TableCell>
              <TableCell>Data 6</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      for (let i = 1; i <= 6; i++) {
        expect(screen.getByText(`Col ${i}`)).toBeInTheDocument();
        expect(screen.getByText(`Data ${i}`)).toBeInTheDocument();
      }
    });

    it('handles many rows', () => {
      const rows = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
      }));

      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 50')).toBeInTheDocument();
    });

    it('handles colspan in cells', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={3}>Spanning 3 columns</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Col 1</TableCell>
              <TableCell>Col 2</TableCell>
              <TableCell>Col 3</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const spanningCell = screen.getByText('Spanning 3 columns');
      expect(spanningCell).toBeInTheDocument();
      expect(spanningCell).toHaveAttribute('colSpan', '3');
    });

    it('handles rowspan in cells', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell rowSpan={2}>Spanning 2 rows</TableCell>
              <TableCell>Row 1, Col 2</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Row 2, Col 2</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const spanningCell = screen.getByText('Spanning 2 rows');
      expect(spanningCell).toBeInTheDocument();
      expect(spanningCell).toHaveAttribute('rowSpan', '2');
    });

    it('handles empty cells', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Data</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(3);
      expect(screen.getByText('Data')).toBeInTheDocument();
    });

    it('handles complex nested content in cells', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <div>
                  <strong>Bold text</strong>
                  <p>Paragraph text</p>
                  <button>Action</button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Bold text')).toBeInTheDocument();
      expect(screen.getByText('Paragraph text')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });
  });
});
