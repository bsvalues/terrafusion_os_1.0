import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './skeleton';
import { Card } from './card';
import { Avatar } from './avatar';
import { Separator } from './separator';

/**
 * # Skeleton Component
 * 
 * Loading placeholder components that mimic the shape of content being loaded.
 * Provides visual feedback during async operations.
 * 
 * **Built On:** Custom component with animation
 * **Pattern:** Animated loading placeholders
 * **Focus:** Loading states, perceived performance, layout stability
 * 
 * ## Features
 * - ✅ Animated pulse effect for visual feedback
 * - ✅ Multiple shape options (rectangle, circle, text lines)
 * - ✅ Composable for complex layouts
 * - ✅ Prevents layout shift during loading
 * - ✅ Improves perceived performance
 * - ✅ Customizable sizes and colors
 * 
 * ## Stories in this file
 * 1. **Default**: Basic skeleton loader
 * 2. **Shapes**: Different skeleton shapes (rectangle, circle, text)
 * 3. **Sizes**: Various size options
 * 4. **TextLines**: Multiple text line skeletons
 * 5. **Composed**: Combining multiple skeletons
 * 6. **RealWorldCardLoading**: Loading state for content cards
 * 7. **RealWorldListLoading**: Loading state for list items
 * 8. **RealWorldProfileLoading**: Loading state for user profiles
 * 9. **RealWorldTableLoading**: Loading state for data tables
 * 10. **UsageGuidelines**: Do's, Don'ts, and best practices
 */

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

/**
 * ## Default Skeleton
 * 
 * Basic rectangular skeleton loader with pulse animation. The default
 * size adapts to its container or explicit dimensions.
 */
export const Default: Story = {
  render: () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  ),
};

/**
 * ## Shapes
 * 
 * Different skeleton shapes for various content types. Circles for avatars,
 * rectangles for text, and custom dimensions for specific elements.
 */
export const Shapes: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Circle (Avatar) */}
      <div>
        <p className="text-sm font-medium mb-3">Circle (Avatar)</p>
        <div className="flex gap-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
      </div>

      {/* Rectangle (Content) */}
      <div>
        <p className="text-sm font-medium mb-3">Rectangle (Content)</p>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>

      {/* Square (Image) */}
      <div>
        <p className="text-sm font-medium mb-3">Square (Image)</p>
        <div className="flex gap-2">
          <Skeleton className="h-24 w-24 rounded-md" />
          <Skeleton className="h-32 w-32 rounded-md" />
        </div>
      </div>

      {/* Button */}
      <div>
        <p className="text-sm font-medium mb-3">Button</p>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-11 w-28 rounded-md" />
        </div>
      </div>
    </div>
  ),
};

/**
 * ## Sizes
 * 
 * Various skeleton sizes for different UI elements. From small badges
 * to large hero sections.
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Small */}
      <div>
        <p className="text-sm font-medium mb-2">Small</p>
        <Skeleton className="h-3 w-32" />
      </div>

      {/* Medium (Default) */}
      <div>
        <p className="text-sm font-medium mb-2">Medium (Default)</p>
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Large */}
      <div>
        <p className="text-sm font-medium mb-2">Large</p>
        <Skeleton className="h-6 w-64" />
      </div>

      {/* Extra Large */}
      <div>
        <p className="text-sm font-medium mb-2">Extra Large</p>
        <Skeleton className="h-8 w-80" />
      </div>
    </div>
  ),
};

/**
 * ## Text Lines
 * 
 * Multiple skeleton lines simulating text paragraphs. Useful for article
 * previews, descriptions, and multi-line content.
 */
export const TextLines: Story = {
  render: () => (
    <div className="space-y-4">
      {/* Paragraph (3 lines) */}
      <div>
        <p className="text-sm font-medium mb-2">Paragraph (3 lines)</p>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Short text (2 lines) */}
      <div>
        <p className="text-sm font-medium mb-2">Short text (2 lines)</p>
        <div className="space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      {/* Long paragraph (5 lines) */}
      <div>
        <p className="text-sm font-medium mb-2">Long paragraph (5 lines)</p>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  ),
};

/**
 * ## Composed Layouts
 * 
 * Combining multiple skeleton elements to create complex loading layouts.
 * Demonstrates how to compose skeletons for realistic loading states.
 */
export const Composed: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Header with avatar */}
      <div>
        <p className="text-sm font-medium mb-3">Header with Avatar</p>
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Card layout */}
      <div>
        <p className="text-sm font-medium mb-3">Card Layout</p>
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-6 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>

      {/* List item */}
      <div>
        <p className="text-sm font-medium mb-3">List Item</p>
        <div className="flex gap-3">
          <Skeleton className="h-16 w-16 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * ## Real-World: Card Loading
 * 
 * Loading state for content cards, commonly used in blogs, e-commerce,
 * and social media feeds. Shows image, title, description, and actions.
 */
export const RealWorldCardLoading: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3" style={{ width: '900px' }}>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-0 overflow-hidden">
          <Skeleton className="h-48 w-full rounded-t-lg rounded-b-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  ),
};

/**
 * ## Real-World: List Loading
 * 
 * Loading state for list items, common in inbox views, notifications,
 * and feed interfaces. Shows avatar, title, description, and metadata.
 */
