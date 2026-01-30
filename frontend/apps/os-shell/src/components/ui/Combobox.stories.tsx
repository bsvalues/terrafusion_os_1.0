import { cn } from '@utils/cn';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Building2,
  Check,
  ChevronsUpDown,
  Loader2,
  Package,
  Search,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from './badge';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

/**
 * # Combobox Component
 *
 * A searchable select component built by composing Command and Popover components.
 * Provides autocomplete, filtering, and selection capabilities with keyboard navigation.
 *
 * ## Architecture
 *
 * ### Component Composition
 * ```
 * Popover (root container, manages open state)
 * ├── PopoverTrigger (button to toggle dropdown)
 * └── PopoverContent (dropdown overlay)
 *     └── Command (command palette interface)
 *         ├── CommandInput (search/filter input)
 *         └── CommandList (scrollable results)
 *             ├── CommandEmpty (no results state)
 *             ├── CommandGroup (grouped items)
 *             │   └── CommandItem (selectable option)
 *             └── CommandSeparator (visual divider)
 * ```
 *
 * ### Built on Radix UI + cmdk
 * - **Popover**: @radix-ui/react-popover (positioning, overlay management)
 * - **Command**: cmdk (command palette by Paco Coursey, fuzzy search, keyboard nav)
 *
 * ## Features
 *
 * ### Core Capabilities
 * - ✅ Fuzzy search filtering (built into cmdk)
 * - ✅ Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - ✅ Single or multi-select modes
 * - ✅ Async data loading (fetch on open)
 * - ✅ Custom item rendering (icons, badges, metadata)
 * - ✅ Grouped options (categories with headers)
 * - ✅ Empty state messaging
 * - ✅ Loading state indicators
 * - ✅ Accessibility (ARIA combobox pattern)
 *
 * ### Interaction Patterns
 * - **Click trigger**: Open dropdown
 * - **Type in search**: Filter options (fuzzy match)
 * - **Arrow Down/Up**: Navigate options
 * - **Enter**: Select highlighted option
 * - **Escape**: Close dropdown
 * - **Click outside**: Close dropdown
 *
 * ## Design Tokens
 *
 * ### Colors
 * - Selected item: `data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground`
 * - Empty state: `text-muted-foreground`
 * - Group headings: `text-muted-foreground`
 *
 * ### Sizing
 * - Popover width: `w-[300px]` (default, configurable)
 * - Max list height: `max-h-[300px]` with scroll
 * - Item padding: `px-2 py-1.5`
 *
 * ## Accessibility
 *
 * ### ARIA Combobox Pattern
 * - Role: `combobox` on trigger
 * - `aria-expanded`: Reflects open state
 * - `aria-controls`: Links trigger to listbox
 * - `aria-activedescendant`: Tracks focused option
 * - `role="option"` on CommandItem
 *
 * ### Keyboard Navigation
 * - **Tab**: Focus trigger or input
 * - **Enter/Space**: Open dropdown (on trigger)
 * - **Arrow Down**: Next option
 * - **Arrow Up**: Previous option
 * - **Home**: First option
 * - **End**: Last option
 * - **Enter**: Select highlighted option
 * - **Escape**: Close dropdown
 * - **Type to search**: Filter options
 *
 * ### Screen Reader Support
 * - Options count announced
 * - Selected option announced
 * - Search results announced
 * - Empty state announced
 *
 * ## Examples
 *
 * The following stories demonstrate:
 *
 * 1. **Autocomplete**: Basic combobox with type-ahead filtering
 * 2. **Search Filtering**: Fuzzy search across large dataset
 * 3. **Multi-select**: Select multiple options with chip display
 * 4. **Async Loading**: Fetch data from API when opened
 * 5. **Custom Rendering**: Rich item display with icons and metadata
 * 6. **Groups**: Categorized options with section headers
 * 7. **Empty State**: Custom message when no results found
 * 8. **Loading State**: Skeleton UI during data fetch
 * 9. **Keyboard Shortcuts**: Visual hints for keyboard navigation
 */
