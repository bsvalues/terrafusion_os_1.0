import type { Meta, StoryObj } from '@storybook/react';
import { 
  File, FileText, FolderOpen, Save, Scissors, Copy, Clipboard, 
  Undo, Redo, Search, ZoomIn, ZoomOut, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, CheckSquare, Circle, Square
} from 'lucide-react';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './menubar';

/**
 * # Menubar Component
 * 
 * A menu bar component that displays a horizontal collection of menu triggers,
 * commonly used in application headers for primary navigation and actions.
 * 
 * ## Features
 * - **Multiple Menus:** Organize actions into logical menu groups
 * - **Submenus:** Nested menu structures for hierarchical actions
 * - **Keyboard Shortcuts:** Display and handle keyboard shortcuts
 * - **Checkboxes & Radio:** Stateful menu items for settings
 * - **Keyboard Navigation:** Full arrow key and Enter/Escape support
 * - **Accessibility:** Complete ARIA implementation with focus management
 * 
 * ## Use Cases
 * - Application menu bars (File, Edit, View, etc.)
 * - Text editor toolbars
 * - IDE navigation
 * - Desktop-style applications
 * 
 * Built on @radix-ui/react-menubar
 */

const meta: Meta<typeof Menubar> = {
  title: 'Components/Menubar',
  component: Menubar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A menu bar with multiple menu triggers for application-level actions.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Menubar>;

/**
 * ## Default Menubar
 * 
 * Basic menubar with File and Edit menus containing common actions.
 */
export const Default: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <File className="mr-2 h-4 w-4" />
            New File
            <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <FolderOpen className="mr-2 h-4 w-4" />
            Open...
            <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Save className="mr-2 h-4 w-4" />
            Save
            <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Exit</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Undo className="mr-2 h-4 w-4" />
            Undo
            <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Redo className="mr-2 h-4 w-4" />
            Redo
            <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <Scissors className="mr-2 h-4 w-4" />
            Cut
            <MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Copy className="mr-2 h-4 w-4" />
            Copy
            <MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Clipboard className="mr-2 h-4 w-4" />
            Paste
            <MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};

/**
 * ## With Submenus
 * 
 * Nested submenu structures for organizing related actions hierarchically.
 */
export const WithSubmenus: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <File className="mr-2 h-4 w-4" />
            New File
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>
              <FileText className="mr-2 h-4 w-4" />
              Open Recent
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>project-alpha.tsx</MenubarItem>
              <MenubarItem>dashboard.tsx</MenubarItem>
              <MenubarItem>settings.tsx</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Clear Recent Files</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>
            <Save className="mr-2 h-4 w-4" />
            Save
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Export As...</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>PDF</MenubarItem>
              <MenubarItem>HTML</MenubarItem>
              <MenubarItem>Markdown</MenubarItem>
              <MenubarItem>Plain Text</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarSub>
            <MenubarSubTrigger>
              <ZoomIn className="mr-2 h-4 w-4" />
              Zoom
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Zoom In <MenubarShortcut>⌘+</MenubarShortcut></MenubarItem>
              <MenubarItem>Zoom Out <MenubarShortcut>⌘-</MenubarShortcut></MenubarItem>
              <MenubarItem>Reset Zoom <MenubarShortcut>⌘0</MenubarShortcut></MenubarItem>
              <MenubarSeparator />
              <MenubarItem>50%</MenubarItem>
              <MenubarItem>75%</MenubarItem>
              <MenubarItem>100%</MenubarItem>
              <MenubarItem>125%</MenubarItem>
              <MenubarItem>150%</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};

/**
 * ## With Keyboard Shortcuts
 * 
 * Display keyboard shortcuts to help users learn efficient workflows.
 */
export const WithShortcuts: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New Tab <MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            New Window <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            New Incognito Window <MenubarShortcut>⇧⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Save <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Print <MenubarShortcut>⌘P</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Find <MenubarShortcut>⌘F</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Replace <MenubarShortcut>⌥⌘F</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};

/**
 * ## With Radio Groups
 * 
 * Radio button groups for mutually exclusive options.
 */
export const WithRadio: Story = {
  render: () => {
    const [textAlign, setTextAlign] = React.useState<string>('left');
    
    return (
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Format</MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup value={textAlign} onValueChange={setTextAlign}>
              <MenubarRadioItem value="left">
                <AlignLeft className="mr-2 h-4 w-4" />
                Align Left
              </MenubarRadioItem>
              <MenubarRadioItem value="center">
                <AlignCenter className="mr-2 h-4 w-4" />
                Align Center
              </MenubarRadioItem>
              <MenubarRadioItem value="right">
                <AlignRight className="mr-2 h-4 w-4" />
                Align Right
              </MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );
  },
};

