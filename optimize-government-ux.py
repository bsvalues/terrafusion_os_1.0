#!/usr/bin/env python3
"""
Government UX Optimization Script - TerraFusion OS
Implements comprehensive Section 508 compliance and government-specific UX improvements
"""

import os
import re
from pathlib import Path

# TerraFusion Brand Colors and Standards
TERRAFUSION_BRAND = {
    'colors': {
        'primary': '#0099ff',
        'primary_dark': '#0077cc',
        'accent': '#00ffaa',
        'accent_dark': '#00cc88',
        'transcend': '#00ffee',
        'dark': '#0b1020',
        'dark_lighter': '#1a1f3a'
    },
    'taglines': [
        'Government. Transcended.',
        'Turn Complexity into Clarity.'
    ]
}

# Section 508 Accessibility CSS
ACCESSIBILITY_CSS = """
        /* Skip Navigation for Screen Readers */
        .skip-nav {
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--tf-primary);
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 0 0 8px 8px;
            z-index: 1000;
            font-weight: bold;
        }

        .skip-nav:focus {
            top: 0;
        }

        /* High Contrast Mode */
        .high-contrast {
            --tf-primary: #ffffff;
            --tf-primary-dark: #ffffff;
            --tf-accent: #ffff00;
            --tf-accent-dark: #ffff00;
            --tf-transcend: #00ffff;
            --tf-dark: #000000;
            --tf-dark-lighter: #000000;
            --tf-light: #ffffff;
            --tf-gray: #ffffff;
            --tf-gray-light: #ffffff;
        }

        /* Accessibility Controls */
        .accessibility-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            padding: 1rem;
            border-radius: 8px;
            border: 2px solid var(--tf-primary);
        }

        .accessibility-btn {
            background: var(--tf-primary);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            margin: 0.25rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }

        .accessibility-btn:hover,
        .accessibility-btn:focus {
            background: var(--tf-primary-dark);
            outline: 2px solid var(--tf-accent);
            outline-offset: 2px;
        }

        /* Government Keyboard Shortcuts */
        .keyboard-shortcuts {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: var(--tf-light);
            padding: 1rem;
            border-radius: 8px;
            font-size: 0.8rem;
            border: 1px solid var(--tf-primary);
            max-width: 300px;
            display: none;
        }

        .keyboard-shortcuts.show {
            display: block;
        }

        .shortcut-key {
            background: var(--tf-primary);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-weight: bold;
        }

        /* Breadcrumb Navigation */
        .breadcrumb {
            background: rgba(0, 0, 0, 0.3);
            padding: 0.75rem 2rem;
            border-bottom: 1px solid var(--tf-primary);
        }

        .breadcrumb nav {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--tf-gray-light);
        }

        .breadcrumb a {
            color: var(--tf-accent);
            text-decoration: none;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            transition: all 0.3s ease;
        }

        .breadcrumb a:hover,
        .breadcrumb a:focus {
            background: rgba(0, 255, 170, 0.2);
            outline: 2px solid var(--tf-accent);
            outline-offset: 2px;
        }

        .breadcrumb .separator {
            color: var(--tf-gray);
        }

        /* Focus Management */
        .focus-visible:focus {
            outline: 3px solid var(--tf-accent);
            outline-offset: 2px;
        }

        /* Screen Reader Only Content */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }

        /* Enhanced Line Height for Government Standards */
        body {
            line-height: 1.6;
            font-size: 16px;
        }
"""

