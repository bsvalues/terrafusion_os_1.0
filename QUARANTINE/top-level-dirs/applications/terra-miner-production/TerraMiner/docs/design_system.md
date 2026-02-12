# TerraMiner UI Design System

This document outlines the UI components, styles, and patterns that make up the TerraMiner design system. It serves as a reference for maintaining consistency across the application.

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing](#spacing)
4. [Components](#components)
5. [Loading States](#loading-states)
6. [Error States](#error-states)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Usage Guidelines](#usage-guidelines)

## Color Palette

### Primary Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Dark Blue  | `#0d1b2a` | Primary background for unified theme |
| Blue       | `#1b263b` | Secondary background, card headers |
| Light Blue | `#415a77` | Tertiary elements, borders |
| Pale Blue  | `#778da9` | Muted text, icons |
| Teal       | `#00b4d8` | Primary accent color, buttons, links |
| Dark Teal  | `#0096c7` | Button hover states |
| Light Gray | `#e0e1dd` | Light text on dark backgrounds |

### Semantic Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Success    | `#28a745` | Positive actions, success states |
| Warning    | `#ffc107` | Warning states, caution indicators |
| Danger     | `#dc3545` | Error states, destructive actions |
| Info       | `#17a2b8` | Informational states, help text |

## Typography

The application uses system fonts for optimal performance and native feel:

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", 
             "Segoe UI Emoji", "Segoe UI Symbol";
```

### Font Sizes

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1      | 2rem | 700    | 1.2         |
| H2      | 1.75rem | 700 | 1.2         |
| H3      | 1.5rem | 600  | 1.3         |
| H4      | 1.25rem | 600 | 1.3         |
| H5      | 1.1rem | 600  | 1.4         |
| Body    | 1rem | 400    | 1.5         |
| Small   | 0.875rem | 400 | 1.4        |

### Font Weights

- Regular: 400
- Semibold: 600
- Bold: 700

## Spacing

The application uses a consistent spacing scale:

| Size | Value | Usage |
|------|-------|-------|
| xs   | 0.25rem (4px) | Tight spacing, between inline elements |
| sm   | 0.5rem (8px)  | Buttons padding, close spacing |
| md   | 1rem (16px)   | Default spacing, padding, margins |
| lg   | 1.5rem (24px) | Generous spacing, section margins |
| xl   | 2rem (32px)   | Large spacing, section paddings |
| xxl  | 3rem (48px)   | Very large spacing, page sections |

## Components

The TerraMiner UI includes the following reusable components:

### Buttons

- **Primary**: The main action button (Teal in unified theme)
- **Secondary**: Alternative actions
- **Outline**: Less prominent actions
- **Danger**: Destructive actions
- **Link**: Text-based button that looks like a link

Sizes: sm, md, lg

Usage:
```html
{% from 'components/ui_components.html' import button %}
{{ button(text="Submit", type="primary", size="md", icon="check") }}
```

### Cards

Cards are used to group related content and actions.

Usage:
```html
{% from 'components/ui_components.html' import card %}
{% call card(title="Card Title", header_icon="chart-bar") %}
  Card content goes here
{% endcall %}
```

### Alerts

Used to display important messages.

Usage:
```html
{% from 'components/ui_components.html' import alert %}
{{ alert(message="Successfully updated", type="success", icon="check-circle") }}
```

### Tables

For displaying tabular data.

Usage:
```html
{% from 'components/ui_components.html' import data_table %}
{% call data_table(headers=["Name", "Email", "Role"]) %}
  <tr>
    <td>John Doe</td>
    <td>john@example.com</td>
    <td>Admin</td>
  </tr>
{% endcall %}
```

### Badges

For labels and status indicators.

Usage:
```html
{% from 'components/ui_components.html' import badge %}
{{ badge(text="New", type="success", pill=true) }}
```

### Pagination

For navigating between pages of content.

Usage:
```html
{% from 'components/ui_components.html' import pagination %}
{{ pagination(current_page=2, total_pages=10, base_url="/items") }}
```

### Tabs

For organizing content into multiple sections.

Usage:
```html
{% from 'components/ui_components.html' import tab_nav, tab_content %}
{% set tabs = [
  {"id": "overview", "label": "Overview", "icon": "chart-pie"},
  {"id": "details", "label": "Details", "icon": "list-ul"}
] %}

{% call tab_nav(tabs=tabs, active_tab="overview") %}
  {% call tab_content(id="overview", active=true) %}
    Overview content
  {% endcall %}
  
  {% call tab_content(id="details") %}
    Details content
  {% endcall %}
{% endcall %}
```

### Accordion

For collapsible content.

Usage:
```html
{% from 'components/ui_components.html' import accordion %}
{% set items = [
  {"title": "Item 1", "content": "Content for item 1", "icon": "info-circle"},
  {"title": "Item 2", "content": "Content for item 2", "icon": "cog"}
] %}

{{ accordion(id="faq-accordion", items=items) }}
```

### Progress Bar

For showing progress.

Usage:
```html
{% from 'components/ui_components.html' import progress_bar %}
{{ progress_bar(value=75, max=100, type="success", striped=true) }}
```

### Toggle Switch

For binary options.

Usage:
```html
{% from 'components/ui_components.html' import toggle_switch %}
{{ toggle_switch(id="notifications", label="Enable notifications", checked=true) }}
```

## Loading States

The application uses several loading state patterns:

### Spinner

For simple loading indicators.

Usage:
```html
{% from 'components/loading_states.html' import spinner %}
{{ spinner(size="lg", color="teal", message="Loading data...") }}
```

### Skeleton Loaders

For content placeholders during loading.

Types:
- Text skeletons
- Card skeletons
- Table skeletons
- List skeletons
- Chart skeletons
- Property card skeletons

Usage:
```html
{% from 'components/loading_states.html' import skeleton_text, skeleton_card %}
{{ skeleton_text(lines=3) }}
{{ skeleton_card() }}
```

## Error States

Standard error state components for consistent error handling.

### Error Card

For displaying errors.

Usage:
```html
{% from 'components/error_states.html' import error_card %}
{{ error_card(title="Error Loading Data", message="Could not connect to the server.") }}
```

### Empty State

For when no content is available.

Usage:
```html
{% from 'components/error_states.html' import empty_state %}
{{ empty_state(title="No Properties", message="No properties match your search criteria.") }}
```

### No Results

For search with no results.

Usage:
```html
{% from 'components/error_states.html' import no_results %}
{{ no_results(search_term="beach house") }}
```

### Network Error

For connectivity issues.

Usage:
```html
{% from 'components/error_states.html' import network_error %}
{{ network_error() }}
```

### Permission Error

For access control errors.

Usage:
```html
{% from 'components/error_states.html' import permission_error %}
{{ permission_error() }}
```

## Responsive Design

The application follows a mobile-first approach using Bootstrap's responsive grid system. Key breakpoints:

- xs: < 576px (Mobile phones)
- sm: ≥ 576px (Large phones, small tablets)
- md: ≥ 768px (Tablets)
- lg: ≥ 992px (Desktops)
- xl: ≥ 1200px (Large desktops)
- xxl: ≥ 1400px (Extra large desktops)

## Accessibility

The TerraMiner UI follows these accessibility principles:

- Sufficient color contrast (WCAG AA compliance)
- Keyboard navigation support
- Appropriate ARIA attributes
- Screen reader compatible markup
- Focus management for interactive elements

## Usage Guidelines

### UI Template Switching

The application supports two UI templates:
1. **Legacy**: The original light theme
2. **Unified**: The new dark blue theme with teal accents

Template switching is done by appending `?ui=unified` or `?ui=legacy` to URLs or by setting a user preference.

In templates, use conditional classes based on the current template:

```html
<div class="card {% if ui_template == 'unified' %}bg-dark-blue text-white border-0 shadow{% endif %}">
  ...
</div>
```

### Icon Usage

The application uses Font Awesome 5 for icons. For consistency, use icons from this set.

Common icon usage patterns:
- Action buttons should include appropriate icons
- Section headers may include icons
- Status indicators should use semantic icons

### Form Elements

Form inputs should:
- Have associated labels
- Include placeholder text when appropriate
- Display validation errors clearly
- Use consistent styling between forms

### Data Visualization

Charts and graphs should:
- Use the defined color palette
- Include proper labels and legends
- Be responsive to different screen sizes
- Include appropriate loading states and error handling