import type { Meta, StoryObj } from '@storybook/react';
import { AspectRatio } from './aspect-ratio';
import { Image, Video, Play } from 'lucide-react';

/**
 * The AspectRatio component maintains a consistent width-to-height ratio for content.
 * Built on Radix UI primitives for predictable sizing behavior.
 * 
 * ## Features
 * - Maintains aspect ratio across viewport sizes
 * - Prevents layout shift during content loading
 * - Supports any ratio (16:9, 4:3, 1:1, 21:9, custom)
 * - Works with images, videos, iframes, and custom content
 * - Responsive by default
 * - No JavaScript required for ratio preservation
 * 
 * ## Usage
 * ```tsx
 * import { AspectRatio } from '@/components/ui/aspect-ratio';
 * 
 * // 16:9 video aspect ratio
 * <AspectRatio ratio={16 / 9}>
 *   <img src="photo.jpg" alt="Photo" className="object-cover" />
 * </AspectRatio>
 * 
 * // 1:1 square for profile images
 * <AspectRatio ratio={1}>
 *   <img src="avatar.jpg" alt="Avatar" />
 * </AspectRatio>
 * 
 * // 4:3 classic photo ratio
 * <AspectRatio ratio={4 / 3}>
 *   <video controls src="video.mp4" />
 * </AspectRatio>
 * ```
 * 
 * ## Common Ratios
 * - **16:9** - Standard HD video, modern displays (1.778)
 * - **4:3** - Classic photos, old TV format (1.333)
 * - **1:1** - Square images, social media avatars (1.0)
 * - **21:9** - Ultra-wide cinema, gaming monitors (2.333)
 * - **3:2** - DSLR cameras, standard prints (1.5)
 * - **9:16** - Vertical video, mobile stories (0.5625)
 * 
 * ## Accessibility
 * - Preserves natural image/video aspect ratios
 * - Prevents content reflow and layout shift (better CLS scores)
 * - Works with alt text and aria-labels on child content
 * - No ARIA role needed (wrapper is presentational)
 */
const meta = {
  title: 'UI/AspectRatio',
  component: AspectRatio,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A component for maintaining consistent aspect ratios for images, videos, and embedded content across all viewport sizes.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    ratio: {
      control: 'number',
      description: 'Width / Height ratio (e.g., 16/9 = 1.778)'
    }
  }
} satisfies Meta<typeof AspectRatio>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default 16:9 aspect ratio - most common for video content
 */
export const Default: Story = {
  render: () => <div style={{
    maxWidth: '600px'
  }}>
      <AspectRatio ratio={16 / 9}>
        <div className="w-full flex items-center font-semibold">
          <Video className="h-12 w-12" />
          <span style={{
          marginLeft: '12px'
        }}>16:9 Ratio</span>
        </div>
      </AspectRatio>
      <p style={{
      marginTop: '12px',
      fontSize: '14px',
      color: '#888'
    }}>
        Standard HD video format - perfect for YouTube, presentations, and modern displays
      </p>
    </div>
};

/**
 * All common aspect ratios demonstrated
 */
export const CommonRatios: Story = {
  render: () => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    maxWidth: '1200px'
  }}>
      {/* 16:9 - Widescreen */}
      <div>
        <AspectRatio ratio={16 / 9}>
          <div className="w-full flex items-center font-semibold">
            <Video className="h-10 w-10" />
            <span>16:9</span>
          </div>
        </AspectRatio>
        <p style={{
        marginTop: '8px',
        fontSize: '13px',
        color: '#888'
      }}>
          HD Video / Modern displays
        </p>
      </div>

      {/* 4:3 - Classic */}
      <div>
        <AspectRatio ratio={4 / 3}>
          <div className="w-full flex items-center font-semibold">
            <Image className="h-10 w-10" />
            <span>4:3</span>
          </div>
        </AspectRatio>
        <p style={{
        marginTop: '8px',
        fontSize: '13px',
        color: '#888'
      }}>
          Classic photos / Old TV
        </p>
      </div>

      {/* 1:1 - Square */}
      <div>
        <AspectRatio ratio={1}>
          <div className="w-full flex items-center font-semibold">
            <Image className="h-10 w-10" />
            <span>1:1</span>
          </div>
        </AspectRatio>
        <p style={{
        marginTop: '8px',
        fontSize: '13px',
        color: '#888'
      }}>
          Square / Profile avatars
        </p>
      </div>

      {/* 21:9 - Ultrawide */}
      <div>
        <AspectRatio ratio={21 / 9}>
          <div className="w-full flex items-center font-semibold">
            <Play className="h-10 w-10" />
            <span>21:9</span>
          </div>
        </AspectRatio>
        <p style={{
        marginTop: '8px',
        fontSize: '13px',
        color: '#888'
      }}>
          Cinema / Ultra-wide monitors
        </p>
      </div>

      {/* 3:2 - DSLR */}
      <div>
        <AspectRatio ratio={3 / 2}>
          <div className="w-full flex items-center font-semibold">
            <Image className="h-10 w-10" />
            <span>3:2</span>
          </div>
        </AspectRatio>
        <p style={{
        marginTop: '8px',
        fontSize: '13px',
        color: '#888'
      }}>
          DSLR cameras / Standard prints
        </p>
      </div>

      {/* 9:16 - Vertical */}
      <div style={{
      maxWidth: '200px'
    }}>
        <AspectRatio ratio={9 / 16}>
          <div className="w-full flex items-center font-semibold">
            <Video className="h-10 w-10" />
            <span>9:16</span>
          </div>
        </AspectRatio>
        <p style={{
        marginTop: '8px',
        fontSize: '13px',
        color: '#888'
      }}>
          Vertical video / Stories
        </p>
      </div>
    </div>
};