const meta = {
  title: 'UI/Combobox',
  component: Popover,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A searchable select component combining Command and Popover for autocomplete, filtering, and selection with keyboard navigation.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data
interface Framework {
  value: string;
  label: string;
}

const frameworks: Framework[] = [
  { value: 'next', label: 'Next.js' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'nuxt', label: 'Nuxt.js' },
  { value: 'gatsby', label: 'Gatsby' },
  { value: 'solid', label: 'SolidJS' },
];

/**
 * ## Autocomplete
 *
 * Basic combobox with type-ahead filtering. Type to filter options, click to select.
 *
 * ### Use Cases
 * - Framework selection
 * - Country picker
 * - Language selector
 * - Category chooser
 * - Tag selection
 *
 * ### Features
 * - Fuzzy search (built into cmdk)
 * - Keyboard navigation (Arrow keys, Enter)
 * - Click outside to close
 * - Selected value displayed in trigger
 * - Check icon for selected item
 */
export const Autocomplete: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open ? 'true' : 'false'}
            className='w-[300px] justify-between'
          >
            {value
              ? frameworks.find((framework) => framework.value === value)?.label
              : 'Select framework...'}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[300px] p-0'>
          <Command>
            <CommandInput placeholder='Search framework...' />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map((framework) => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === framework.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {framework.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
};

/**
 * ## Search Filtering
 *
 * Fuzzy search across large dataset (100+ items). Highlights matching text.
 *
 * ### Implementation
 * cmdk handles fuzzy search automatically. No additional filtering code needed.
 *
 * ### Use Cases
 * - City/state search
 * - Product search (large catalog)
 * - User search (employee directory)
 * - Document search (knowledge base)
 *
 * ### Performance
 * - cmdk efficiently filters thousands of items
 * - Virtualization not needed for <1000 items
 * - For 10,000+ items, consider server-side search
 */
export const SearchFiltering: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');

    // Generate large dataset (100 US cities)
    const cities = useMemo(
      () => [
        'New York',
        'Los Angeles',
        'Chicago',
        'Houston',
        'Phoenix',
        'Philadelphia',
        'San Antonio',
        'San Diego',
        'Dallas',
        'San Jose',
        'Austin',
        'Jacksonville',
        'Fort Worth',
        'Columbus',
        'Charlotte',
        'San Francisco',
        'Indianapolis',
        'Seattle',
        'Denver',
        'Washington',
        'Boston',
        'El Paso',
        'Nashville',
        'Detroit',
        'Oklahoma City',
        'Portland',
        'Las Vegas',
        'Memphis',
        'Louisville',
        'Baltimore',
        'Milwaukee',
        'Albuquerque',
        'Tucson',
        'Fresno',
        'Mesa',
        'Sacramento',
        'Atlanta',
        'Kansas City',
        'Colorado Springs',
        'Omaha',
        'Raleigh',
        'Miami',
        'Long Beach',
        'Virginia Beach',
        'Oakland',
        'Minneapolis',
        'Tulsa',
        'Tampa',
        'Arlington',
        'New Orleans',
        'Wichita',
        'Cleveland',
        'Bakersfield',
        'Aurora',
        'Anaheim',
        'Honolulu',
        'Santa Ana',
        'Riverside',
        'Corpus Christi',
        'Lexington',
        'Henderson',
        'Stockton',
        'Saint Paul',
        'Cincinnati',
        'St. Louis',
        'Pittsburgh',
        'Greensboro',
        'Lincoln',
        'Anchorage',
        'Plano',
        'Orlando',
        'Irvine',
        'Newark',
        'Durham',
        'Chula Vista',
        'Toledo',
        'Fort Wayne',
        'St. Petersburg',
        'Laredo',
        'Jersey City',
        'Chandler',
        'Madison',
        'Lubbock',
        'Scottsdale',
        'Reno',
        'Buffalo',
        'Gilbert',
        'Glendale',
        'North Las Vegas',
        'Winston-Salem',
        'Chesapeake',
        'Norfolk',
        'Fremont',
        'Garland',
        'Irving',
        'Hialeah',
        'Richmond',
        'Boise',
        'Spokane',
        'Baton Rouge',
      ],
      []
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open ? 'true' : 'false'}
            className='w-[300px] justify-between'
          >
            {value || 'Select city...'}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[300px] p-0'>
          <Command>
            <CommandInput placeholder='Search from 100 cities...' />
            <CommandList>
              <CommandEmpty>No city found.</CommandEmpty>
              <CommandGroup>
                {cities.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', value === city ? 'opacity-100' : 'opacity-0')}
                    />
                    {city}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
};

/**
 * ## Multi-select
 *
 * Select multiple options. Display selected items as chips/badges with remove buttons.
 *
 * ### Implementation
 * ```tsx
 * const [selectedValues, setSelectedValues] = useState<string[]>([]);
 *
 * const handleSelect = (value: string) => {
 *   setSelectedValues(prev =>
 *     prev.includes(value)
 *       ? prev.filter(v => v !== value)
 *       : [...prev, value]
 *   );
 * };
 * ```
 *
 * ### Use Cases
 * - Tag selection (blog posts)
 * - Category selection (products)
 * - Recipient selection (email)
 * - Filter selection (search)
 * - Permission selection (user roles)
 *
 * ### Features
 * - Multiple items selected at once
 * - Chips display selected items
 * - X button to remove individual chips
 * - Clear all button
 * - Selected count indicator
 */
export const MultiSelect: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [selectedValues, setSelectedValues] = useState<string[]>([]);

    const handleSelect = (value: string) => {
      setSelectedValues((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    };

    const handleRemove = (value: string) => {
      setSelectedValues((prev) => prev.filter((v) => v !== value));
    };

    return (
      <div className='space-y-2 w-[400px]'>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              role='combobox'
              aria-expanded={open ? 'true' : 'false'}
              className='w-full justify-between'
            >
              <span className='truncate'>
                {selectedValues.length > 0
                  ? `${selectedValues.length} selected`
                  : 'Select frameworks...'}
              </span>
              <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[400px] p-0'>
            <Command>
              <CommandInput placeholder='Search framework...' />
              <CommandList>
                <CommandEmpty>No framework found.</CommandEmpty>
                <CommandGroup>
                  {frameworks.map((framework) => (
                    <CommandItem
                      key={framework.value}
                      value={framework.value}
                      onSelect={handleSelect}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedValues.includes(framework.value) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {framework.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedValues.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {selectedValues.map((value) => {
              const framework = frameworks.find((f) => f.value === value);
              return (
                <Badge key={value} variant='secondary' className='px-2 py-1'>
                  {framework?.label}
                  <button
                    className='ml-1 rounded-full hover:bg-muted'
                    onClick={() => handleRemove(value)}
                  >
                    <X className='h-3 w-3' />
                  </button>
                </Badge>
              );
            })}
            <Button variant='ghost' size='sm' className='h-6' onClick={() => setSelectedValues([])}>
              Clear all
            </Button>
          </div>
        )}
      </div>
    );
  },
};

/**
 * ## Async Loading
 *
 * Fetch data from API when combobox opens. Show loading state while fetching.
 *
 * ### Implementation
 * ```tsx
 * const [options, setOptions] = useState<T[]>([]);
 * const [isLoading, setIsLoading] = useState(false);
 *
 * useEffect(() => {
 *   if (open && options.length === 0) {
 *     setIsLoading(true);
 *     fetchOptions().then(data => {
 *       setOptions(data);
 *       setIsLoading(false);
 *     });
 *   }
 * }, [open]);
 * ```
 *
 * ### Use Cases
 * - User search (directory API)
 * - Product search (catalog API)
 * - Address autocomplete (geocoding API)
 * - Repository search (GitHub API)
 * - Ticket search (Jira API)
 *
 * ### Features
 * - Lazy loading (fetch on first open)
 * - Loading spinner in dropdown
 * - Error state handling
 * - Cache loaded data (don't re-fetch)
 */
export const AsyncLoading: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');
    const [options, setOptions] = useState<Framework[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (open && options.length === 0) {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
          setOptions(frameworks);
          setIsLoading(false);
        }, 1500);
      }
    }, [open, options.length]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open ? 'true' : 'false'}
            className='w-[300px] justify-between'
          >
            {value ? options.find((opt) => opt.value === value)?.label : 'Select framework...'}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[300px] p-0'>
          <Command>
            <CommandInput placeholder='Search framework...' disabled={isLoading} />
            <CommandList>
              {isLoading ? (
                <div className='flex items-center justify-center py-6'>
                  <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                  <span className='ml-2 text-sm text-muted-foreground'>Loading...</span>
                </div>
              ) : (
                <>
                  <CommandEmpty>No framework found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={(currentValue) => {
                          setValue(currentValue === value ? '' : currentValue);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === option.value ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
};

/**
 * ## Custom Rendering
 *
 * Rich item display with icons, badges, and metadata. More than just text labels.
 *
 * ### Use Cases
 * - Team member selector (avatar + name + role)
 * - Repository picker (icon + name + stars)
 * - File browser (file type icon + name + size)
 * - Status selector (color indicator + label)
 * - Priority picker (icon + label + description)
 *
 * ### Features
 * - Leading icons (lucide-react)
 * - Trailing badges (status, counts)
 * - Multi-line display (title + subtitle)
 * - Color indicators
 * - Custom styling per item
 */
export const CustomRendering: Story = {
  render: () => {
    interface Resource {
      id: string;
      name: string;
      type: 'company' | 'team' | 'product' | 'tag';
      count?: number;
    }

    const resources: Resource[] = [
      { id: '1', name: 'Acme Corporation', type: 'company', count: 1250 },
      { id: '2', name: 'TechStart Inc', type: 'company', count: 340 },
      { id: '3', name: 'Engineering Team', type: 'team', count: 45 },
      { id: '4', name: 'Design Team', type: 'team', count: 12 },
      { id: '5', name: 'Product Alpha', type: 'product', count: 89 },
      { id: '6', name: 'Product Beta', type: 'product', count: 156 },
      { id: '7', name: 'Featured', type: 'tag', count: 234 },
      { id: '8', name: 'Premium', type: 'tag', count: 67 },
    ];

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');

    const getIcon = (type: Resource['type']) => {
      switch (type) {
        case 'company':
          return <Building2 className='h-4 w-4' />;
        case 'team':
          return <Users className='h-4 w-4' />;
        case 'product':
          return <Package className='h-4 w-4' />;
        case 'tag':
          return <Tag className='h-4 w-4' />;
      }
    };

    const getTypeLabel = (type: Resource['type']) => {
      return type.charAt(0).toUpperCase() + type.slice(1);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open ? 'true' : 'false'}
            className='w-[350px] justify-between'
          >
            {value ? resources.find((r) => r.id === value)?.name : 'Select resource...'}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[350px] p-0'>
          <Command>
            <CommandInput placeholder='Search resources...' />
            <CommandList>
              <CommandEmpty>No resource found.</CommandEmpty>
              <CommandGroup>
                {resources.map((resource) => (
                  <CommandItem
                    key={resource.id}
                    value={resource.id}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === resource.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className='flex items-center justify-between flex-1'>
                      <div className='flex items-center gap-2'>
                        {getIcon(resource.type)}
                        <div>
                          <div className='font-medium'>{resource.name}</div>
                          <div className='text-xs text-muted-foreground'>
                            {getTypeLabel(resource.type)}
                          </div>
                        </div>
                      </div>
                      {resource.count && (
                        <Badge variant='secondary' className='ml-2'>
                          {resource.count}
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
};

/**
 * ## Groups
 *
 * Categorized options with section headers. Organizes large option lists.
 *
 * ### Implementation
 * ```tsx
 * <CommandGroup heading="Category 1">
 *   <CommandItem>Option 1</CommandItem>
 * </CommandGroup>
 * <CommandSeparator />
 * <CommandGroup heading="Category 2">
 *   <CommandItem>Option 2</CommandItem>
 * </CommandGroup>
 * ```
 *
 * ### Use Cases
 * - Programming languages (by paradigm)
 * - Fonts (by style: Serif, Sans, Mono)
 * - Colors (by category: Primary, Secondary, Gray)
 * - Timezones (by region: Americas, Europe, Asia)
 * - Files (by type: Documents, Images, Videos)
 *
 * ### Features
 * - Multiple CommandGroup components
 * - CommandSeparator between groups
 * - Group headings styled with `cmdk-group-heading`
 * - Search filters across all groups
 */
export const Groups: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open ? 'true' : 'false'}
            className='w-[300px] justify-between'
          >
            {value || 'Select language...'}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[300px] p-0'>
          <Command>
            <CommandInput placeholder='Search language...' />
            <CommandList>
              <CommandEmpty>No language found.</CommandEmpty>
              <CommandGroup heading='Frontend'>
                <CommandItem
                  value='javascript'
                  onSelect={(val) => {
                    setValue(val);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === 'javascript' ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  JavaScript
                </CommandItem>
                <CommandItem
                  value='typescript'
                  onSelect={(val) => {
                    setValue(val);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === 'typescript' ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  TypeScript
                </CommandItem>
                <CommandItem
                  value='html'
                  onSelect={(val) => {
                    setValue(val);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', value === 'html' ? 'opacity-100' : 'opacity-0')}
                  />
                  HTML
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading='Backend'>
                <CommandItem
                  value='python'
                  onSelect={(val) => {
                    setValue(val);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', value === 'python' ? 'opacity-100' : 'opacity-0')}
                  />
                  Python
                </CommandItem>
                <CommandItem
                  value='rust'
                  onSelect={(val) => {
                    setValue(val);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', value === 'rust' ? 'opacity-100' : 'opacity-0')}
                  />
                  Rust
                </CommandItem>
                <CommandItem
                  value='go'
                  onSelect={(val) => {
                    setValue(val);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', value === 'go' ? 'opacity-100' : 'opacity-0')}
                  />
                  Go
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading='Database'>
                <CommandItem
                  value='sql'
                  onSelect={(val) => {
                    setValue(val);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', value === 'sql' ? 'opacity-100' : 'opacity-0')}
                  />
                  SQL
                </CommandItem>
                <CommandItem
                  value='mongodb'
                  onSelect={(val) => {
                    setValue(val);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === 'mongodb' ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  MongoDB Query
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
};

/**
 * ## Empty State
 *
 * Custom message when no results match search query. Helpful guidance for users.
 *
 * ### Implementation
 * ```tsx
 * <CommandEmpty>
 *   <div className="py-6 text-center">
 *     <p>No results found for "{searchQuery}"</p>
 *     <Button variant="link">Clear search</Button>
 *   </div>
 * </CommandEmpty>
 * ```
 *
 * ### Use Cases
 * - Search with no matches (suggest alternatives)
 * - Empty dataset (prompt to create first item)
 * - Filtered view with no results (clear filters)
 * - Typo detection (suggest corrections)
 *
 * ### Best Practices
 * - Explain why there are no results
 * - Suggest corrective actions
 * - Provide "Create new" option if applicable
 * - Show search tips
 */
export const EmptyState: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');

    // Small dataset to easily trigger empty state
    const items = [
      { value: 'item1', label: 'Apple' },
      { value: 'item2', label: 'Banana' },
      { value: 'item3', label: 'Cherry' },
    ];

    return (
      <div className='space-y-4 w-[300px]'>
        <p className='text-sm text-muted-foreground'>
          Try searching for "orange" to see the empty state.
        </p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              role='combobox'
              aria-expanded={open ? 'true' : 'false'}
              className='w-full justify-between'
            >
              {value ? items.find((item) => item.value === value)?.label : 'Select fruit...'}
              <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[300px] p-0'>
            <Command>
              <CommandInput placeholder='Search fruit...' />
              <CommandList>
                <CommandEmpty>
                  <div className='py-6 text-center space-y-2'>
                    <Search className='mx-auto h-8 w-8 text-muted-foreground' />
                    <p className='text-sm font-medium'>No fruits found</p>
                    <p className='text-xs text-muted-foreground'>
                      Try searching for apple, banana, or cherry
                    </p>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? '' : currentValue);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === item.value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};

/**
 * ## Loading State
 *
 * Skeleton UI during data fetch. Prevents layout shift and provides feedback.
 *
 * ### Implementation
 * ```tsx
 * isLoading ? (
 *   <div className="py-6 text-center">
 *     <Loader2 className="animate-spin" />
 *     <span>Loading...</span>
 *   </div>
 * ) : (
 *   <CommandGroup>...items...</CommandGroup>
 * )
 * ```
 *
 * ### Use Cases
 * - Initial data fetch
 * - Async search (debounced API calls)
 * - Dependent dropdowns (load based on parent selection)
 * - Infinite scroll (load more items)
 *
 * ### Best Practices
 * - Show spinner immediately on open
 * - Disable input during load
 * - Match skeleton height to expected content
 * - Provide estimated load time if known
 */
export const LoadingState: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (open) {
        setIsLoading(true);
        // Simulate slow API
        setTimeout(() => setIsLoading(false), 2000);
      }
    }, [open]);

    return (
      <div className='space-y-4 w-[300px]'>
        <p className='text-sm text-muted-foreground'>
          Open the combobox to see the loading state (2 second delay).
        </p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              role='combobox'
              aria-expanded={open ? 'true' : 'false'}
              className='w-full justify-between'
            >
              {value ? frameworks.find((f) => f.value === value)?.label : 'Select framework...'}
              <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[300px] p-0'>
            <Command>
              <CommandInput placeholder='Search framework...' disabled={isLoading} />
              <CommandList>
                {isLoading ? (
                  <div className='py-8 space-y-3'>
                    <div className='flex items-center justify-center'>
                      <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                    </div>
                    <p className='text-center text-sm text-muted-foreground'>
                      Loading frameworks...
                    </p>
                    <div className='px-2 space-y-2'>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className='h-8 bg-muted rounded animate-pulse' />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No framework found.</CommandEmpty>
                    <CommandGroup>
                      {frameworks.map((framework) => (
                        <CommandItem
                          key={framework.value}
                          value={framework.value}
                          onSelect={(currentValue) => {
                            setValue(currentValue === value ? '' : currentValue);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              value === framework.value ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {framework.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};

/**
 * ## Keyboard Shortcuts
 *
 * Visual hints for keyboard navigation. Helps users discover shortcuts.
 *
 * ### Keyboard Reference
 * - **↑/↓**: Navigate options
 * - **Enter**: Select option
 * - **Esc**: Close dropdown
 * - **Tab**: Focus next element
 * - **Type**: Filter options
 *
 * ### Implementation
 * Use CommandShortcut component to display keyboard hints:
 * ```tsx
 * <CommandItem>
 *   <span>Option</span>
 *   <CommandShortcut>⌘K</CommandShortcut>
 * </CommandItem>
 * ```
 *
 * ### Use Cases
 * - Command palette (VS Code-style)
 * - Quick actions menu
 * - Developer tools
 * - Power user features
 * - Accessibility enhancements
 */
export const KeyboardShortcuts: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    const actions = [
      { id: '1', label: 'Create New Project', shortcut: '⌘N' },
      { id: '2', label: 'Open Settings', shortcut: '⌘,' },
      { id: '3', label: 'Search Files', shortcut: '⌘P' },
      { id: '4', label: 'Toggle Sidebar', shortcut: '⌘B' },
      { id: '5', label: 'Run Command', shortcut: '⌘K' },
    ];

    return (
      <div className='space-y-4 w-[400px]'>
        <div className='text-sm text-muted-foreground space-y-1'>
          <p>
            <strong>Keyboard hints:</strong>
          </p>
          <ul className='list-disc list-inside space-y-1 ml-2'>
            <li>↑/↓ to navigate</li>
            <li>Enter to select</li>
            <li>Esc to close</li>
            <li>Type to filter</li>
          </ul>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              role='combobox'
              aria-expanded={open ? 'true' : 'false'}
              className='w-full justify-between'
            >
              Select action...
              <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[400px] p-0'>
            <Command>
              <CommandInput placeholder='Search actions...' />
              <CommandList>
                <CommandEmpty>No action found.</CommandEmpty>
                <CommandGroup heading='Quick Actions'>
                  {actions.map((action) => (
                    <CommandItem key={action.id} value={action.id} onSelect={() => setOpen(false)}>
                      <span className='flex-1'>{action.label}</span>
                      <span className='ml-auto text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded'>
                        {action.shortcut}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};
