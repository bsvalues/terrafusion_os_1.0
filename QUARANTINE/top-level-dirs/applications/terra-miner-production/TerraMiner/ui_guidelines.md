# TerraMiner UI Guidelines

## Overview
This document provides guidelines for implementing TerraMiner's UI components using our Tailwind CSS-based design system. The guidelines ensure a consistent look and feel across all application interfaces while supporting both light and dark modes.

## UI Pattern Library
A live pattern library is available at `/ui/dev/patterns`. This resource contains interactive examples of all UI components with support for both light and dark modes.

### Key Features
- **Dark/Light Mode Support**: All components are designed to work seamlessly in both dark and light modes
- **Responsive Design**: Components are responsive by default and adjust appropriately for different screen sizes
- **Accessibility**: Components follow accessibility best practices

## Component Usage Guidelines

### Base Components

#### Buttons
```html
<!-- Primary Button -->
<button class="btn-primary">Primary Action</button>

<!-- Secondary Button -->
<button class="btn-secondary">Secondary Action</button>

<!-- Success Button -->
<button class="btn-success">Success Action</button>

<!-- Warning Button -->
<button class="btn-warning">Warning Action</button>

<!-- Danger Button -->
<button class="btn-danger">Danger Action</button>

<!-- Outline Button -->
<button class="btn-outline">Outline Action</button>

<!-- Link Button -->
<button class="btn-link">Link Style Action</button>

<!-- Size Variants -->
<button class="btn-primary btn-sm">Small Button</button>
<button class="btn-primary">Default Size</button>
<button class="btn-primary btn-lg">Large Button</button>

<!-- Button with Icon -->
<button class="btn-primary flex items-center">
    <svg class="h-5 w-5 mr-2" ...>...</svg>
    With Icon
</button>
```

#### Cards
```html
<!-- Card with Header and Footer -->
<div class="card">
    <div class="card-header">
        <h3 class="text-md font-medium text-secondary-800 dark:text-secondary-200">Card Title</h3>
    </div>
    <div class="card-body">
        <p class="text-secondary-700 dark:text-secondary-300">Card content goes here.</p>
    </div>
    <div class="card-footer">
        <div class="flex justify-end">
            <button class="btn-primary">Action</button>
        </div>
    </div>
</div>

<!-- Simple Card -->
<div class="card">
    <div class="card-body">
        <h3 class="text-lg font-medium mb-2 text-secondary-800 dark:text-secondary-200">Simple Card</h3>
        <p class="text-secondary-700 dark:text-secondary-300">Content with no header or footer.</p>
    </div>
</div>
```

#### Stat Cards
```html
<!-- Stat Card -->
<div class="stat-card">
    <div class="stat-title">Metric Name</div>
    <div class="stat-value">123,456</div>
    <div class="stat-desc">
        <span class="stat-trend-up">↑ 14%</span> from last period
    </div>
</div>

<!-- Negative Trend Stat Card -->
<div class="stat-card">
    <div class="stat-title">Negative Metric</div>
    <div class="stat-value">89%</div>
    <div class="stat-desc">
        <span class="stat-trend-down">↓ 2%</span> from last period
    </div>
</div>
```

#### Forms
```html
<!-- Text Input -->
<div class="form-group">
    <label for="username" class="form-label">Username</label>
    <input type="text" id="username" class="form-input" placeholder="Enter username">
</div>

<!-- Select Box -->
<div class="form-group">
    <label for="country" class="form-label">Country</label>
    <select id="country" class="form-select">
        <option>United States</option>
        <option>Canada</option>
    </select>
</div>

<!-- Checkbox -->
<div class="form-group">
    <div class="flex items-start">
        <div class="flex items-center h-5">
            <input id="terms" type="checkbox" class="form-checkbox">
        </div>
        <div class="ml-3 text-sm">
            <label for="terms" class="font-medium text-secondary-700 dark:text-secondary-300">
                I agree to the terms
            </label>
        </div>
    </div>
</div>
```

