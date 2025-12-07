import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

expect.extend(toHaveNoViolations);

describe('Card', () => {
  describe('Card Root', () => {
    it('renders card container', () => {
      const { container } = render(<Card>Card content</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies default styling', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'bg-card',
        'text-card-foreground',
        'shadow-sm'
      );
    });

    it('renders with custom className', () => {
      const { container } = render(<Card className='custom-card'>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('custom-card');
    });

    it('renders children content', () => {
      render(<Card>Test content here</Card>);
      expect(screen.getByText('Test content here')).toBeInTheDocument();
    });

    it('applies id attribute', () => {
      const { container } = render(<Card id='my-card'>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveAttribute('id', 'my-card');
    });

    it('applies data attributes', () => {
      const { container } = render(<Card data-testid='test-card'>Content</Card>);
      const card = screen.getByTestId('test-card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('CardHeader', () => {
    it('renders card header', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('applies default styling', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      const header = container.firstChild;
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('renders with custom className', () => {
      const { container } = render(<CardHeader className='custom-header'>Header</CardHeader>);
      const header = container.firstChild;
      expect(header).toHaveClass('custom-header');
    });

    it('renders children elements', () => {
      render(
        <CardHeader>
          <span>Title</span>
          <span>Subtitle</span>
        </CardHeader>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Subtitle')).toBeInTheDocument();
    });
  });

  describe('CardTitle', () => {
    it('renders card title', () => {
      render(<CardTitle>My Card Title</CardTitle>);
      expect(screen.getByText('My Card Title')).toBeInTheDocument();
    });

    it('renders as h3 element', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title.tagName).toBe('H3');
    });

    it('applies default styling', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
    });

    it('renders with custom className', () => {
      render(<CardTitle className='custom-title'>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });

    it('applies id attribute', () => {
      render(<CardTitle id='card-title'>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveAttribute('id', 'card-title');
    });
  });

  describe('CardDescription', () => {
    it('renders card description', () => {
      render(<CardDescription>This is a description</CardDescription>);
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('renders as p element', () => {
      render(<CardDescription>Description</CardDescription>);
      const description = screen.getByText('Description');
      expect(description.tagName).toBe('P');
    });

    it('applies default styling', () => {
      render(<CardDescription>Description</CardDescription>);
      const description = screen.getByText('Description');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('renders with custom className', () => {
      render(<CardDescription className='custom-description'>Description</CardDescription>);
      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-description');
    });
  });

  describe('CardContent', () => {
    it('renders card content', () => {
      render(<CardContent>Main content area</CardContent>);
      expect(screen.getByText('Main content area')).toBeInTheDocument();
    });

    it('applies default styling', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      const content = container.firstChild;
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('renders with custom className', () => {
      const { container } = render(<CardContent className='custom-content'>Content</CardContent>);
      const content = container.firstChild;
      expect(content).toHaveClass('custom-content');
    });

    it('renders multiple children', () => {
      render(
        <CardContent>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </CardContent>
      );
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });
  });

  describe('CardFooter', () => {
    it('renders card footer', () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('applies default styling', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.firstChild;
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('renders with custom className', () => {
      const { container } = render(<CardFooter className='custom-footer'>Footer</CardFooter>);
      const footer = container.firstChild;
      expect(footer).toHaveClass('custom-footer');
    });

    it('renders button elements', () => {
      render(
        <CardFooter>
          <button>Cancel</button>
          <button>Save</button>
        </CardFooter>
      );
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  describe('Complete Card Structure', () => {
    it('renders full card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card description text')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });

    it('renders card without header', () => {
      render(
        <Card>
          <CardContent>Content only</CardContent>
        </Card>
      );
      expect(screen.getByText('Content only')).toBeInTheDocument();
    });

    it('renders card without footer', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders card with only title and content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>Simple content</CardContent>
        </Card>
      );
      expect(screen.getByText('Simple Card')).toBeInTheDocument();
      expect(screen.getByText('Simple content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with basic card', async () => {
      const { container } = render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with full card structure', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with interactive elements', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
          </CardHeader>
          <CardContent>
            <button>Click me</button>
            <a href='#test'>Link</a>
          </CardContent>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports aria-labelledby with title', () => {
      const { container } = render(
        <Card aria-labelledby='card-title'>
          <CardHeader>
            <CardTitle id='card-title'>Accessible Card</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
    });

    it('supports aria-describedby with description', () => {
      const { container } = render(
        <Card aria-describedby='card-description'>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription id='card-description'>Description text</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('aria-describedby', 'card-description');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom card styling', () => {
      const { container } = render(<Card className='max-w-md bg-slate-100 p-8'>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('max-w-md', 'bg-slate-100', 'p-8');
    });

    it('applies custom header styling', () => {
      const { container } = render(
        <CardHeader className='bg-blue-50 rounded-t-lg'>Header</CardHeader>
      );
      const header = container.firstChild;
      expect(header).toHaveClass('bg-blue-50', 'rounded-t-lg');
    });

    it('applies custom title styling', () => {
      render(<CardTitle className='text-4xl text-blue-600'>Custom Title</CardTitle>);
      const title = screen.getByText('Custom Title');
      expect(title).toHaveClass('text-4xl', 'text-blue-600');
    });

    it('applies custom footer styling', () => {
      const { container } = render(<CardFooter className='justify-end gap-4'>Footer</CardFooter>);
      const footer = container.firstChild;
      expect(footer).toHaveClass('justify-end', 'gap-4');
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders product card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Product Name</CardTitle>
            <CardDescription>$99.99</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Product description and details</p>
          </CardContent>
          <CardFooter>
            <button>Add to Cart</button>
          </CardFooter>
        </Card>
      );
      expect(screen.getByText('Product Name')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    });

    it('renders user profile card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>John Doe</CardTitle>
            <CardDescription>Software Engineer</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Email: john@example.com</p>
            <p>Location: San Francisco, CA</p>
          </CardContent>
          <CardFooter>
            <button>View Profile</button>
            <button>Message</button>
          </CardFooter>
        </Card>
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('renders notification card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>New Message</CardTitle>
            <CardDescription>2 minutes ago</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You have a new message from Alice</p>
          </CardContent>
        </Card>
      );
      expect(screen.getByText('New Message')).toBeInTheDocument();
      expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
    });

    it('renders form card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <input type='email' placeholder='Email' />
              <input type='password' placeholder='Password' />
            </form>
          </CardContent>
          <CardFooter>
            <button type='submit'>Sign In</button>
          </CardFooter>
        </Card>
      );
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('renders empty card', () => {
      const { container } = render(<Card />);
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    it('renders card with only content', () => {
      render(
        <Card>
          <CardContent>Standalone content</CardContent>
        </Card>
      );
      expect(screen.getByText('Standalone content')).toBeInTheDocument();
    });

    it('handles long title text', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines in the card';
      render(<CardTitle>{longTitle}</CardTitle>);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles long description text', () => {
      const longDescription =
        'This is a very long description that contains multiple sentences and might span several lines depending on the card width and layout.';
      render(<CardDescription>{longDescription}</CardDescription>);
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles nested cards', () => {
      render(
        <Card>
          <CardContent>
            <Card>
              <CardContent>Nested card</CardContent>
            </Card>
          </CardContent>
        </Card>
      );
      expect(screen.getByText('Nested card')).toBeInTheDocument();
    });

    it('handles complex content', () => {
      render(
        <Card>
          <CardContent>
            <div>
              <h4>Section Title</h4>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
              <p>Additional text</p>
            </div>
          </CardContent>
        </Card>
      );
      expect(screen.getByText('Section Title')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });
});
