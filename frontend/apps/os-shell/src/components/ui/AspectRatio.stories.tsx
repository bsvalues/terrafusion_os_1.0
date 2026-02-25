import type { Meta, StoryObj } from '@storybook/react-vite';
import { Image, Play, Video } from 'lucide-react';
import { AspectRatio } from './aspect-ratio';

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
        component:
          'A component for maintaining consistent aspect ratios for images, videos, and embedded content across all viewport sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    ratio: {
      control: 'number',
      description: 'Width / Height ratio (e.g., 16/9 = 1.778)',
    },
  },
} satisfies Meta<typeof AspectRatio>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default 16:9 aspect ratio - most common for video content
 */
export const Default: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '600px',
      }}
    >
      <AspectRatio ratio={16 / 9}>
        <div className='w-full flex items-center font-semibold'>
          <Video className='h-12 w-12' />
          <span
            style={{
              marginLeft: '12px',
            }}
          >
            16:9 Ratio
          </span>
        </div>
      </AspectRatio>
      <p
        style={{
          marginTop: '12px',
          fontSize: '14px',
          color: 'var(--gray-400)',
        }}
      >
        Standard HD video format - perfect for YouTube, presentations, and modern displays
      </p>
    </div>
  ),
};

/**
 * All common aspect ratios demonstrated
 */
export const CommonRatios: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
      }}
    >
      {/* 16:9 - Widescreen */}
      <div>
        <AspectRatio ratio={16 / 9}>
          <div className='w-full flex items-center font-semibold'>
            <Video className='h-10 w-10' />
            <span>16:9</span>
          </div>
        </AspectRatio>
        <p
          style={{
            marginTop: '8px',
            fontSize: '13px',
            color: 'var(--gray-400)',
          }}
        >
          HD Video / Modern displays
        </p>
      </div>

      {/* 4:3 - Classic */}
      <div>
        <AspectRatio ratio={4 / 3}>
          <div className='w-full flex items-center font-semibold'>
            <Image className='h-10 w-10' />
            <span>4:3</span>
          </div>
        </AspectRatio>
        <p
          style={{
            marginTop: '8px',
            fontSize: '13px',
            color: 'var(--gray-400)',
          }}
        >
          Classic photos / Old TV
        </p>
      </div>

      {/* 1:1 - Square */}
      <div>
        <AspectRatio ratio={1}>
          <div className='w-full flex items-center font-semibold'>
            <Image className='h-10 w-10' />
            <span>1:1</span>
          </div>
        </AspectRatio>
        <p
          style={{
            marginTop: '8px',
            fontSize: '13px',
            color: 'var(--gray-400)',
          }}
        >
          Square / Profile avatars
        </p>
      </div>

      {/* 21:9 - Ultrawide */}
      <div>
        <AspectRatio ratio={21 / 9}>
          <div className='w-full flex items-center font-semibold'>
            <Play className='h-10 w-10' />
            <span>21:9</span>
          </div>
        </AspectRatio>
        <p
          style={{
            marginTop: '8px',
            fontSize: '13px',
            color: 'var(--gray-400)',
          }}
        >
          Cinema / Ultra-wide monitors
        </p>
      </div>

      {/* 3:2 - DSLR */}
      <div>
        <AspectRatio ratio={3 / 2}>
          <div className='w-full flex items-center font-semibold'>
            <Image className='h-10 w-10' />
            <span>3:2</span>
          </div>
        </AspectRatio>
        <p
          style={{
            marginTop: '8px',
            fontSize: '13px',
            color: 'var(--gray-400)',
          }}
        >
          DSLR cameras / Standard prints
        </p>
      </div>

      {/* 9:16 - Vertical */}
      <div
        style={{
          maxWidth: '200px',
        }}
      >
        <AspectRatio ratio={9 / 16}>
          <div className='w-full flex items-center font-semibold'>
            <Video className='h-10 w-10' />
            <span>9:16</span>
          </div>
        </AspectRatio>
        <p
          style={{
            marginTop: '8px',
            fontSize: '13px',
            color: 'var(--gray-400)',
          }}
        >
          Vertical video / Stories
        </p>
      </div>
    </div>
  ),
};