/**
 * Real image with object-cover to fill aspect ratio
 */
export const WithImages: Story = {
  render: () => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    maxWidth: '1200px'
  }}>
      <div>
        <h3 className="font-semibold">
          16:9 Landscape
        </h3>
        <AspectRatio ratio={16 / 9}>
          <img src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80" alt="Mountain landscape" className="w-full" />
        </AspectRatio>
      </div>

      <div>
        <h3 className="font-semibold">
          1:1 Square
        </h3>
        <AspectRatio ratio={1}>
          <img src="https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=800&dpr=2&q=80" alt="Geometric pattern" className="w-full" />
        </AspectRatio>
      </div>

      <div>
        <h3 className="font-semibold">
          4:3 Classic
        </h3>
        <AspectRatio ratio={4 / 3}>
          <img src="https://images.unsplash.com/photo-1606767957646-cf63c8a87f1f?w=800&dpr=2&q=80" alt="Architecture" className="w-full" />
        </AspectRatio>
      </div>
    </div>
};

/**
 * Video embed with proper aspect ratio preservation
 */
export const VideoEmbed: Story = {
  render: () => <div style={{
    maxWidth: '800px'
  }}>
      <h3 className="font-semibold">
        Embedded Video (16:9)
      </h3>
      <AspectRatio ratio={16 / 9}>
        <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full" />
      </AspectRatio>
      <p style={{
      marginTop: '12px',
      fontSize: '14px',
      color: '#888'
    }}>
        AspectRatio ensures embedded videos maintain proper proportions without black bars
        or distortion across all screen sizes.
      </p>
    </div>
};

/**
 * Content overlay within aspect ratio container
 */
export const WithOverlay: Story = {
  render: () => <div style={{
    maxWidth: '600px'
  }}>
      <AspectRatio ratio={16 / 9}>
        <div className="w-full">
          <img src="https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&dpr=2&q=80" alt="Sunset landscape" className="w-full" />
          <div className="flex">
            <h3 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '8px'
          }}>
              Beautiful Sunset
            </h3>
            <p style={{
            fontSize: '14px',
            opacity: 0.9
          }}>
              Captured during golden hour in the mountains of Colorado
            </p>
            <div className="flex">
              <button style={{
              padding: '8px 16px',
              backgroundColor: '#0099ff',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer'
            }}>
                View Details
              </button>
              <button style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}>
                Share
              </button>
            </div>
          </div>
        </div>
      </AspectRatio>
    </div>
};

/**
 * Responsive image gallery with consistent aspect ratios
 */