# Accessibility HTML Structure
ACCESSIBILITY_HTML = """    <!-- Skip Navigation for Screen Readers -->
    <a href="#main-content" class="skip-nav">Skip to main content</a>
    
    <!-- Accessibility Controls -->
    <div class="accessibility-controls" role="toolbar" aria-label="Accessibility options">
        <h3 class="sr-only">Accessibility Controls</h3>
        <button class="accessibility-btn" onclick="toggleHighContrast()" aria-label="Toggle high contrast mode">
            High Contrast
        </button>
        <button class="accessibility-btn" onclick="increaseFontSize()" aria-label="Increase font size">
            A+
        </button>
        <button class="accessibility-btn" onclick="decreaseFontSize()" aria-label="Decrease font size">
            A-
        </button>
        <button class="accessibility-btn" onclick="toggleKeyboardShortcuts()" aria-label="Show keyboard shortcuts">
            Help
        </button>
    </div>

    <!-- Keyboard Shortcuts Help -->
    <div class="keyboard-shortcuts" id="shortcuts-panel" role="dialog" aria-labelledby="shortcuts-title">
        <h3 id="shortcuts-title">Government Portal Keyboard Shortcuts</h3>
        <p><span class="shortcut-key">Alt + 1</span> - Main Content</p>
        <p><span class="shortcut-key">Alt + 2</span> - Navigation</p>
        <p><span class="shortcut-key">Alt + 3</span> - Search</p>
        <p><span class="shortcut-key">Alt + H</span> - Help</p>
        <p><span class="shortcut-key">Alt + K</span> - Toggle Shortcuts</p>
        <p><span class="shortcut-key">Esc</span> - Close dialogs</p>
        <button class="accessibility-btn" onclick="toggleKeyboardShortcuts()" style="margin-top: 1rem;">Close</button>
    </div>

    <!-- Live Region for Screen Reader Announcements -->
    <div id="sr-announcements" class="sr-only" aria-live="polite" aria-atomic="true"></div>"""

# Government Accessibility JavaScript
ACCESSIBILITY_JS = """
        // Government Portal Keyboard Shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.altKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        focusMainContent();
                        break;
                    case '2':
                        e.preventDefault();
                        focusNavigation();
                        break;
                    case '3':
                        e.preventDefault();
                        focusSearch();
                        break;
                    case 'h':
                        e.preventDefault();
                        toggleKeyboardShortcuts();
                        break;
                    case 'k':
                        e.preventDefault();
                        toggleKeyboardShortcuts();
                        break;
                }
            }
            
            // Escape key handling
            if (e.key === 'Escape') {
                closeDialogs();
            }
        });

        // Accessibility Functions
        let fontSize = 16;
        let highContrastMode = false;

        function toggleHighContrast() {
            highContrastMode = !highContrastMode;
            document.body.classList.toggle('high-contrast', highContrastMode);
            announceToScreenReader(highContrastMode ? 'High contrast mode enabled' : 'High contrast mode disabled');
        }

        function increaseFontSize() {
            fontSize = Math.min(fontSize + 2, 24);
            document.documentElement.style.fontSize = fontSize + 'px';
            announceToScreenReader(`Font size increased to ${fontSize} pixels`);
        }

        function decreaseFontSize() {
            fontSize = Math.max(fontSize - 2, 12);
            document.documentElement.style.fontSize = fontSize + 'px';
            announceToScreenReader(`Font size decreased to ${fontSize} pixels`);
        }

        function toggleKeyboardShortcuts() {
            const panel = document.getElementById('shortcuts-panel');
            const isVisible = panel.classList.contains('show');
            
            if (isVisible) {
                panel.classList.remove('show');
                announceToScreenReader('Keyboard shortcuts help closed');
            } else {
                panel.classList.add('show');
                announceToScreenReader('Keyboard shortcuts help opened');
                panel.focus();
            }
        }

        function focusMainContent() {
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.focus();
                announceToScreenReader('Focused on main content');
            }
        }

        function focusNavigation() {
            const nav = document.querySelector('[role="navigation"]');
            if (nav) {
                nav.focus();
                announceToScreenReader('Focused on navigation');
            }
        }

        function focusSearch() {
            const searchElement = document.querySelector('input[type="search"], input[type="text"]');
            if (searchElement) {
                searchElement.focus();
                announceToScreenReader('Focused on search');
            } else {
                announceToScreenReader('No search field available on this page');
            }
        }

        function closeDialogs() {
            const shortcuts = document.getElementById('shortcuts-panel');
            if (shortcuts.classList.contains('show')) {
                shortcuts.classList.remove('show');
                announceToScreenReader('Dialog closed');
            }
        }

        function announceToScreenReader(message) {
            const announcements = document.getElementById('sr-announcements');
            announcements.textContent = message;
            
            setTimeout(() => {
                announcements.textContent = '';
            }, 1000);
        }

        // Initialize accessibility features
        document.addEventListener('DOMContentLoaded', function() {
            const skipLink = document.querySelector('.skip-nav');
            if (skipLink) {
                skipLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    focusMainContent();
                });
            }

            announceToScreenReader('TerraFusion Government Portal loaded');
            
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.setAttribute('tabindex', '-1');
            }
        });
"""