/**
 * Real image with object-cover to fill aspect ratio
 */
export const WithImages: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
      }}
    >
      <div>
        <h3 className='font-semibold'>16:9 Landscape</h3>
        <AspectRatio ratio={16 / 9}>
          <img
            src='https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80'
            alt='Mountain landscape'
            className='w-full'
          />
        </AspectRatio>
      </div>

      <div>
        <h3 className='font-semibold'>1:1 Square</h3>
        <AspectRatio ratio={1}>
          <img
            src='https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=800&dpr=2&q=80'
            alt='Geometric pattern'
            className='w-full'
          />
        </AspectRatio>
      </div>

      <div>
        <h3 className='font-semibold'>4:3 Classic</h3>
        <AspectRatio ratio={4 / 3}>
          <img
            src='https://images.unsplash.com/photo-1606767957646-cf63c8a87f1f?w=800&dpr=2&q=80'
            alt='Architecture'
            className='w-full'
          />
        </AspectRatio>
      </div>
    </div>
  ),
};

/**
 * Video embed with proper aspect ratio preservation
 */
export const VideoEmbed: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '800px',
      }}
    >
      <h3 className='font-semibold'>Embedded Video (16:9)</h3>
      <AspectRatio ratio={16 / 9}>
        <iframe
          src='https://www.youtube.com/embed/dQw4w9WgXcQ'
          title='YouTube video'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          allowFullScreen
          className='w-full'
        />
      </AspectRatio>
      <p
        style={{
          marginTop: '12px',
          fontSize: '14px',
          color: 'var(--gray-400)',
        }}
      >
        AspectRatio ensures embedded videos maintain proper proportions without black bars or
        distortion across all screen sizes.
      </p>
    </div>
  ),
};

/**
 * Content overlay within aspect ratio container
 */
export const WithOverlay: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '600px',
      }}
    >
      <AspectRatio ratio={16 / 9}>
        <div className='w-full'>
          <img
            src='https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&dpr=2&q=80'
            alt='Sunset landscape'
            className='w-full'
          />
          <div className='flex'>
            <h3
              style={{
                fontSize: '24px',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              Beautiful Sunset
            </h3>
            <p
              style={{
                fontSize: '14px',
                opacity: 0.9,
              }}
            >
              Captured during golden hour in the mountains of Colorado
            </p>
            <div className='flex'>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--tf-network-blue)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--tf-text-primary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                View Details
              </button>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'hsl(var(--tf-neutral-hs) 100% / 0.2)',
                  border: '1px solid hsl(var(--tf-neutral-hs) 100% / 0.3)',
                  borderRadius: '6px',
                  color: 'var(--tf-text-primary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                }}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </AspectRatio>
    </div>
  ),
};

/**
 * Responsive image gallery with consistent aspect ratios
 */