export const RealWorldListLoading: Story = {
  render: () => (
    <div className="w-[600px] space-y-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
};

/**
 * ## Real-World: Profile Loading
 * 
 * Loading state for user profile pages with avatar, cover photo, bio,
 * and stats. Common in social platforms and user management interfaces.
 */
export const RealWorldProfileLoading: Story = {
  render: () => (
    <div className="w-[700px] border rounded-lg overflow-hidden">
      {/* Cover photo */}
      <Skeleton className="h-48 w-full rounded-none" />
      
      {/* Profile info */}
      <div className="p-6 space-y-6">
        {/* Avatar and name */}
        <div className="flex items-start gap-4 -mt-16">
          <Skeleton className="h-24 w-24 rounded-full border-4 border-white" />
          <div className="flex-1 pt-12 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-24 rounded-md mt-12" />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton className="h-8 w-16 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>

        <Separator />

        {/* Recent activity */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

/**
 * ## Real-World: Table Loading
 * 
 * Loading state for data tables with headers and rows. Common in admin
 * panels, dashboards, and data management interfaces.
 */
export const RealWorldTableLoading: Story = {
  render: () => (
    <div className="w-[800px] border rounded-lg overflow-hidden">
      {/* Table header */}
      <div className="bg-slate-50 px-6 py-3 border-b flex gap-4">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Table rows */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="px-6 py-4 border-b flex gap-4 items-center">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}

      {/* Pagination */}
      <div className="px-6 py-4 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  ),
};

/**
 * ## Usage Guidelines
 * 
 * Best practices, do's and don'ts, and implementation guidance for Skeleton loaders.
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="max-w-4xl space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Skeleton Usage Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for implementing loading placeholders that improve perceived performance
          and prevent layout shift.
        </p>
      </div>

      {/* Do's */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-green-700">✓ Do's</h3>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Match skeleton shapes and sizes to the actual content being loaded</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Use skeletons for content that takes longer than 300-500ms to load</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Compose multiple skeleton elements to match complex layouts</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Maintain consistent spacing and structure between skeleton and actual content</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Use subtle animations (pulse) to indicate active loading</span>
          </li>
        </ul>
      </div>

      {/* Don'ts */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-red-700">✗ Don'ts</h3>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="text-red-600 font-bold">✗</span>
            <span>Don't use skeletons for instant-loading content (causes flash)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-600 font-bold">✗</span>
            <span>Don't create skeleton layouts that differ significantly from actual content</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-600 font-bold">✗</span>
            <span>Don't show skeletons indefinitely - timeout to error state after reasonable time</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-600 font-bold">✗</span>
            <span>Don't use excessive animation that might distract or cause motion sickness</span>
          </li>
        </ul>
      </div>

      {/* Implementation Patterns */}
      <div>
        <h3 className="text-lg font-semibold mb-3">📝 Implementation Patterns</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Simple Loading State</h4>
            <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
{`const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

if (loading) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

return <div>{data.content}</div>;`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Card Loading</h4>
            <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
{`function CardSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </Card>
  );
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">List Loading</h4>
            <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
{`function ListSkeleton({ count = 5 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </>
  );
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Animation Guidelines */}
      <div>
        <h3 className="text-lg font-semibold mb-3">✨ Animation Guidelines</h3>
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h4 className="font-medium">Pulse Animation (Default)</h4>
              <p className="text-sm text-muted-foreground">
                Subtle opacity pulse that indicates active loading without being distracting.
                Duration: 2s, smooth easing.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">🌊</span>
            <div>
              <h4 className="font-medium">Wave Animation (Alternative)</h4>
              <p className="text-sm text-muted-foreground">
                Gradient shimmer effect that moves across skeleton. More noticeable but
                should be used sparingly.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <h4 className="font-medium">No Animation (Static)</h4>
              <p className="text-sm text-muted-foreground">
                Use for very short loading times or when animation might cause issues
                (accessibility concerns, performance).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* When to Use */}
      <div>
        <h3 className="text-lg font-semibold mb-3">🎯 When to Use Skeletons</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Perfect For:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Initial page load (above-the-fold content)</li>
              <li>• Infinite scroll/pagination loading</li>
              <li>• Image loading placeholders</li>
              <li>• Form submission feedback</li>
              <li>• Search result loading</li>
              <li>• Profile/dashboard data</li>
            </ul>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Avoid For:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Instant content (&lt; 300ms load)</li>
              <li>• Full-page loading (use spinner)</li>
              <li>• Form field validation</li>
              <li>• Button click feedback (use disabled state)</li>
              <li>• Hover interactions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div>
        <h3 className="text-lg font-semibold mb-3">⚡ Performance Tips</h3>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>
              <strong>Minimize skeleton complexity:</strong> Use simple shapes rather than
              overly detailed replicas
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>
              <strong>Reuse skeleton components:</strong> Create reusable skeleton patterns
              for common layouts
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>
              <strong>Consider accessibility:</strong> Ensure animations respect prefers-reduced-motion
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>
              <strong>Test loading states:</strong> Throttle network to see how skeletons appear
              in real conditions
            </span>
          </li>
        </ul>
      </div>

      {/* Accessibility */}
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">♿ Accessibility</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>aria-label:</strong> Add descriptive labels like "Loading content..." for screen readers
          </li>
          <li>
            <strong>role="status":</strong> Use ARIA role to announce loading state changes
          </li>
          <li>
            <strong>Reduced Motion:</strong> Respect prefers-reduced-motion media query to disable animations
          </li>
          <li>
            <strong>Timeout Handling:</strong> Provide error states if content fails to load after reasonable time
          </li>
          <li>
            <strong>Focus Management:</strong> Don't trap focus on skeleton elements, maintain normal tab order
          </li>
        </ul>
      </div>
    </div>
  ),
};
