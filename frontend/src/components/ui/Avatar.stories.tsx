/**
 * Avatar Component Documentation
 * 
 * Avatar displays user profile pictures with graceful fallbacks.
 * Built on @radix-ui/react-avatar with automatic loading states.
 * 
 * Features:
 * - Automatic fallback to initials
 * - Custom fallback content
 * - Multiple sizes
 * - Avatar groups
 * - Status indicators
 * - Loading states
 * 
 * @component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { PersonIcon, CheckIcon } from '@radix-ui/react-icons';

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'An image element with a fallback for representing the user. Built with Radix UI Avatar primitive.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Basic Avatar
 * Simple avatars with images and fallbacks
 */
export const BasicAvatar: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="space-y-2 text-center">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground">With Image</p>
      </div>
      
      <div className="space-y-2 text-center">
        <Avatar>
          <AvatarImage src="/broken-image.jpg" alt="@johndoe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground">Fallback (initials)</p>
      </div>

      <div className="space-y-2 text-center">
        <Avatar>
          <AvatarFallback>
            <PersonIcon className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground">Fallback (icon)</p>
      </div>

      <div className="space-y-2 text-center">
        <Avatar>
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            AB
          </AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground">Custom gradient</p>
      </div>
    </div>
  ),
};

/**
 * Story 2: Avatar Sizes
 * Different avatar sizes for various contexts
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="space-y-2 text-center">
        <Avatar className="h-6 w-6">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback className="text-xs">CN</AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground">xs (24px)</p>
      </div>

      <div className="space-y-2 text-center">
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback className="text-xs">CN</AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground">sm (32px)</p>
      </div>

      <div className="space-y-2 text-center">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground">md (40px - default)</p>
      </div>

      <div className="space-y-2 text-center">
        <Avatar className="h-12 w-12">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground">lg (48px)</p>
      </div>

      <div className="space-y-2 text-center">
        <Avatar className="h-16 w-16">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback className="text-lg">CN</AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground">xl (64px)</p>
      </div>

      <div className="space-y-2 text-center">
        <Avatar className="h-24 w-24">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback className="text-2xl">CN</AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground">2xl (96px)</p>
      </div>
    </div>
  ),
};

/**
 * Story 3: Avatar Groups
 * Multiple avatars arranged in groups (team members, collaborators)
 */