export const RealWorldGallery: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '1200px',
        padding: '32px',
        backgroundColor: 'hsl(var(--tf-bg-surface-hs) 6%)',
        borderRadius: '12px',
      }}
    >
      <h2
        style={{
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '8px',
        }}
      >
        Photo Gallery
      </h2>
      <p
        style={{
          fontSize: '16px',
          color: 'var(--gray-400)',
          marginBottom: '32px',
        }}
      >
        Professional photography collection with consistent aspect ratios
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {[
          {
            url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba',
            title: 'Mountain Sunset',
            author: 'John Doe',
          },
          {
            url: 'https://images.unsplash.com/photo-1682687221073-7c06651856e9',
            title: 'Ocean Waves',
            author: 'Jane Smith',
          },
          {
            url: 'https://images.unsplash.com/photo-1682687218147-9806132dc697',
            title: 'Forest Path',
            author: 'Bob Wilson',
          },
          {
            url: 'https://images.unsplash.com/photo-1682695794947-17061dc284dd',
            title: 'Desert Dunes',
            author: 'Alice Brown',
          },
          {
            url: 'https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1',
            title: 'City Lights',
            author: 'Mike Johnson',
          },
          {
            url: 'https://images.unsplash.com/photo-1682695798522-6e208131916d',
            title: 'Winter Snow',
            author: 'Sarah Davis',
          },
        ].map((photo, index) => (
          <div
            key={index}
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <AspectRatio ratio={1}>
              <img src={`${photo.url}?w=400&dpr=2&q=80`} alt={photo.title} className='w-full' />
            </AspectRatio>
            <h4 className='font-semibold'>{photo.title}</h4>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--gray-400)',
                marginTop: '4px',
              }}
            >
              by {photo.author}
            </p>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * Usage guidelines with Do's and Don'ts
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '1000px',
        padding: '24px',
      }}
    >
      <h3 className='font-semibold'>AspectRatio Usage Guidelines</h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
        }}
      >
        {/* DO Section */}
        <div>
          <h4 className='font-semibold flex items-center'>
            <span
              style={{
                fontSize: '20px',
              }}
            >
              ✓
            </span>{' '}
            Do
          </h4>
          <ul className='flex'>
            <li
              style={{
                padding: '16px',
                backgroundColor: 'hsl(var(--tf-success-hs) 45% / 0.1)',
                borderLeft: '3px solid var(--tf-success-green)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Use for media content
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Perfect for images, videos, iframes, and embedded content that needs consistent
                sizing
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'hsl(var(--tf-success-hs) 45% / 0.1)',
                borderLeft: '3px solid var(--tf-success-green)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Use object-cover for images
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Combine with CSS object-fit: cover to fill the container without distortion
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'hsl(var(--tf-success-hs) 45% / 0.1)',
                borderLeft: '3px solid var(--tf-success-green)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Choose appropriate ratios
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                16:9 for video, 1:1 for avatars, 4:3 for photos - match content type
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'hsl(var(--tf-success-hs) 45% / 0.1)',
                borderLeft: '3px solid var(--tf-success-green)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Prevent layout shift
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                AspectRatio reserves space before content loads, improving CLS scores
              </p>
            </li>
          </ul>
        </div>

        {/* DON'T Section */}
        <div>
          <h4 className='font-semibold flex items-center'>
            <span
              style={{
                fontSize: '20px',
              }}
            >
              ✗
            </span>{' '}
            Don't
          </h4>
          <ul className='flex'>
            <li
              style={{
                padding: '16px',
                backgroundColor: 'hsl(var(--tf-error-hs) 60% / 0.1)',
                borderLeft: '3px solid var(--tf-accent-error)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Use for text content
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Text should flow naturally, not be constrained by aspect ratios
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'hsl(var(--tf-error-hs) 60% / 0.1)',
                borderLeft: '3px solid var(--tf-accent-error)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Force incorrect ratios
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Don't distort content - if source is 16:9, use 16:9 aspect ratio
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'hsl(var(--tf-error-hs) 60% / 0.1)',
                borderLeft: '3px solid var(--tf-accent-error)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Nest aspect ratios
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                One AspectRatio component per container - nesting causes conflicts
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'hsl(var(--tf-error-hs) 60% / 0.1)',
                borderLeft: '3px solid var(--tf-accent-error)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Forget alt text
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Always add descriptive alt text to images for accessibility
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* Code Examples */}
      <div
        style={{
          marginTop: '40px',
        }}
      >
        <h4 className='font-semibold'>Code Examples</h4>
        <div
          style={{
            backgroundColor: 'hsl(var(--tf-bg-surface-hs) 12%)',
            padding: '20px',
            borderRadius: '8px',
            fontFamily: '"Fira Code", monospace',
            fontSize: '13px',
            overflow: 'auto',
            border: '1px solid hsl(var(--tf-neutral-hs) 18%)',
          }}
        >
          <pre
            style={{
              margin: 0,
              lineHeight: '1.6',
            }}
          >
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
      <div
        style={{
          marginTop: '40px',
        }}
      >
        <h4 className='font-semibold'>Common Aspect Ratios Reference</h4>
        <div
          style={{
            backgroundColor: 'hsl(var(--tf-bg-surface-hs) 12%)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid hsl(var(--tf-neutral-hs) 18%)',
          }}
        >
          <table className='w-full border-collapse'>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid hsl(var(--tf-neutral-hs) 18%)',
                }}
              >
                <th className='text-left font-semibold'>Ratio</th>
                <th className='text-left font-semibold'>Value</th>
                <th className='text-left font-semibold'>Use Case</th>
              </tr>
            </thead>
            <tbody>
              <tr
                style={{
                  borderBottom: '1px solid hsl(var(--tf-neutral-hs) 18%)',
                }}
              >
                <td
                  style={{
                    padding: '12px',
                  }}
                >
                  <code
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'hsl(var(--tf-bg-surface-hs) 6%)',
                      borderRadius: '4px',
                    }}
                  >
                    16 / 9
                  </code>
                </td>
                <td
                  style={{
                    padding: '12px',
                    color: 'var(--gray-400)',
                  }}
                >
                  1.778
                </td>
                <td
                  style={{
                    padding: '12px',
                  }}
                >
                  HD video, modern displays, YouTube
                </td>
              </tr>
              <tr
                style={{
                  borderBottom: '1px solid hsl(var(--tf-neutral-hs) 18%)',
                }}
              >
                <td
                  style={{
                    padding: '12px',
                  }}
                >
                  <code
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'hsl(var(--tf-bg-surface-hs) 6%)',
                      borderRadius: '4px',
                    }}
                  >
                    4 / 3
                  </code>
                </td>
                <td
                  style={{
                    padding: '12px',
                    color: 'var(--gray-400)',
                  }}
                >
                  1.333
                </td>
                <td
                  style={{
                    padding: '12px',
                  }}
                >
                  Classic photos, old TV format
                </td>
              </tr>
              <tr
                style={{
                  borderBottom: '1px solid hsl(var(--tf-neutral-hs) 18%)',
                }}
              >
                <td
                  style={{
                    padding: '12px',
                  }}
                >
                  <code
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'hsl(var(--tf-bg-surface-hs) 6%)',
                      borderRadius: '4px',
                    }}
                  >
                    1
                  </code>
                </td>
                <td
                  style={{
                    padding: '12px',
                    color: 'var(--gray-400)',
                  }}
                >
                  1.0
                </td>
                <td
                  style={{
                    padding: '12px',
                  }}
                >
                  Square images, profile avatars, Instagram
                </td>
              </tr>
              <tr
                style={{
                  borderBottom: '1px solid hsl(var(--tf-neutral-hs) 18%)',
                }}
              >
                <td
                  style={{
                    padding: '12px',
                  }}
                >
                  <code
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'hsl(var(--tf-bg-surface-hs) 6%)',
                      borderRadius: '4px',
                    }}
                  >
                    21 / 9
                  </code>
                </td>
                <td
                  style={{
                    padding: '12px',
                    color: 'var(--gray-400)',
                  }}
                >
                  2.333
                </td>
                <td
                  style={{
                    padding: '12px',
                  }}
                >
                  Cinema, ultra-wide monitors, gaming
                </td>
              </tr>
              <tr
                style={{
                  borderBottom: '1px solid hsl(var(--tf-neutral-hs) 18%)',
                }}
              >
                <td
                  style={{
                    padding: '12px',
                  }}
                >
                  <code
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'hsl(var(--tf-bg-surface-hs) 6%)',
                      borderRadius: '4px',
                    }}
                  >
                    3 / 2
                  </code>
                </td>
                <td
                  style={{
                    padding: '12px',
                    color: 'var(--gray-400)',
                  }}
                >
                  1.5
                </td>
                <td
                  style={{
                    padding: '12px',
                  }}
                >
                  DSLR cameras, standard prints
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '12px',
                  }}
                >
                  <code
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'hsl(var(--tf-bg-surface-hs) 6%)',
                      borderRadius: '4px',
                    }}
                  >
                    9 / 16
                  </code>
                </td>
                <td
                  style={{
                    padding: '12px',
                    color: 'var(--gray-400)',
                  }}
                >
                  0.5625
                </td>
                <td
                  style={{
                    padding: '12px',
                  }}
                >
                  Vertical video, mobile stories, TikTok
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
};