#### Tables
```html
<div class="table-container">
    <table class="table">
        <thead class="table-header">
            <tr>
                <th scope="col" class="table-header-cell">Name</th>
                <th scope="col" class="table-header-cell">Status</th>
            </tr>
        </thead>
        <tbody class="table-body">
            <tr class="table-row">
                <td class="table-cell">Item Name</td>
                <td class="table-cell">
                    <span class="badge-success">Active</span>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

#### Badges
```html
<!-- Badge Variants -->
<span class="badge-primary">Primary</span>
<span class="badge-secondary">Secondary</span>
<span class="badge-success">Success</span>
<span class="badge-warning">Warning</span>
<span class="badge-danger">Danger</span>

<!-- Badge with Dot -->
<span class="badge-primary">
    <svg class="-ml-0.5 mr-1.5 h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
        <circle cx="4" cy="4" r="3" />
    </svg>
    With Dot
</span>
```

#### Alerts
```html
<!-- Information Alert -->
<div class="alert-info flex">
    <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-primary-400" ...>...</svg>
    </div>
    <div class="ml-3">
        <h3 class="text-sm font-medium text-primary-800 dark:text-primary-300">Information</h3>
        <div class="mt-2 text-sm text-primary-700 dark:text-primary-200">
            <p>This is an informational message.</p>
        </div>
    </div>
</div>

<!-- Success Alert -->
<div class="alert-success flex">
    <!-- Similar structure to info alert, with appropriate colors -->
</div>

<!-- Warning Alert -->
<div class="alert-warning flex">
    <!-- Similar structure to info alert, with appropriate colors -->
</div>

<!-- Error Alert -->
<div class="alert-danger flex">
    <!-- Similar structure to info alert, with appropriate colors -->
</div>
```

#### Toasts
Toasts can be implemented using the JavaScript functions provided in the pattern library:

```javascript
// Show a toast notification
function showToast(id) {
    const toast = document.getElementById(id);
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.remove('translate-y-[-100%]', 'opacity-0');
    }, 10);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideToast(id);
    }, 5000);
}

// Hide a toast notification
function hideToast(id) {
    const toast = document.getElementById(id);
    toast.classList.add('translate-y-[-100%]', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 300);
}
```

## Dark Mode Implementation

### Toggling Dark Mode
```javascript
// Check for user preference in localStorage
const userTheme = localStorage.getItem('theme');
// Check system preference
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

// Set initial theme
if (userTheme === 'dark' || (!userTheme && systemTheme === 'dark')) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

// Toggle between light and dark mode
function toggleDarkMode() {
    if (document.documentElement.classList.contains('dark')) {
        // Switch to light mode
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        // Switch to dark mode
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}
```

### Dark Mode Classes
Always include dark mode variants for text and background colors:

```html
<div class="text-secondary-900 dark:text-white bg-white dark:bg-secondary-800">
    This content adapts to both light and dark modes
</div>
```

## Best Practices

1. **Use Utility Classes Consistently**: Stick to the predefined utility classes for spacing, typography, and colors to maintain consistency.

2. **Component Composition**: Compose complex UI elements from simpler ones. For example, a dashboard card might combine a card, stats, and badges.

3. **Responsive Design**: Always consider how components will appear on different screen sizes. Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) as needed.

4. **Dark Mode Support**: Always include dark mode variants for text and background colors.

5. **Use Helper Functions**: Use the provided helper functions for showing/hiding toasts and toggling dark mode.

6. **Accessibility**: Ensure all interactive elements are keyboard navigable and have appropriate ARIA attributes when needed.

7. **SVG Icons**: Prefer inline SVG icons over icon fonts for better performance and more styling control.

## Template Guide

When creating new page templates, consider using this structure for consistency:

```html
{% extends "unified_base.html" %}

{% block title %}Page Title{% endblock %}

{% block content %}
<div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6 text-secondary-900 dark:text-white">Page Heading</h1>
    
    <!-- Page content goes here -->
    <div class="card">
        <div class="card-header">
            <h2 class="text-lg font-medium text-secondary-900 dark:text-white">Section Title</h2>
        </div>
        <div class="card-body">
            <!-- Section content -->
        </div>
    </div>
</div>
{% endblock %}
```

## Conclusion

Following these guidelines will help create a consistent, accessible, and visually appealing user interface for the TerraMiner application. Refer to the live pattern library at `/ui/dev/patterns` to see interactive examples of all components.