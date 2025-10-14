import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './separator';

/**
 * The Separator component visually or semantically separates content sections.
 * Built on Radix UI primitives for proper accessibility.
 * 
 * ## Features
 * - Horizontal and vertical orientations
 * - Decorative or semantic (ARIA separator role)
 * - Customizable color, thickness, and length
 * - Works in flex and grid layouts
 * - Proper ARIA attributes for screen readers
 * - No JavaScript required
 * 
 * ## Usage
 * ```tsx
 * import { Separator } from '@/components/ui/separator';
 * 
 * // Horizontal separator (default)
 * <Separator />
 * 
 * // Vertical separator
 * <Separator orientation="vertical" />
 * 
 * // Semantic separator (non-decorative)
 * <Separator decorative={false} />
 * ```
 * 
 * ## When to Use
 * - Between sections of content in a list or menu
 * - To divide navigation items
 * - Between toolbar buttons or action groups
 * - In cards or panels to separate header/content/footer
 * - Between form sections
 * 
 * ## Accessibility
 * - decorative={true} (default): Purely visual, hidden from screen readers
 * - decorative={false}: Semantic separator with role="separator"
 * - Use decorative for visual spacing, semantic for content structure
 * - Proper ARIA orientation attribute (horizontal/vertical)
 */
const meta = {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A separator component for dividing content sections with horizontal or vertical lines. Supports both decorative and semantic modes.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the separator'
    },
    decorative: {
      control: 'boolean',
      description: 'Whether the separator is purely decorative or semantic'
    }
  }
} satisfies Meta<typeof Separator>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default horizontal separator
 */
export const Default: Story = {
  render: () => <div style={{
    maxWidth: '600px'
  }}>
      <div style={{
      padding: '16px 0'
    }}>
        <h3 className="font-semibold">
          Section One
        </h3>
        <p style={{
        fontSize: '14px',
        color: '#888',
        lineHeight: '1.6'
      }}>
          This is the first section of content. The separator below divides it from the
          next section.
        </p>
      </div>
      
      <Separator />
      
      <div style={{
      padding: '16px 0'
    }}>
        <h3 className="font-semibold">
          Section Two
        </h3>
        <p style={{
        fontSize: '14px',
        color: '#888',
        lineHeight: '1.6'
      }}>
          This is the second section, visually separated from the first section above.
        </p>
      </div>
    </div>
};

/**
 * Vertical separator for inline content
 */
export const Vertical: Story = {
  render: () => <div className="flex items-center">
      <span style={{
      fontSize: '14px',
      fontWeight: 500
    }}>Home</span>
      <Separator orientation="vertical" style={{
      height: '20px'
    }} />
      <span style={{
      fontSize: '14px',
      fontWeight: 500
    }}>About</span>
      <Separator orientation="vertical" style={{
      height: '20px'
    }} />
      <span style={{
      fontSize: '14px',
      fontWeight: 500
    }}>Services</span>
      <Separator orientation="vertical" style={{
      height: '20px'
    }} />
      <span style={{
      fontSize: '14px',
      fontWeight: 500
    }}>Contact</span>
    </div>
};

/**
 * Horizontal and vertical separators together
 */
export const Orientations: Story = {
  render: () => <div style={{
    maxWidth: '800px'
  }}>
      {/* Horizontal Example */}
      <div style={{
      marginBottom: '32px'
    }}>
        <h3 className="font-semibold">
          Horizontal Separator
        </h3>
        <div>
          <p style={{
          fontSize: '14px',
          marginBottom: '12px'
        }}>Content above</p>
          <Separator />
          <p style={{
          fontSize: '14px',
          marginTop: '12px'
        }}>Content below</p>
        </div>
      </div>

      {/* Vertical Example */}
      <div>
        <h3 className="font-semibold">
          Vertical Separator
        </h3>
        <div className="flex items-center">
          <div style={{
          fontSize: '14px'
        }}>Left content</div>
          <Separator orientation="vertical" style={{
          height: '40px'
        }} />
          <div style={{
          fontSize: '14px'
        }}>Right content</div>
        </div>
      </div>
    </div>
};

/**
 * Separator with text labels (custom implementation)
 */