def optimize_government_portal(portal_path):
    """Optimize a government portal for Section 508 compliance and UX"""
    print(f"🎯 Optimizing {portal_path}...")
    
    with open(portal_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add comprehensive meta tags
    meta_description = f"TerraFusion {portal_path.stem.replace('-', ' ').title()} Portal for Benton County - Government. Transcended. Turn Complexity into Clarity."
    
    # Enhanced meta tags
    enhanced_head = f'''<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{meta_description}">
    <meta name="keywords" content="TerraFusion, {portal_path.stem.replace('-', ' ')}, Benton County, government portal, accessibility">
    <meta name="author" content="TerraFusion OS - Government Solutions">
    <meta name="robots" content="noindex, nofollow">
    <meta property="og:title" content="TerraFusion {portal_path.stem.replace('-', ' ').title()} Portal">
    <meta property="og:description" content="Advanced government {portal_path.stem.replace('-', ' ')} system for Benton County">
    <meta property="og:type" content="website">'''
    
    # Replace head section
    content = re.sub(r'<head>.*?(?=<title)', enhanced_head, content, flags=re.DOTALL)
    
    # Add accessibility CSS to existing styles
    if '/* TerraFusion Brand Colors */' in content:
        content = content.replace('/* TerraFusion Brand Colors */', 
                                 '/* TerraFusion Brand Colors */\n' + ACCESSIBILITY_CSS)
    
    # Add accessibility structure after <body>
    content = re.sub(r'(<body>)', r'\1\n' + ACCESSIBILITY_HTML, content)
    
    # Add breadcrumb navigation before main content
    breadcrumb_html = f'''
    <!-- Breadcrumb Navigation -->
    <div class="breadcrumb" role="navigation" aria-label="Breadcrumb">
        <nav>
            <a href="#" tabindex="0">TerraFusion OS</a>
            <span class="separator" aria-hidden="true">→</span>
            <a href="#" tabindex="0">Government Portals</a>
            <span class="separator" aria-hidden="true">→</span>
            <span aria-current="page">{portal_path.stem.replace('-', ' ').title()}</span>
        </nav>
    </div>
    '''
    
    # Add breadcrumb before header if not present
    if 'breadcrumb' not in content:
        content = re.sub(r'(<header)', breadcrumb_html + r'\1', content)
    
    # Add brand taglines to header if not present
    if 'Government. Transcended.' not in content:
        tagline_html = '''
            <div class="taglines">
                <p>Government. Transcended. • Turn Complexity into Clarity.</p>
            </div>'''
        content = re.sub(r'(</header>)', tagline_html + r'\1', content)
    
    # Enhance main content with ARIA landmarks
    content = re.sub(r'(<div class="container">)', 
                    r'\1\n        <main id="main-content" role="main" tabindex="-1">', content)
    content = re.sub(r'(</div>\s*</body>)', r'        </main>\n\1', content)
    
    # Add accessibility JavaScript before closing script tag
    js_insertion = content.rfind('</script>')
    if js_insertion != -1:
        content = content[:js_insertion] + ACCESSIBILITY_JS + content[js_insertion:]
    
    # Write optimized content
    with open(portal_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Optimized {portal_path}")

def main():
    """Main optimization function"""
    print("🚀 Starting Government UX Optimization...")
    print("📋 Implementing Section 508 compliance across all government portals")
    
    # Find all government portals
    current_dir = Path('.')
    portal_files = [
        'emergency-management-portal.html',
        'parks-recreation-portal.html', 
        'smart-transportation-portal.html'
    ]
    
    optimized_count = 0
    
    for portal_file in portal_files:
        portal_path = current_dir / portal_file
        if portal_path.exists():
            optimize_government_portal(portal_path)
            optimized_count += 1
        else:
            print(f"⚠️ Portal not found: {portal_file}")
    
    print(f"\n🎉 Government UX Optimization Complete!")
    print(f"📊 Optimized {optimized_count} government portals")
    print("🎯 Section 508 compliance features added:")
    print("   • Skip navigation links")
    print("   • High contrast mode toggle")
    print("   • Font size controls")
    print("   • Keyboard shortcuts")
    print("   • ARIA landmarks and labels")
    print("   • Screen reader announcements")
    print("   • Breadcrumb navigation")
    print("   • Focus management")
    print("   • Government accessibility standards")
    print("\n💼 Government. Transcended. • Turn Complexity into Clarity.")

if __name__ == "__main__":
    main()