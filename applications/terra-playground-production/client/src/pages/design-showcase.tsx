import React from 'react';
import { Helmet } from 'react-helmet';

import KineticTypography from '@/components/ui/kinetic-typography';
import TexturedCard from '@/components/ui/textured-card';
import ThreeDCard from '@/components/ui/three-d-card';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Icons
import { Map,
  Home,
  BarChart4,
  Settings,
  Layers,
  Building2,
  MapPin,
  Sparkles,
  LayoutGrid,
  FileText,
 } from '@mui/icons-material';

/**
 * Design Showcase Page
 *
 * This page demonstrates the modern design components based on the 2025 design trends
 * from the provided design guide.
 */
const DesignShowcasePage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Modern Design Showcase - Terrafusion</title>
      </Helmet>

      <div className="mb-8">
        <KineticTypography
          text="Modern Design Showcase"
          variant="wave"
          className="text-4xl font-bold text-foreground mb-2"
          staggerDelay={40}
        /><>

        <KineticTypography
          text="Implementing 2025 design trends for Terrafusion"
          variant="fade"
          delay={500}
          className="text-xl text-muted-foreground"
        />
      </div>

      <Tabs
</> defaultValue="minimalist">
        <TabsList className="mb-8"><>

          <TabsTrigger value="minimalist">Minimalist</TabsTrigger>
          <TabsTrigger
</> value="dark-mode">Dark Mode</TabsTrigger><>

          <TabsTrigger value="immersive">Immersive 3D</TabsTrigger>
          <TabsTrigger
</> value="interactive">Interactive</TabsTrigger><>

          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger
</> value="textures">Textures</TabsTrigger>
        </TabsList>

        {/* Minimalist Design Section */}
        <TabsContent value="minimalist" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Minimalist Card',
                desc: 'Clean, simple design with ample whitespace',
                icon: <Home className="h-5 w-5" />,
              },
              {
                title: 'Property Assessment',
                desc: 'Focused on usability and clarity',
                icon: <Building2 className="h-5 w-5" />,
              },
              {
                title: 'Data Insights',
                desc: 'Important information without distraction',
                icon: <BarChart4 className="h-5 w-5" />,
              },
            ].map((item, idx) => (
              <div key={idx} className="tf-card p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center mb-4"><>

                  <div className="p-2 rounded-lg bg-primary/10 text-primary mr-4">{item.icon}</div>
                  <h3
</> className="tf-heading text-lg">{item.title}</h3>
                </div><>

                <p className="tf-font-body text-sm">{item.desc}</p>
                <div
</> className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Dark Mode Section */}
        <TabsContent value="dark-mode" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Dark Mode Interface',
                desc: 'Reduces eye strain and looks modern',
                icon: <Settings className="h-5 w-5" />,
              },
              {
                title: 'Contrast & Readability',
                desc: 'High contrast text for better usability',
                icon: <FileText className="h-5 w-5" />,
              },
              {
                title: 'Sleek Aesthetics',
                desc: 'Modern look and feel for professional use',
                icon: <Sparkles className="h-5 w-5" />,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-card dark:bg-card p-6 rounded-xl border border-border/40 dark:border-border/20 shadow-md"
              >
                <div className="flex items-center mb-4"><>

                  <div className="p-2 rounded-full bg-primary/10 text-primary mr-4">
                    {item.icon}
                  </div>
                  <h3
</> className="tf-heading text-lg">{item.title}</h3>
                </div><>

                <p className="tf-font-body text-sm">{item.desc}</p>
                <div
</> className="mt-4 pt-4 border-t border-border/20 flex justify-between"><>

                  <Button variant="ghost" size="sm">
                    Details
                  </Button>
                  <Button
</> variant="default" size="sm">
                    Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Immersive 3D Section */}
        <TabsContent value="immersive" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ThreeDCard className="p-6 border border-border/30">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mb-3 inline-block"><>

                    <Map className="h-5 w-5" />
                  </div>
                  <h3
</> className="tf-heading text-lg">3D Terrain Analysis</h3>
                </div><>

                <p className="tf-font-body text-sm mb-4">
                  Explore property terrain with immersive 3D visualization. Hover over this card to
                  experience the 3D effect.
                </p>
                <div
</> className="mt-auto">
                  <Button className="w-full">Explore Maps</Button>
                </div>
              </div>
            </ThreeDCard>

            <ThreeDCard
              className="p-6 border border-border/30"
              depth={20}
              glowColor="rgba(147, 51, 234, 0.5)"
            >
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 mb-3 inline-block"><>

                    <Layers className="h-5 w-5" />
                  </div>
                  <h3