/**
 * ## With Checkboxes
 * 
 * Checkbox items for toggleable settings and preferences.
 */
export const WithCheckboxes: Story = {
  render: () => {
    const [showStatusBar, setShowStatusBar] = React.useState<boolean>(true);
    const [showActivityBar, setShowActivityBar] = React.useState<boolean>(false);
    const [showPanel, setShowPanel] = React.useState<boolean>(false);
    const [bold, setBold] = React.useState<boolean>(false);
    const [italic, setItalic] = React.useState<boolean>(false);
    const [underline, setUnderline] = React.useState<boolean>(false);

    return (
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked={showStatusBar} onCheckedChange={setShowStatusBar}>
              Status Bar
            </MenubarCheckboxItem>
            <MenubarCheckboxItem checked={showActivityBar} onCheckedChange={setShowActivityBar}>
              Activity Bar
            </MenubarCheckboxItem>
            <MenubarCheckboxItem checked={showPanel} onCheckedChange={setShowPanel}>
              Panel
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Format</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked={bold} onCheckedChange={setBold}>
              <Bold className="mr-2 h-4 w-4" />
              Bold
              <MenubarShortcut>⌘B</MenubarShortcut>
            </MenubarCheckboxItem>
            <MenubarCheckboxItem checked={italic} onCheckedChange={setItalic}>
              <Italic className="mr-2 h-4 w-4" />
              Italic
              <MenubarShortcut>⌘I</MenubarShortcut>
            </MenubarCheckboxItem>
            <MenubarCheckboxItem checked={underline} onCheckedChange={setUnderline}>
              <Underline className="mr-2 h-4 w-4" />
              Underline
              <MenubarShortcut>⌘U</MenubarShortcut>
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );
  },
};

/**
 * ## Real-World: Application Menu
 * 
 * Complete application menubar with File, Edit, View, and Help menus.
 */
export const RealWorldApplication: Story = {
  render: () => {
    const [showMinimap, setShowMinimap] = React.useState<boolean>(true);
    const [showLineNumbers, setShowLineNumbers] = React.useState<boolean>(true);
    const [wordWrap, setWordWrap] = React.useState<boolean>(false);

    return (
      <div className="w-full max-w-2xl space-y-4">
        <Menubar className="rounded-none border-b">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <File className="mr-2 h-4 w-4" />
                New File
                <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <FolderOpen className="mr-2 h-4 w-4" />
                Open File...
                <MenubarShortcut>⌘O</MenubarShortcut>
              </MenubarItem>
              <MenubarSub>
                <MenubarSubTrigger>Open Recent</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>components/Button.tsx</MenubarItem>
                  <MenubarItem>pages/Dashboard.tsx</MenubarItem>
                  <MenubarItem>utils/helpers.ts</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Clear Recently Opened</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem>
                <Save className="mr-2 h-4 w-4" />
                Save
                <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Save As...
                <MenubarShortcut>⇧⌘S</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                Close Editor
                <MenubarShortcut>⌘W</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <Undo className="mr-2 h-4 w-4" />
                Undo
                <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Redo className="mr-2 h-4 w-4" />
                Redo
                <MenubarShortcut>⇧⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Scissors className="mr-2 h-4 w-4" />
                Cut
                <MenubarShortcut>⌘X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Copy className="mr-2 h-4 w-4" />
                Copy
                <MenubarShortcut>⌘C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Clipboard className="mr-2 h-4 w-4" />
                Paste
                <MenubarShortcut>⌘V</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Search className="mr-2 h-4 w-4" />
                Find
                <MenubarShortcut>⌘F</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Replace
                <MenubarShortcut>⌥⌘F</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={showMinimap} onCheckedChange={setShowMinimap}>
                Show Minimap
              </MenubarCheckboxItem>
              <MenubarCheckboxItem checked={showLineNumbers} onCheckedChange={setShowLineNumbers}>
                Show Line Numbers
              </MenubarCheckboxItem>
              <MenubarCheckboxItem checked={wordWrap} onCheckedChange={setWordWrap}>
                Word Wrap
                <MenubarShortcut>⌥Z</MenubarShortcut>
              </MenubarCheckboxItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>
                  <ZoomIn className="mr-2 h-4 w-4" />
                  Zoom
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Zoom In <MenubarShortcut>⌘+</MenubarShortcut></MenubarItem>
                  <MenubarItem>Zoom Out <MenubarShortcut>⌘-</MenubarShortcut></MenubarItem>
                  <MenubarItem>Reset Zoom <MenubarShortcut>⌘0</MenubarShortcut></MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Documentation</MenubarItem>
              <MenubarItem>Keyboard Shortcuts</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Check for Updates...</MenubarItem>
              <MenubarItem>About</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        <div className="rounded-lg border bg-muted/50 p-8 text-center text-sm text-muted-foreground">
          <p>Application content area</p>
          <p className="mt-2">
            Minimap: {showMinimap ? 'On' : 'Off'} | 
            Line Numbers: {showLineNumbers ? 'On' : 'Off'} | 
            Word Wrap: {wordWrap ? 'On' : 'Off'}
          </p>
        </div>
      </div>
    );
  },
};

