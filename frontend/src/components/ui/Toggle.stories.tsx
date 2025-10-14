import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from './toggle';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Grid,
  LayoutList,
  Volume2,
  VolumeX,
  Star,
} from 'lucide-react';

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A two-state button that can be toggled on or off. Use for binary options like bold text, mute/unmute, or favorite/unfavorite. Maintains pressed state visually and announces it to screen readers.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Visual style of the toggle',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
      description: 'Size of the toggle button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the toggle is disabled',
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default toggle button with text label.
 * Click to toggle between pressed and unpressed states.
 */
export const Default: Story = {
  render: () => {
    const [pressed, setPressed] = React.useState(false);

    return (
      <Toggle pressed={pressed} onPressedChange={setPressed}>
        Toggle
      </Toggle>
    );
  },
};

/**
 * Toggle variants: default (filled) and outline (bordered).
 * Both variants support pressed state styling.
 */
export const Variants: Story = {
  render: () => {
    const [pressedDefault, setPressedDefault] = React.useState(false);
    const [pressedOutline, setPressedOutline] = React.useState(false);

    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <Toggle
            variant="default"
            pressed={pressedDefault}
            onPressedChange={setPressedDefault}
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <span className="text-xs text-slate-600">Default</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Toggle
            variant="outline"
            pressed={pressedOutline}
            onPressedChange={setPressedOutline}
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <span className="text-xs text-slate-600">Outline</span>
        </div>
      </div>
    );
  },
};

/**
 * Toggle sizes: small, default, and large.
 * All sizes support pressed state and icons.
 */
export const Sizes: Story = {
  render: () => {
    const [pressedSm, setPressedSm] = React.useState(false);
    const [pressedDefault, setPressedDefault] = React.useState(false);
    const [pressedLg, setPressedLg] = React.useState(false);

    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <Toggle
            size="sm"
            pressed={pressedSm}
            onPressedChange={setPressedSm}
          >
            <Bold className="h-3 w-3" />
          </Toggle>
          <span className="text-xs text-slate-600">Small</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Toggle
            size="default"
            pressed={pressedDefault}
            onPressedChange={setPressedDefault}
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <span className="text-xs text-slate-600">Default</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Toggle
            size="lg"
            pressed={pressedLg}
            onPressedChange={setPressedLg}
          >
            <Bold className="h-5 w-5" />
          </Toggle>
          <span className="text-xs text-slate-600">Large</span>
        </div>
      </div>
    );
  },
};

/**
 * Toggle with icon only (no text label).
 * Common pattern for toolbars and compact interfaces.
 */
export const WithIcon: Story = {
  render: () => {
    const [bold, setBold] = React.useState(false);
    const [italic, setItalic] = React.useState(false);
    const [underline, setUnderline] = React.useState(false);

    return (
      <div className="flex items-center gap-1">
        <Toggle
          pressed={bold}
          onPressedChange={setBold}
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={italic}
          onPressedChange={setItalic}
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={underline}
          onPressedChange={setUnderline}
          aria-label="Toggle underline"
        >
          <Underline className="h-4 w-4" />
        </Toggle>
      </div>
    );
  },
};

/**
 * Toggle with icon and text label.
 * Provides both visual and textual context.
 */
export const WithIconAndText: Story = {
  render: () => {
    const [muted, setMuted] = React.useState(false);

    return (
      <Toggle
        pressed={muted}
        onPressedChange={setMuted}
        aria-label="Toggle mute"
      >
        {muted ? (
          <>
            <VolumeX className="mr-2 h-4 w-4" />
            Muted
          </>
        ) : (
          <>
            <Volume2 className="mr-2 h-4 w-4" />
            Unmuted
          </>
        )}
      </Toggle>
    );
  },
};

/**
 * Disabled toggle states.
 * Shows both unpressed and pressed disabled states.
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <Toggle disabled pressed={false}>
          <Bold className="h-4 w-4" />
        </Toggle>
        <span className="text-xs text-slate-600">Disabled (Off)</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Toggle disabled pressed={true}>
          <Bold className="h-4 w-4" />
        </Toggle>
        <span className="text-xs text-slate-600">Disabled (On)</span>
      </div>
    </div>
  ),
};

/**
 * Controlled toggle with external state.
 * Demonstrates programmatic control of toggle state.
 */