</> className="tf-heading text-lg">Property Layers</h3>
                </div><>

                <p className="tf-font-body text-sm mb-4">
                  View multiple data layers with enhanced interactive controls. This card has a
                  deeper 3D effect.
                </p>
                <div
</> className="mt-auto">
                  <Button variant="outline" className="w-full">
                    View Layers
                  </Button>
                </div>
              </div>
            </ThreeDCard>

            <ThreeDCard className="p-6 border border-border/30" depth={10} glare={false}>
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-500 mb-3 inline-block"><>

                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3
</> className="tf-heading text-lg">Location Data</h3>
                </div><>

                <p className="tf-font-body text-sm mb-4">
                  Access property location information with subtle 3D effects. This card has no
                  glare effect.
                </p>
                <div
</> className="mt-auto">
                  <Button variant="secondary" className="w-full">
                    View Location
                  </Button>
                </div>
              </div>
            </ThreeDCard>
          </div>
        </TabsContent>

        {/* Interactive Elements Section */}
        <TabsContent value="interactive" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="tf-card p-6"><>

              <h3 className="tf-heading text-lg mb-4">Interactive Buttons</h3>
              <div
</> className="space-y-4">
                <div><>

                  <h4 className="text-sm font-medium mb-2">Primary Button</h4>
                  <Button
</> className="tf-button-primary w-full">Hover for Animation</Button>
                </div>
                <div><>

                  <h4 className="text-sm font-medium mb-2">Secondary Button</h4>
                  <Button
</> variant="secondary" className="tf-button-secondary w-full">
                    Hover for Elevation
                  </Button>
                </div>
                <div><>

                  <h4 className="text-sm font-medium mb-2">Outline Button</h4>
                  <Button
</> variant="outline" className="tf-button-outline w-full">
                    Interactive Border
                  </Button>
                </div>
              </div>
            </div>

            <div className="tf-card p-6"><>

              <h3 className="tf-heading text-lg mb-4">Interactive Cards</h3>
              <div
</> className="space-y-4">
                <div className="tf-card p-4 flex items-center hover:shadow-lg cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                  <div className="mr-4 p-2 rounded-full bg-primary/10 text-primary"><>

                    <BarChart4 className="h-5 w-5" />
                  </div>
                  <div
</>><>

                    <h4 className="font-medium">Analytics Dashboard</h4>
                    <p
</> className="text-sm text-muted-foreground">Interactive hover effects</p>
                  </div>
                </div>

                <div className="tf-card-gradient p-4 flex items-center hover:shadow-lg cursor-pointer transition-all duration-300">
                  <div className="mr-4 p-2 rounded-full bg-white/20 text-white"><>

                    <Layers className="h-5 w-5" />
                  </div>
                  <div
</> className="text-white"><>

                    <h4 className="font-medium">Property Layers</h4>
                    <p
</> className="text-sm text-white/80">Gradient background</p>
                  </div>
                </div>

                <div className="tf-card-glass p-4 flex items-center hover:shadow-xl cursor-pointer transition-all duration-300 backdrop-blur-lg">
                  <div className="mr-4 p-2 rounded-full bg-white/20 text-white"><>

                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div
</> className="text-white"><>

                    <h4 className="font-medium">Glass Effect</h4>
                    <p
</> className="text-sm text-white/80">Modern glassmorphism</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Modern Typography Section */}
        <TabsContent value="typography" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="tf-card p-6"><>

              <h3 className="tf-heading text-xl mb-6">Kinetic Typography</h3>

              <div
</> className="space-y-8">
                <div><>

                  <h4 className="text-sm font-medium mb-3">Wave Animation</h4>
                  <KineticTypography
</>
                    text="Property Assessment"
                    variant="wave"
                    className="text-2xl font-bold"
                    triggerOnView={true}
                    staggerDelay={40}
                  />
                </div>

                <div><>

                  <h4 className="text-sm font-medium mb-3">Slide Up Animation</h4>
                  <KineticTypography
</>
                    text="Data Analysis"
                    variant="slide-up"
                    className="text-2xl font-bold"
                    triggerOnView={true}
                    delay={200}
                  />
                </div>

                <div><>

                  <h4 className="text-sm font-medium mb-3">Highlight Animation</h4>
                  <KineticTypography