/**
 * ## Real-World: Text Editor
 * 
 * Rich text editor menubar with formatting options.
 */
export const RealWorldTextEditor: Story = {
  render: () => {
    const [bold, setBold] = React.useState<boolean>(false);
    const [italic, setItalic] = React.useState<boolean>(false);
    const [underline, setUnderline] = React.useState<boolean>(false);
    const [alignment, setAlignment] = React.useState<string>('left');
    const [bulletStyle, setBulletStyle] = React.useState<string>('disc');

    return (
      <div className="w-full max-w-3xl space-y-4">
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New Document</MenubarItem>
              <MenubarItem>Open...</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Save</MenubarItem>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                  <MenubarItem>Word Document</MenubarItem>
                  <MenubarItem>Plain Text</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem>Print</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
              <MenubarItem>Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Cut <MenubarShortcut>⌘X</MenubarShortcut></MenubarItem>
              <MenubarItem>Copy <MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
              <MenubarItem>Paste <MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Format</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={bold} onCheckedChange={setBold}>
                <Bold className="mr-2 h-4 w-4" />
                Bold <MenubarShortcut>⌘B</MenubarShortcut>
              </MenubarCheckboxItem>
              <MenubarCheckboxItem checked={italic} onCheckedChange={setItalic}>
                <Italic className="mr-2 h-4 w-4" />
                Italic <MenubarShortcut>⌘I</MenubarShortcut>
              </MenubarCheckboxItem>
              <MenubarCheckboxItem checked={underline} onCheckedChange={setUnderline}>
                <Underline className="mr-2 h-4 w-4" />
                Underline <MenubarShortcut>⌘U</MenubarShortcut>
              </MenubarCheckboxItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Alignment</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarRadioGroup value={alignment} onValueChange={setAlignment}>
                    <MenubarRadioItem value="left">
                      <AlignLeft className="mr-2 h-4 w-4" />
                      Left
                    </MenubarRadioItem>
                    <MenubarRadioItem value="center">
                      <AlignCenter className="mr-2 h-4 w-4" />
                      Center
                    </MenubarRadioItem>
                    <MenubarRadioItem value="right">
                      <AlignRight className="mr-2 h-4 w-4" />
                      Right
                    </MenubarRadioItem>
                  </MenubarRadioGroup>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Insert</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Image...</MenubarItem>
              <MenubarItem>Table...</MenubarItem>
              <MenubarItem>Link <MenubarShortcut>⌘K</MenubarShortcut></MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>List</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarRadioGroup value={bulletStyle} onValueChange={setBulletStyle}>
                    <MenubarRadioItem value="disc">
                      <Circle className="mr-2 h-4 w-4" />
                      Bullet List
                    </MenubarRadioItem>
                    <MenubarRadioItem value="decimal">
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Numbered List
                    </MenubarRadioItem>
                    <MenubarRadioItem value="square">
                      <Square className="mr-2 h-4 w-4" />
                      Checklist
                    </MenubarRadioItem>
                  </MenubarRadioGroup>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        <div className="rounded-lg border bg-background p-8">
          <div className="prose max-w-none">
            <p style={{ fontWeight: bold ? 'bold' : 'normal', fontStyle: italic ? 'italic' : 'normal', textDecoration: underline ? 'underline' : 'none', textAlign: alignment as any }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Formatting: {bold && 'Bold '}{italic && 'Italic '}{underline && 'Underline'} | 
            Alignment: {alignment} | 
            List: {bulletStyle}
          </div>
        </div>
      </div>
    );
  },
};

/**
 * ## Usage Guidelines
 * 
 * ### When to Use
 * - ✅ Desktop-style applications with traditional menu bars
 * - ✅ Complex applications with many actions (IDEs, editors)
 * - ✅ Applications targeting power users familiar with menu patterns
 * - ✅ When keyboard shortcuts are important for workflow
 * - ✅ Hierarchical action organization (File > Open Recent > ...)
 * 
 * ### When Not to Use
 * - ❌ Mobile applications (use drawer/sheet instead)
 * - ❌ Simple applications with few actions (use toolbar buttons)
 * - ❌ Marketing websites (use navigation component)
 * - ❌ When screen space is limited (use dropdown menu)
 * 
 * ### Keyboard Navigation
 * 
 * | Key | Action |
 * |-----|--------|
 * | `Tab` | Move focus to/from menubar |
 * | `→ / ←` | Navigate between menu triggers |
 * | `↓ / ↑` | Navigate menu items |
 * | `Enter / Space` | Activate menu item or toggle checkbox |
 * | `Escape` | Close menu |
 * | `Letter key` | Jump to menu trigger starting with that letter |
 * 
 * ### Best Practices
 * 
 * **Do:**
 * - Group related actions together logically
 * - Use standard menu names (File, Edit, View, Help)
 * - Display keyboard shortcuts consistently
 * - Use separators to create visual groupings
 * - Keep menu structures shallow (max 2-3 levels deep)
 * - Disable unavailable actions rather than hiding them
 * - Use checkboxes for toggleable options
 * - Use radio groups for mutually exclusive options
 * 
 * **Don't:**
 * - Don't create overly deep menu hierarchies
 * - Don't hide commonly used actions in submenus
 * - Don't use menubar on mobile devices
 * - Don't overload a single menu with too many items
 * - Don't forget to indicate state for checkboxes/radio items
 * - Don't use menubar for primary navigation (use nav menu instead)
 * 
 * ### Accessibility
 * 
 * - Full keyboard navigation with arrow keys
 * - ARIA menubar role with proper attributes
 * - Focus management and trapping
 * - Screen reader announcements for menu states
 * - Keyboard shortcut display for discoverability
 * - Disabled state clearly indicated
 * 
 * ### Common Patterns
 * 
 * ```tsx
 * // Basic menubar with multiple menus
 * <Menubar>
 *   <MenubarMenu>
 *     <MenubarTrigger>File</MenubarTrigger>
 *     <MenubarContent>
 *       <MenubarItem>New <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
 *       <MenubarItem>Open <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
 *     </MenubarContent>
 *   </MenubarMenu>
 * </Menubar>
 * 
 * // With submenu
 * <MenubarSub>
 *   <MenubarSubTrigger>Open Recent</MenubarSubTrigger>
 *   <MenubarSubContent>
 *     <MenubarItem>file1.tsx</MenubarItem>
 *     <MenubarItem>file2.tsx</MenubarItem>
 *   </MenubarSubContent>
 * </MenubarSub>
 * 
 * // With checkbox
 * <MenubarCheckboxItem 
 *   checked={enabled} 
 *   onCheckedChange={setEnabled}
 * >
 *   Show Status Bar
 * </MenubarCheckboxItem>
 * 
 * // With radio group
 * <MenubarRadioGroup value={theme} onValueChange={setTheme}>
 *   <MenubarRadioItem value="light">Light</MenubarRadioItem>
 *   <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
 * </MenubarRadioGroup>
 * ```
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">✅ Do's</h3>
        <ul className="space-y-2 text-sm">
          <li>✓ Use standard menu names (File, Edit, View) for familiarity</li>
          <li>✓ Group related actions together with separators</li>
          <li>✓ Display keyboard shortcuts to help users learn</li>
          <li>✓ Disable unavailable actions instead of hiding them</li>
          <li>✓ Keep menu hierarchies shallow (2-3 levels max)</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">❌ Don'ts</h3>
        <ul className="space-y-2 text-sm">
          <li>✗ Don't use menubar on mobile devices</li>
          <li>✗ Don't create overly deep menu nesting</li>
          <li>✗ Don't overload single menus with too many items</li>
          <li>✗ Don't use for primary navigation (use NavigationMenu instead)</li>
          <li>✗ Don't hide commonly used actions deep in submenus</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Example Usage</h3>
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Demo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Action 1</MenubarItem>
              <MenubarItem>Action 2</MenubarItem>
              <MenubarSeparator />
              <MenubarCheckboxItem checked={true}>
                Option 1
              </MenubarCheckboxItem>
              <MenubarCheckboxItem checked={false}>
                Option 2
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </div>
  ),
};