export const RealWorldGallery: Story = {
  render: () => <div style={{
    maxWidth: '1200px',
    padding: '32px',
    backgroundColor: '#0a0a0a',
    borderRadius: '12px'
  }}>
      <h2 style={{
      fontSize: '28px',
      fontWeight: 700,
      marginBottom: '8px'
    }}>
        Photo Gallery
      </h2>
      <p style={{
      fontSize: '16px',
      color: '#888',
      marginBottom: '32px'
    }}>
        Professional photography collection with consistent aspect ratios
      </p>

      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px'
    }}>
        {[{
        url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba',
        title: 'Mountain Sunset',
        author: 'John Doe'
      }, {
        url: 'https://images.unsplash.com/photo-1682687221073-7c06651856e9',
        title: 'Ocean Waves',
        author: 'Jane Smith'
      }, {
        url: 'https://images.unsplash.com/photo-1682687218147-9806132dc697',
        title: 'Forest Path',
        author: 'Bob Wilson'
      }, {
        url: 'https://images.unsplash.com/photo-1682695794947-17061dc284dd',
        title: 'Desert Dunes',
        author: 'Alice Brown'
      }, {
        url: 'https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1',
        title: 'City Lights',
        author: 'Mike Johnson'
      }, {
        url: 'https://images.unsplash.com/photo-1682695798522-6e208131916d',
        title: 'Winter Snow',
        author: 'Sarah Davis'
      }].map((photo, index) => <div key={index} style={{
        cursor: 'pointer',
        transition: 'transform 0.2s'
      }} onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
      }} onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}>
            <AspectRatio ratio={1}>
              <img src={`${photo.url}?w=400&dpr=2&q=80`} alt={photo.title} className="w-full" />
            </AspectRatio>
            <h4 className="font-semibold">
              {photo.title}
            </h4>
            <p style={{
          fontSize: '12px',
          color: '#888',
          marginTop: '4px'
        }}>
              by {photo.author}
            </p>
          </div>)}
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
        AspectRatio Usage Guidelines
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
                Use for media content
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Perfect for images, videos, iframes, and embedded content that needs
                consistent sizing
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
                Use object-cover for images
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Combine with CSS object-fit: cover to fill the container without
                distortion
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
                Choose appropriate ratios
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                16:9 for video, 1:1 for avatars, 4:3 for photos - match content type
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
                Prevent layout shift
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                AspectRatio reserves space before content loads, improving CLS scores
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
            }}>
                Use for text content
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Text should flow naturally, not be constrained by aspect ratios
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
                Force incorrect ratios
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Don't distort content - if source is 16:9, use 16:9 aspect ratio
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
                Nest aspect ratios
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                One AspectRatio component per container - nesting causes conflicts
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
                Forget alt text
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Always add descriptive alt text to images for accessibility
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
            {`// 16:9 video container
<AspectRatio ratio={16 / 9}>
  <img 
    src="video-thumbnail.jpg" 
    alt="Video" 
    className="object-cover rounded-lg"
  />
</AspectRatio>

// 1:1 square avatar
<AspectRatio ratio={1}>
  <img 
    src="avatar.jpg" 
    alt="Profile" 
    className="object-cover rounded-full"
  />
</AspectRatio>

// YouTube embed
<AspectRatio ratio={16 / 9}>
  <iframe
    src="https://youtube.com/embed/..."
    allowFullScreen
    className="w-full h-full"
  />
</AspectRatio>

// With overlay content
<AspectRatio ratio={16 / 9}>
  <div className="relative">
    <img src="bg.jpg" className="object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80">
      <h3>Title</h3>
      <p>Description</p>
    </div>
  </div>
</AspectRatio>

// Custom ratio (golden ratio: 1.618)
<AspectRatio ratio={1.618}>
  <img src="art.jpg" alt="Artwork" />
</AspectRatio>`}
          </pre>
        </div>
      </div>

      {/* Common Ratios Reference */}
      <div style={{
      marginTop: '40px'
    }}>
        <h4 className="font-semibold">
          Common Aspect Ratios Reference
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
                  Ratio
                </th>
                <th className="text-left font-semibold">
                  Value
                </th>
                <th className="text-left font-semibold">
                  Use Case
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    16 / 9
                  </code>
                </td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>1.778</td>
                <td style={{
                padding: '12px'
              }}>HD video, modern displays, YouTube</td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    4 / 3
                  </code>
                </td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>1.333</td>
                <td style={{
                padding: '12px'
              }}>Classic photos, old TV format</td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    1
                  </code>
                </td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>1.0</td>
                <td style={{
                padding: '12px'
              }}>Square images, profile avatars, Instagram</td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    21 / 9
                  </code>
                </td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>2.333</td>
                <td style={{
                padding: '12px'
              }}>Cinema, ultra-wide monitors, gaming</td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    3 / 2
                  </code>
                </td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>1.5</td>
                <td style={{
                padding: '12px'
              }}>DSLR cameras, standard prints</td>
              </tr>
              <tr>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    9 / 16
                  </code>
                </td>
                <td style={{
                padding: '12px',
                color: '#888'
              }}>0.5625</td>
                <td style={{
                padding: '12px'
              }}>Vertical video, mobile stories, TikTok</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
};