export const ControlledState: Story = {
  render: () => {
    const [pressed, setPressed] = React.useState(false);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Toggle pressed={pressed} onPressedChange={setPressed}>
            <Star className="mr-2 h-4 w-4" />
            {pressed ? 'Favorited' : 'Favorite'}
          </Toggle>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-sm font-medium">State:</p>
          <p className="text-sm text-slate-700">
            pressed = <code className="rounded bg-white px-2 py-1 font-mono">{String(pressed)}</code>
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setPressed(true)}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              Set to True
            </button>
            <button
              onClick={() => setPressed(false)}
              className="rounded bg-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
            >
              Set to False
            </button>
            <button
              onClick={() => setPressed(!pressed)}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              Toggle
            </button>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Real-world example: Text formatting toolbar.
 * Common use case in rich text editors with multiple toggle buttons.
 */
export const RealWorldTextFormatting: Story = {
  render: () => {
    const [formatting, setFormatting] = React.useState({
      bold: false,
      italic: false,
      underline: false,
    });

    const [alignment, setAlignment] = React.useState<'left' | 'center' | 'right'>('left');

    const [listType, setListType] = React.useState<'none' | 'unordered' | 'ordered'>('none');

    return (
      <div className="w-full max-w-2xl space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Text Editor</h3>
            <span className="text-xs text-slate-500">Rich text formatting</span>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-2">
            {/* Text Style */}
            <div className="flex items-center gap-0.5">
              <Toggle
                size="sm"
                pressed={formatting.bold}
                onPressedChange={(pressed) =>
                  setFormatting({ ...formatting, bold: pressed })
                }
                aria-label="Toggle bold"
              >
                <Bold className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={formatting.italic}
                onPressedChange={(pressed) =>
                  setFormatting({ ...formatting, italic: pressed })
                }
                aria-label="Toggle italic"
              >
                <Italic className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={formatting.underline}
                onPressedChange={(pressed) =>
                  setFormatting({ ...formatting, underline: pressed })
                }
                aria-label="Toggle underline"
              >
                <Underline className="h-4 w-4" />
              </Toggle>
            </div>

            <div className="h-6 w-px bg-slate-300" />

            {/* Alignment */}
            <div className="flex items-center gap-0.5">
              <Toggle
                size="sm"
                pressed={alignment === 'left'}
                onPressedChange={() => setAlignment('left')}
                aria-label="Align left"
              >
                <AlignLeft className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={alignment === 'center'}
                onPressedChange={() => setAlignment('center')}
                aria-label="Align center"
              >
                <AlignCenter className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={alignment === 'right'}
                onPressedChange={() => setAlignment('right')}
                aria-label="Align right"
              >
                <AlignRight className="h-4 w-4" />
              </Toggle>
            </div>

            <div className="h-6 w-px bg-slate-300" />

            {/* Lists */}
            <div className="flex items-center gap-0.5">
              <Toggle
                size="sm"
                pressed={listType === 'unordered'}
                onPressedChange={() =>
                  setListType(listType === 'unordered' ? 'none' : 'unordered')
                }
                aria-label="Toggle bullet list"
              >
                <List className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={listType === 'ordered'}
                onPressedChange={() =>
                  setListType(listType === 'ordered' ? 'none' : 'ordered')
                }
                aria-label="Toggle numbered list"
              >
                <ListOrdered className="h-4 w-4" />
              </Toggle>
            </div>
          </div>

          {/* Preview Text */}
          <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
            <p
              className={`text-sm ${alignment === 'center' ? 'text-center' : ''} ${
                alignment === 'right' ? 'text-right' : ''
              } ${formatting.bold ? 'font-bold' : ''} ${
                formatting.italic ? 'italic' : ''
              } ${formatting.underline ? 'underline' : ''}`}
            >
              {listType === 'none' && 'This is sample text with formatting applied.'}
              {listType === 'unordered' && (
                <ul className="list-disc pl-5">
                  <li>First bullet point</li>
                  <li>Second bullet point</li>
                  <li>Third bullet point</li>
                </ul>
              )}
              {listType === 'ordered' && (
                <ol className="list-decimal pl-5">
                  <li>First item</li>
                  <li>Second item</li>
                  <li>Third item</li>
                </ol>
              )}
            </p>
          </div>

          {/* Active Formatting Info */}
          <div className="mt-3 text-xs text-slate-600">
            <span className="font-medium">Active:</span>{' '}
            {[
              formatting.bold && 'Bold',
              formatting.italic && 'Italic',
              formatting.underline && 'Underline',
              `Align ${alignment}`,
              listType !== 'none' && `${listType} list`,
            ]
              .filter(Boolean)
              .join(', ') || 'None'}
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Real-world example: View mode toggles.
 * Switch between grid and list views in a file browser or gallery.
 */
export const RealWorldViewToggle: Story = {
  render: () => {
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

    const files = [
      { name: 'Project_Proposal.pdf', size: '2.4 MB', date: 'Today' },
      { name: 'Budget_2024.xlsx', size: '856 KB', date: 'Yesterday' },
      { name: 'Team_Photo.jpg', size: '3.2 MB', date: '2 days ago' },
      { name: 'Meeting_Notes.docx', size: '124 KB', date: '3 days ago' },
    ];

    return (
      <div className="w-full max-w-3xl space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h3 className="font-semibold text-slate-900">My Documents</h3>
            <p className="text-sm text-slate-600">{files.length} files</p>
          </div>

          <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
            <Toggle
              size="sm"
              pressed={viewMode === 'grid'}
              onPressedChange={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={viewMode === 'list'}
              onPressedChange={() => setViewMode('list')}
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" />
            </Toggle>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 gap-4">
            {files.map((file) => (
              <div
                key={file.name}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex h-24 items-center justify-center rounded bg-slate-100">
                  <span className="text-4xl">📄</span>
                </div>
                <h4 className="truncate font-medium text-slate-900">{file.name}</h4>
                <p className="mt-1 text-sm text-slate-600">
                  {file.size} • {file.date}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <h4 className="font-medium text-slate-900">{file.name}</h4>
                    <p className="text-sm text-slate-600">
                      {file.size} • {file.date}
                    </p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:underline">
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
};

/**
 * Usage guidelines for Toggle component.
 * Includes Do's and Don'ts, keyboard shortcuts, and accessibility notes.
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="max-w-4xl space-y-8 p-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Toggle Usage Guidelines</h2>
        <p className="text-slate-600">
          Use toggle buttons for binary options that can be turned on or off, like
          formatting controls, view modes, or feature flags.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-green-700">✓ Do's</h3>
          <ul className="space-y-2">
            <li className="flex gap-3">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Use for binary states</strong> that are either on or off
                (bold text, mute audio, favorite item)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Provide visual feedback</strong> for the pressed state with
                clear styling differences
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Include aria-label</strong> for icon-only toggles to ensure
                screen reader accessibility
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Group related toggles</strong> together (text formatting,
                alignment options)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Use consistent sizing</strong> within a toolbar or control group
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Make the pressed state obvious</strong> with color, background,
                or border changes
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-red-700">✗ Don'ts</h3>
          <ul className="space-y-2">
            <li className="flex gap-3">
              <span className="text-red-600">✗</span>
              <span>
                <strong>Don't use for actions</strong> that trigger immediate operations
                (use Button instead)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-red-600">✗</span>
              <span>
                <strong>Don't use for mutually exclusive options</strong> with 3+ choices
                (use RadioGroup or Select instead)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-red-600">✗</span>
              <span>
                <strong>Don't make toggles ambiguous</strong> - the state should be clear
                from visual feedback alone
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-red-600">✗</span>
              <span>
                <strong>Don't mix toggle behavior</strong> with links or navigation
                (toggle state, don't navigate)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-red-600">✗</span>
              <span>
                <strong>Don't rely solely on color</strong> to indicate pressed state
                (use multiple visual cues)
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Key</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-4 py-3">
                  <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm">
                    Space
                  </code>
                </td>
                <td className="px-4 py-3 text-sm">
                  Toggle the pressed state (on ↔ off)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm">
                    Enter
                  </code>
                </td>
                <td className="px-4 py-3 text-sm">
                  Toggle the pressed state (on ↔ off)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm">
                    Tab
                  </code>
                </td>
                <td className="px-4 py-3 text-sm">
                  Move focus to the next focusable element
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm">
                    Shift + Tab
                  </code>
                </td>
                <td className="px-4 py-3 text-sm">
                  Move focus to the previous focusable element
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Code Examples</h3>

        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium">Basic Usage</h4>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-white">
              <code>{`const [pressed, setPressed] = useState(false);

<Toggle pressed={pressed} onPressedChange={setPressed}>
  <Bold className="h-4 w-4" />
</Toggle>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="mb-2 font-medium">With Icon and Label</h4>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-white">
              <code>{`<Toggle pressed={pressed} onPressedChange={setPressed}>
  <Star className="mr-2 h-4 w-4" />
  Favorite
</Toggle>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Toolbar Group</h4>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-white">
              <code>{`<div className="flex gap-1">
  <Toggle pressed={bold} onPressedChange={setBold}>
    <Bold className="h-4 w-4" />
  </Toggle>
  <Toggle pressed={italic} onPressedChange={setItalic}>
    <Italic className="h-4 w-4" />
  </Toggle>
  <Toggle pressed={underline} onPressedChange={setUnderline}>
    <Underline className="h-4 w-4" />
  </Toggle>
</div>`}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-2 font-semibold text-blue-900">
          Pressed State
        </h3>
        <p className="text-sm text-blue-800">
          The Toggle component maintains a <code>pressed</code> state that can be
          controlled or uncontrolled. The pressed state is announced to screen readers
          via <code>aria-pressed="true"</code> or <code>aria-pressed="false"</code>,
          ensuring accessibility for assistive technologies.
        </p>
      </div>

      <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
        <h3 className="mb-2 font-semibold text-purple-900">
          ARIA Accessibility
        </h3>
        <p className="text-sm text-purple-800">
          Toggle uses <code>role="button"</code> and <code>aria-pressed</code> to
          indicate its toggle nature. Icon-only toggles should include{' '}
          <code>aria-label</code> to provide context for screen reader users. The
          component is keyboard accessible via Space and Enter keys.
        </p>
      </div>
    </div>
  ),
};