export const AvatarGroups: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium mb-3">Stacked (overlapping)</p>
        <div className="flex -space-x-4">
          <Avatar className="border-2 border-background">
            <AvatarImage src="https://github.com/shadcn.png" alt="User 1" />
            <AvatarFallback>U1</AvatarFallback>
          </Avatar>
          <Avatar className="border-2 border-background">
            <AvatarFallback className="bg-blue-500 text-white">U2</AvatarFallback>
          </Avatar>
          <Avatar className="border-2 border-background">
            <AvatarFallback className="bg-green-500 text-white">U3</AvatarFallback>
          </Avatar>
          <Avatar className="border-2 border-background">
            <AvatarFallback className="bg-purple-500 text-white">U4</AvatarFallback>
          </Avatar>
          <Avatar className="border-2 border-background">
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              +5
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3">Spaced Group</p>
        <div className="flex gap-2">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="User 1" />
            <AvatarFallback>U1</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback className="bg-orange-500 text-white">U2</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback className="bg-cyan-500 text-white">U3</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback className="bg-pink-500 text-white">U4</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3">With Tooltips (hover me)</p>
        <div className="flex -space-x-3">
          {[
            { name: 'John Doe', initials: 'JD', color: 'bg-blue-500' },
            { name: 'Jane Smith', initials: 'JS', color: 'bg-green-500' },
            { name: 'Bob Johnson', initials: 'BJ', color: 'bg-purple-500' },
            { name: 'Alice Brown', initials: 'AB', color: 'bg-pink-500' },
          ].map((user, i) => (
            <Avatar 
              key={i} 
              className="border-2 border-background cursor-pointer hover:z-10 hover:scale-110 transition-transform"
              title={user.name}
            >
              <AvatarFallback className={`${user.color} text-white`}>
                {user.initials}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3">Grid Layout</p>
        <div className="grid grid-cols-4 gap-3 max-w-xs">
          {Array.from({ length: 8 }).map((_, i) => (
            <Avatar key={i}>
              <AvatarFallback>U{i + 1}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    </div>
  ),
};

/**
 * Story 4: With Status Indicators
 * Avatars with online/offline/busy status badges
 */
export const WithStatusIndicators: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="space-y-2 text-center">
        <div className="relative inline-block">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
        </div>
        <p className="text-xs text-muted-foreground">Online</p>
      </div>

      <div className="space-y-2 text-center">
        <div className="relative inline-block">
          <Avatar>
            <AvatarFallback className="bg-blue-500 text-white">JD</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-gray-400 ring-2 ring-background" />
        </div>
        <p className="text-xs text-muted-foreground">Offline</p>
      </div>

      <div className="space-y-2 text-center">
        <div className="relative inline-block">
          <Avatar>
            <AvatarFallback className="bg-purple-500 text-white">AB</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-yellow-500 ring-2 ring-background" />
        </div>
        <p className="text-xs text-muted-foreground">Away</p>
      </div>

      <div className="space-y-2 text-center">
        <div className="relative inline-block">
          <Avatar>
            <AvatarFallback className="bg-pink-500 text-white">SM</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-background" />
        </div>
        <p className="text-xs text-muted-foreground">Busy</p>
      </div>

      <div className="space-y-2 text-center">
        <div className="relative inline-block">
          <Avatar className="h-12 w-12">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-background">
            <CheckIcon className="h-3 w-3 text-white" />
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Verified (larger)</p>
      </div>
    </div>
  ),
};

/**
 * Story 5: In Context (Real-world Usage)
 * Avatars used in common UI patterns
 */
export const InContext: Story = {
  render: () => (
    <div className="space-y-6 w-[600px]">
      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle>John Doe</CardTitle>
              <CardDescription>@johndoe · Product Designer</CardDescription>
            </div>
            <Button>Follow</Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Passionate about creating beautiful and functional user interfaces.
            10+ years of experience in design.
          </p>
        </CardContent>
      </Card>

      {/* Comment Thread */}
      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Avatar>
              <AvatarFallback className="bg-blue-500 text-white">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">John Doe</span>
                <span className="text-xs text-muted-foreground">2h ago</span>
              </div>
              <p className="text-sm text-muted-foreground">
                This looks great! Love the new design direction.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Avatar>
              <AvatarFallback className="bg-green-500 text-white">JS</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">Jane Smith</span>
                <span className="text-xs text-muted-foreground">1h ago</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Thanks! The team worked really hard on this.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">shadcn</span>
                <Badge variant="secondary" className="text-xs">Pro</Badge>
                <span className="text-xs text-muted-foreground">30m ago</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Can't wait to see this in production!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>8 members in this project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: 'John Doe', role: 'Product Manager', status: 'online' },
            { name: 'Jane Smith', role: 'Lead Designer', status: 'online' },
            { name: 'Bob Johnson', role: 'Developer', status: 'away' },
            { name: 'Alice Brown', role: 'Developer', status: 'offline' },
          ].map((member, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span 
                    className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background ${
                      member.status === 'online' ? 'bg-green-500' :
                      member.status === 'away' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  ),
};

/**
 * Story 6: Usage Guidelines
 * Best practices for using Avatar component
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="w-[800px] space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Avatar Usage Guidelines</h2>
        <p className="text-muted-foreground mb-6">
          Best practices for implementing avatars in your application.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-green-600 dark:text-green-400">✓ Do's</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="text-green-600 dark:text-green-400 font-bold">1.</div>
            <div>
              <p className="font-medium">Always provide a fallback</p>
              <p className="text-sm text-muted-foreground">
                Use initials or an icon as fallback for when images fail to load
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-600 dark:text-green-400 font-bold">2.</div>
            <div>
              <p className="font-medium">Use consistent sizes within context</p>
              <p className="text-sm text-muted-foreground">
                Maintain the same avatar size in lists and groups for visual harmony
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-600 dark:text-green-400 font-bold">3.</div>
            <div>
              <p className="font-medium">Add alt text for accessibility</p>
              <p className="text-sm text-muted-foreground">
                Include descriptive alt text for AvatarImage to help screen readers
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-600 dark:text-green-400 font-bold">4.</div>
            <div>
              <p className="font-medium">Use status indicators for presence</p>
              <p className="text-sm text-muted-foreground">
                Show online/offline status for messaging and collaboration apps
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-600 dark:text-green-400 font-bold">5.</div>
            <div>
              <p className="font-medium">Keep fallback text short (2-3 chars)</p>
              <p className="text-sm text-muted-foreground">
                Use initials or abbreviations to maintain readability at small sizes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">✗ Don'ts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="text-red-600 dark:text-red-400 font-bold">1.</div>
            <div>
              <p className="font-medium">Don't use avatars without fallbacks</p>
              <p className="text-sm text-muted-foreground">
                Always provide a fallback to prevent broken image icons
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-red-600 dark:text-red-400 font-bold">2.</div>
            <div>
              <p className="font-medium">Don't use very small sizes (&lt;24px)</p>
              <p className="text-sm text-muted-foreground">
                Avatars smaller than 24px become hard to recognize and click
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-red-600 dark:text-red-400 font-bold">3.</div>
            <div>
              <p className="font-medium">Don't stack more than 5-6 avatars</p>
              <p className="text-sm text-muted-foreground">
                Use "+N" counter avatar for large groups to avoid cluttering
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-red-600 dark:text-red-400 font-bold">4.</div>
            <div>
              <p className="font-medium">Don't use low-resolution images</p>
              <p className="text-sm text-muted-foreground">
                Pixelated avatars look unprofessional; use at least 100x100px source images
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Size Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium mb-2">Extra Small (24px) - h-6 w-6</p>
            <p className="text-sm text-muted-foreground mb-2">
              Use in: Dense lists, inline mentions, compact UI
            </p>
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">XS</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-medium mb-2">Small (32px) - h-8 w-8</p>
            <p className="text-sm text-muted-foreground mb-2">
              Use in: Comment threads, notifications, sidebars
            </p>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">SM</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-medium mb-2">Medium (40px) - Default</p>
            <p className="text-sm text-muted-foreground mb-2">
              Use in: User menus, standard lists, team members
            </p>
            <Avatar>
              <AvatarFallback>MD</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-medium mb-2">Large (48-64px) - h-12 w-12 or h-16 w-16</p>
            <p className="text-sm text-muted-foreground mb-2">
              Use in: Profile cards, headers, prominent displays
            </p>
            <Avatar className="h-12 w-12">
              <AvatarFallback>LG</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-medium mb-2">Extra Large (96px+) - h-24 w-24+</p>
            <p className="text-sm text-muted-foreground mb-2">
              Use in: Profile pages, account settings, modals
            </p>
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">XL</AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium mb-2">User Profile</p>
            <p className="text-sm text-muted-foreground">
              Large avatar (64-96px) with name, role, and action buttons
            </p>
          </div>
          <div>
            <p className="font-medium mb-2">Comment Threads</p>
            <p className="text-sm text-muted-foreground">
              Small-medium avatars (32-40px) aligned left of comment text
            </p>
          </div>
          <div>
            <p className="font-medium mb-2">Team/Collaborators</p>
            <p className="text-sm text-muted-foreground">
              Stacked avatars with -space-x-4 for overlapping effect, +N counter for overflow
            </p>
          </div>
          <div>
            <p className="font-medium mb-2">User Menu</p>
            <p className="text-sm text-muted-foreground">
              Medium avatar (40px) in top-right corner as dropdown trigger
            </p>
          </div>
          <div>
            <p className="font-medium mb-2">Chat/Messages</p>
            <p className="text-sm text-muted-foreground">
              Small avatars (32px) with online status indicator (green/gray dot)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Basic avatar with image and fallback
<Avatar>
  <AvatarImage src="https://github.com/username.png" alt="@username" />
  <AvatarFallback>UN</AvatarFallback>
</Avatar>

// Custom size
<Avatar className="h-12 w-12">
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// With status indicator
<div className="relative inline-block">
  <Avatar>
    <AvatarImage src="/avatar.jpg" alt="User" />
    <AvatarFallback>JD</AvatarFallback>
  </Avatar>
  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
</div>

// Stacked group
<div className="flex -space-x-4">
  <Avatar className="border-2 border-background">
    <AvatarFallback>U1</AvatarFallback>
  </Avatar>
  <Avatar className="border-2 border-background">
    <AvatarFallback>U2</AvatarFallback>
  </Avatar>
  <Avatar className="border-2 border-background">
    <AvatarFallback>+5</AvatarFallback>
  </Avatar>
</div>`}
          </pre>
        </CardContent>
      </Card>
    </div>
  ),
};