export const WithText: Story = {
  render: () => <div style={{
    maxWidth: '600px'
  }}>
      {/* OR Divider */}
      <div className="flex items-center">
        <Separator className="flex-1" />
        <span style={{
        fontSize: '12px',
        color: '#888',
        fontWeight: 500
      }}>OR</span>
        <Separator className="flex-1" />
      </div>

      {/* Section Title */}
      <div className="flex items-center">
        <Separator className="flex-1" />
        <span className="font-semibold">
          FEATURES
        </span>
        <Separator className="flex-1" />
      </div>

      {/* Continue Reading */}
      <div className="flex items-center">
        <Separator className="flex-1" />
        <span style={{
        fontSize: '13px',
        color: '#0099ff',
        fontWeight: 500
      }}>
          Continue Reading
        </span>
        <Separator className="flex-1" />
      </div>
    </div>
};

/**
 * Separators in navigation and toolbars
 */
export const InNavigation: Story = {
  render: () => <div style={{
    maxWidth: '800px'
  }}>
      {/* Horizontal Navigation */}
      <div style={{
      marginBottom: '32px'
    }}>
        <h3 className="font-semibold">
          Horizontal Navigation
        </h3>
        <nav className="flex items-center">
          <a href="#" style={{
          fontSize: '14px',
          color: '#fff',
          textDecoration: 'none',
          fontWeight: 500
        }}>
            Dashboard
          </a>
          <Separator orientation="vertical" style={{
          height: '20px'
        }} />
          <a href="#" style={{
          fontSize: '14px',
          color: '#888',
          textDecoration: 'none'
        }}>
            Projects
          </a>
          <Separator orientation="vertical" style={{
          height: '20px'
        }} />
          <a href="#" style={{
          fontSize: '14px',
          color: '#888',
          textDecoration: 'none'
        }}>
            Team
          </a>
          <Separator orientation="vertical" style={{
          height: '20px'
        }} />
          <a href="#" style={{
          fontSize: '14px',
          color: '#888',
          textDecoration: 'none'
        }}>
            Settings
          </a>
        </nav>
      </div>

      {/* Toolbar with Button Groups */}
      <div>
        <h3 className="font-semibold">
          Toolbar with Separators
        </h3>
        <div className="flex items-center">
          {/* Text Formatting Group */}
          <div className="flex">
            <button className="font-semibold">
              B
            </button>
            <button style={{
            padding: '6px 10px',
            backgroundColor: 'transparent',
            border: '1px solid #2a2a2a',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            fontStyle: 'italic'
          }}>
              I
            </button>
            <button style={{
            padding: '6px 10px',
            backgroundColor: 'transparent',
            border: '1px solid #2a2a2a',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            textDecoration: 'underline'
          }}>
              U
            </button>
          </div>

          <Separator orientation="vertical" style={{
          height: '24px'
        }} />

          {/* Alignment Group */}
          <div className="flex">
            <button style={{
            padding: '6px 10px',
            backgroundColor: 'transparent',
            border: '1px solid #2a2a2a',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '11px'
          }}>
              Left
            </button>
            <button style={{
            padding: '6px 10px',
            backgroundColor: 'transparent',
            border: '1px solid #2a2a2a',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '11px'
          }}>
              Center
            </button>
            <button style={{
            padding: '6px 10px',
            backgroundColor: 'transparent',
            border: '1px solid #2a2a2a',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '11px'
          }}>
              Right
            </button>
          </div>

          <Separator orientation="vertical" style={{
          height: '24px'
        }} />

          {/* Actions Group */}
          <div className="flex">
            <button style={{
            padding: '6px 12px',
            backgroundColor: '#0099ff',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500
          }}>
              Save
            </button>
            <button style={{
            padding: '6px 12px',
            backgroundColor: 'transparent',
            border: '1px solid #2a2a2a',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px'
          }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
};

/**
 * Real-world card layout with separators
 */
export const RealWorldCard: Story = {
  render: () => <div style={{
    maxWidth: '400px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    overflow: 'hidden'
  }}>
      {/* Card Header */}
      <div style={{
      padding: '20px'
    }}>
        <div className="flex items-center">
          <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }} />
          <div className="flex-1">
            <h3 className="font-semibold">
              John Doe
            </h3>
            <p style={{
            fontSize: '13px',
            color: '#888'
          }}>Software Engineer</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Card Content */}
      <div style={{
      padding: '20px'
    }}>
        <p style={{
        fontSize: '14px',
        color: '#ccc',
        lineHeight: '1.6',
        marginBottom: '16px'
      }}>
          Building modern web applications with React, TypeScript, and Node.js. Passionate
          about clean code and great user experiences.
        </p>

        <div className="flex">
          <div>
            <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#0099ff'
          }}>127</div>
            <div style={{
            fontSize: '12px',
            color: '#888'
          }}>Projects</div>
          </div>
          <Separator orientation="vertical" style={{
          height: '44px'
        }} />
          <div>
            <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#0099ff'
          }}>1.2k</div>
            <div style={{
            fontSize: '12px',
            color: '#888'
          }}>Followers</div>
          </div>
          <Separator orientation="vertical" style={{
          height: '44px'
        }} />
          <div>
            <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#0099ff'
          }}>834</div>
            <div style={{
            fontSize: '12px',
            color: '#888'
          }}>Following</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Card Footer */}
      <div className="flex">
        <button className="flex-1">
          Follow
        </button>
        <button className="flex-1">
          Message
        </button>
      </div>
    </div>
};