</>
                    text="Interactive Mapping"
                    variant="highlight"
                    className="text-2xl font-bold"
                    triggerOnView={true}
                    delay={400}
                  />
                </div>

                <div><>

                  <h4 className="text-sm font-medium mb-3">Fade Animation</h4>
                  <KineticTypography
</>
                    text="GIS Technology"
                    variant="fade"
                    className="text-2xl font-bold"
                    triggerOnView={true}
                    delay={600}
                  />
                </div>
              </div>
            </div>

            <div className="tf-card p-6"><>

              <h3 className="tf-heading text-xl mb-6">Modern Typography Scale</h3>

              <div
</> className="space-y-6">
                <div><>

                  <h4 className="text-sm font-medium mb-2">Display Heading</h4>
                  <h1
</> className="tf-heading-display text-4xl">Property Assessment</h1>
                </div>

                <div><>

                  <h4 className="text-sm font-medium mb-2">Large Heading</h4>
                  <h2
</> className="tf-heading-large">Data Analysis</h2>
                </div>

                <div><>

                  <h4 className="text-sm font-medium mb-2">Regular Heading</h4>
                  <h3
</> className="tf-heading text-2xl">Interactive Mapping</h3>
                </div>

                <div><>

                  <h4 className="text-sm font-medium mb-2">Body Text</h4>
                  <p
</> className="tf-font-body">
                    The modern design system emphasizes readability and visual hierarchy. This body
                    text uses optimal line height and spacing for comfortable reading.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Textures and Noise Section */}
        <TabsContent value="textures" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TexturedCard variant="subtle" color="blue" elevation="raised" className="p-6"><>

              <h3 className="tf-heading text-lg mb-4">Subtle Texture</h3>
              <p
</> className="tf-font-body text-sm mb-4">
                This card uses a subtle noise texture to add depth and dimension to the flat
                surface. Hover to see the elevation effect.
              </p>
              <Button variant="default" className="w-full">
                Blue Variant
              </Button>
            </TexturedCard>

            <TexturedCard variant="medium" color="purple" elevation="floating" className="p-6"><>

              <h3 className="tf-heading text-lg mb-4">Medium Texture</h3>
              <p
</> className="tf-font-body text-sm mb-4">
                A medium noise texture creates more visual interest and tactile feel. This card has
                a floating elevation style.
              </p>
              <Button variant="default" className="w-full bg-purple-600 hover:bg-purple-700">
                Purple Variant
              </Button>
            </TexturedCard>

            <TexturedCard variant="heavy" color="mixed" elevation="flat" className="p-6"><>

              <h3 className="tf-heading text-lg mb-4">Heavy Texture</h3>
              <p
</> className="tf-font-body text-sm mb-4">
                Pronounced texture adds significant depth and a tactile quality to the interface.
                This uses a mixed color gradient.
              </p>
              <Button
                variant="default"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Gradient Variant
              </Button>
            </TexturedCard>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <TexturedCard variant="medium" color="teal" elevation="raised" className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1"><>

                  <h3 className="tf-heading text-xl mb-4">Advanced Noise & Texture Effects</h3>
                  <p
</> className="tf-font-body mb-4">
                    In 2025, noise and textures are gaining traction in web design, adding depth and
                    realism to digital interfaces. Grainy effects introduce dimensionality, making
                    flat designs feel more tangible and engaging.
                  </p><>

                  <p className="tf-font-body mb-4">
                    Incorporating subtle textures and noise creates a more immersive experience,
                    drawing users into the content while moving away from overly polished, sterile
                    designs.
                  </p>
                  <Button
</> variant="default" className="bg-teal-600 hover:bg-teal-700">
                    Explore More Effects
                  </Button>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4">
                  {[
                    { title: 'Grain Overlay', icon: <LayoutGrid className="h-5 w-5" /> },
                    { title: 'Paper Texture', icon: <FileText className="h-5 w-5" /> },
                    { title: 'Noise Pattern', icon: <Layers className="h-5 w-5" /> },
                    { title: 'Gradient Mesh', icon: <Sparkles className="h-5 w-5" /> },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center text-center"
                    ><>

                      <div className="p-2 rounded-full bg-teal-500/20 text-teal-500 mb-3">
                        {item.icon}
                      </div>
                      <h4
</> className="font-medium text-sm">{item.title}</h4>
                    </div>
                  ))}
                </div>
              </div>
            </TexturedCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesignShowcasePage;