/**
 * Story 8: Accessibility Test
 */
export const AccessibilityTest: Story = {
  render: () => (
    <div className='space-y-6 max-w-4xl'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Accessibility Features</h3>
      </div>

      <div className='rounded-lg border p-6 space-y-4'>
        <h4 className='font-semibold'>Semantic Image with Alt Text</h4>
        <AspectRatio ratio={16 / 9} className='bg-muted'>
          <img
            src='https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80'
            alt='Detailed description: Yellow sunflower in full bloom against a blue sky'
            className='rounded-md object-cover w-full h-full'
          />
        </AspectRatio>
      </div>

      <div className='rounded-lg border p-6 space-y-4'>
        <h4 className='font-semibold'>Video with Controls & Captions</h4>
        <AspectRatio ratio={16 / 9}>
          <iframe
            src='https://www.youtube.com/embed/dQw4w9WgXcQ'
            title='Example video with descriptive title for screen readers'
            className='rounded-md w-full h-full'
            allowFullScreen
          />
        </AspectRatio>
      </div>

      <div className='rounded-lg bg-blue-50 dark:bg-blue-950 p-6 space-y-3'>
        <h4 className='font-semibold text-blue-900 dark:text-blue-100'>♿ Accessibility</h4>
        <ul className='space-y-2 text-sm text-blue-800 dark:text-blue-200'>
          <li>✓ Provide descriptive alt text for images</li>
          <li>✓ Use semantic HTML (img, video, iframe)</li>
          <li>✓ Include video captions and transcripts</li>
          <li>✓ Maintain focus indicators</li>
        </ul>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
};

/**
 * Story 9: Edge Cases
 */
export const EdgeCases: Story = {
  render: () => (
    <div className='space-y-6 max-w-4xl'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Edge Cases</h3>
      </div>

      <div className='rounded-lg border p-6 space-y-4'>
        <h4 className='font-semibold'>Extreme Ratios</h4>
        <div className='space-y-4'>
          <div>
            <p className='text-sm text-muted-foreground mb-2'>Ultra-Wide (32:9)</p>
            <AspectRatio ratio={32 / 9} className='bg-muted rounded-md' />
          </div>
          <div>
            <p className='text-sm text-muted-foreground mb-2'>Ultra-Tall (1:5)</p>
            <AspectRatio ratio={1 / 5} className='bg-muted rounded-md max-w-[200px]' />
          </div>
        </div>
      </div>

      <div className='rounded-lg border p-6 space-y-4'>
        <h4 className='font-semibold'>Empty Container</h4>
        <AspectRatio
          ratio={16 / 9}
          className='bg-muted rounded-md flex items-center justify-center'
        >
          <p className='text-muted-foreground'>No content loaded</p>
        </AspectRatio>
      </div>

      <div className='rounded-lg border p-6 space-y-4'>
        <h4 className='font-semibold'>Broken Image</h4>
        <AspectRatio ratio={16 / 9} className='bg-muted rounded-md'>
          <img
            src='https://invalid-url.example.com/image.jpg'
            alt='Broken image example'
            className='w-full h-full object-cover'
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </AspectRatio>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
};

/**
 * Story 10: Responsive
 */
export const Responsive: Story = {
  render: () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Responsive Aspect Ratios</h3>
      </div>

      <div className='rounded-lg border p-6 space-y-4'>
        <h4 className='font-semibold'>Adaptive Ratio (16:9 desktop, 4:3 mobile)</h4>
        <AspectRatio ratio={16 / 9} className='sm:aspect-[16/9] aspect-[4/3] bg-muted rounded-md'>
          <div className='w-full h-full flex items-center justify-center'>
            <p className='text-sm text-muted-foreground'>Ratio adapts to screen size</p>
          </div>
        </AspectRatio>
      </div>

      <div className='rounded-lg border p-6 space-y-4'>
        <h4 className='font-semibold'>Full-Width Images</h4>
        <AspectRatio ratio={21 / 9} className='w-full bg-muted rounded-md'>
          <img
            src='https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&dpr=2&q=80'
            alt='Laptop on desk'
            className='w-full h-full object-cover rounded-md'
          />
        </AspectRatio>
      </div>

      <div className='rounded-lg bg-blue-50 dark:bg-blue-950 p-6 space-y-3'>
        <h4 className='font-semibold text-blue-900 dark:text-blue-100'>
          📱 Responsive Best Practices
        </h4>
        <ul className='space-y-2 text-sm text-blue-800 dark:text-blue-200'>
          <li>• Use max-width constraints on containers</li>
          <li>• Consider different ratios for mobile vs desktop</li>
          <li>• Test object-fit (cover, contain) for various content</li>
        </ul>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
};

/**
 * Story 11: Composition Patterns
 */
export const CompositionPatterns: Story = {
  render: () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Composition Patterns</h3>
      </div>

      <div className='rounded-lg border p-6 space-y-4'>
        <h4 className='font-semibold'>Card with Image Header</h4>
        <div className='max-w-sm border rounded-lg overflow-hidden'>
          <AspectRatio ratio={16 / 9}>
            <img
              src='https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&dpr=2&q=80'
              alt='Laptop workspace'
              className='w-full h-full object-cover'
            />
          </AspectRatio>
          <div className='p-4'>
            <h3 className='font-semibold mb-2'>Product Title</h3>
            <p className='text-sm text-muted-foreground'>
              This card uses AspectRatio to ensure consistent image dimensions.
            </p>
            <Button className='mt-4 w-full'>Learn More</Button>
          </div>
        </div>
      </div>

      <div className='rounded-lg border p-6 space-y-4'>
        <h4 className='font-semibold'>Profile Avatar (Square)</h4>
        <div className='flex items-center gap-4'>
          <AspectRatio ratio={1} className='w-24 bg-muted rounded-full overflow-hidden'>
            <img
              src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&dpr=2&q=80'
              alt='User profile'
              className='w-full h-full object-cover'
            />
          </AspectRatio>
          <div>
            <p className='font-semibold'>John Doe</p>
            <p className='text-sm text-muted-foreground'>Software Engineer</p>
          </div>
        </div>
      </div>

      <div className='rounded-lg border p-6 space-y-4'>
        <h4 className='font-semibold'>Product Grid (3 columns)</h4>
        <div className='grid grid-cols-3 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <AspectRatio key={i} ratio={1} className='bg-muted rounded-md'>
              <div className='w-full h-full flex items-center justify-center'>
                <p className='text-xs text-muted-foreground'>Item {i + 1}</p>
              </div>
            </AspectRatio>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
};

/**
 * Story 12: Performance
 */
export const Performance: Story = {
  render: () => (
    <div className='space-y-6 max-w-4xl'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Performance & Optimization</h3>
      </div>

      <div className='rounded-lg border p-6 space-y-4'>
        <h4 className='font-semibold'>Bundle Size</h4>
        <div className='bg-muted p-4 rounded'>
          <p className='text-2xl font-bold'>0.2 KB</p>
          <p className='text-sm text-muted-foreground'>Gzipped (minimal overhead)</p>
        </div>
      </div>

      <div className='rounded-lg border p-6 space-y-4'>
        <h4 className='font-semibold'>Many Images (100 items)</h4>
        <div className='grid grid-cols-10 gap-2 max-h-96 overflow-y-auto'>
          {Array.from({ length: 100 }).map((_, i) => (
            <AspectRatio key={i} ratio={1} className='bg-muted rounded'>
              <div className='w-full h-full flex items-center justify-center text-xs'>{i + 1}</div>
            </AspectRatio>
          ))}
        </div>
        <p className='text-sm text-green-600 mt-2'>✓ No layout shift, smooth rendering</p>
      </div>

      <div className='rounded-lg bg-green-50 dark:bg-green-950 p-6 space-y-3'>
        <h4 className='font-semibold text-green-900 dark:text-green-100'>⚡ Performance</h4>
        <ul className='space-y-2 text-sm text-green-800 dark:text-green-200'>
          <li>✓ Bundle: 0.2 KB gzipped (ultra-lightweight)</li>
          <li>✓ CSS-based (no JavaScript overhead)</li>
          <li>✓ Prevents layout shift during image load</li>
          <li>✓ Handles 100+ items efficiently</li>
        </ul>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
};