/**
 * Usage guidelines with Do's and Don'ts
 */
export const UsageGuidelines: Story = {
  render: () => <div style={{
    maxWidth: '1000px',
    padding: '24px'
  }}>
      <h3 className="font-semibold">
        Separator Usage Guidelines
      </h3>

      <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '32px'
    }}>
        {/* DO Section */}
        <div>
          <h4 className="font-semibold flex items-center">
            <span style={{
            fontSize: '20px'
          }}>✓</span> Do
          </h4>
          <ul className="flex">
            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderLeft: '3px solid #22c55e',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Use for content division
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Separate logical sections, navigation groups, or related content areas
              </p>
            </li>

            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderLeft: '3px solid #22c55e',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Use decorative by default
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                For visual spacing, keep decorative={true} to hide from screen readers
              </p>
            </li>

            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderLeft: '3px solid #22c55e',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Match context
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Use horizontal for content flow, vertical for inline elements
              </p>
            </li>

            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderLeft: '3px solid #22c55e',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Use in toolbars and menus
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Group related actions with separators between button groups
              </p>
            </li>
          </ul>
        </div>

        {/* DON'T Section */}
        <div>
          <h4 className="font-semibold flex items-center">
            <span style={{
            fontSize: '20px'
          }}>✗</span> Don't
          </h4>
          <ul className="flex">
            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>Overuse them</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Too many separators create visual clutter - use spacing instead
              </p>
            </li>

            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Use for borders
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Separators are for content division, not container borders
              </p>
            </li>

            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Make them too thick
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Keep them subtle (1-2px) - they should divide, not dominate
              </p>
            </li>

            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Use without spacing
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Add margin/padding around separators for proper visual breathing room
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* Code Examples */}
      <div style={{
      marginTop: '40px'
    }}>
        <h4 className="font-semibold">
          Code Examples
        </h4>
        <div style={{
        backgroundColor: '#1a1a1a',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: '"Fira Code", monospace',
        fontSize: '13px',
        overflow: 'auto',
        border: '1px solid #2a2a2a'
      }}>
          <pre style={{
          margin: 0,
          lineHeight: '1.6'
        }}>
            {`// Horizontal separator (default)
<div>
  <p>Section 1</p>
  <Separator />
  <p>Section 2</p>
</div>

// Vertical separator
<div className="flex items-center gap-4">
  <span>Item 1</span>
  <Separator orientation="vertical" className="h-6" />
  <span>Item 2</span>
</div>

// Separator with text
<div className="flex items-center gap-4">
  <Separator className="flex-1" />
  <span className="text-sm text-muted">OR</span>
  <Separator className="flex-1" />
</div>

// In navigation
<nav className="flex items-center gap-3">
  <a href="#">Home</a>
  <Separator orientation="vertical" className="h-5" />
  <a href="#">About</a>
  <Separator orientation="vertical" className="h-5" />
  <a href="#">Contact</a>
</nav>

// Semantic separator (non-decorative)
<Separator decorative={false} />

// Custom styling
<Separator className="bg-blue-500" />
<Separator className="h-[2px]" />
<Separator className="w-1/2 mx-auto" />`}
          </pre>
        </div>
      </div>

      {/* When to Use Table */}
      <div style={{
      marginTop: '40px'
    }}>
        <h4 className="font-semibold">
          When to Use Separators
        </h4>
        <div style={{
        backgroundColor: '#1a1a1a',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #2a2a2a'
      }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <th className="text-left font-semibold">
                  Use Case
                </th>
                <th className="text-left font-semibold">
                  Orientation
                </th>
                <th className="text-left font-semibold">
                  Decorative
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>Content sections</td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>Horizontal</td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>Yes</td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>Navigation items</td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>Vertical</td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>Yes</td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>Toolbar button groups</td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>Vertical</td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>Yes</td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>Card sections (header/content/footer)</td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>Horizontal</td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>Yes</td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>List items</td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>Horizontal</td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>Yes</td>
              </tr>
              <tr>
                <td style={{
                padding: '12px'
              }}>Semantic content division</td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>Either</td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
};