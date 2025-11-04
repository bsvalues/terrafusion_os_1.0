import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft,
  ChevronRight,
  Lock,
  GitBranch,
  Heart,
  Code,
  Map,
  Layers,
  Database,
  BarChart4,
  Settings,
  Compass,
  Download,
  Users,
 } from '@mui/icons-material';
import { cn } from '@/lib/utils';

interface QGISFeaturesShowcaseProps {
  className?: string;
  onClose?: () => void;
  map?: any; // OpenLayers map instance
}

interface QGISFeature {
  id: string;
  title: string;
  description: string;
  category: 'data' | 'analysis' | 'visualization' | 'integration' | 'community';
  icon: React.ReactNode;
  benefits: string[];
  useCases: string[];
  isFree: boolean;
  documentationUrl?: string;
}

const QGISFeaturesShowcase = ({ className, onClose, map }: QGISFeaturesShowcaseProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  // Fetch QGIS info from the backend
  const { data: qgisInfo, isLoading } = useQuery({
    queryKey: ['/api/gis/qgis-info'],
    queryFn: async () => {
      const response = await apiRequest('/api/gis/qgis-info');
      // Parse the response as the expected QGIS info shape
      const data = response as any;
      return {
        name: data?.name || 'QGIS',
        license: data?.license || 'GNU General Public License',
        website: data?.website || 'https://qgis.org',
        repository: data?.repository || 'https://github.com/qgis/QGIS',
        isOpenSource: data?.isOpenSource !== undefined ? data.isOpenSource : true,
        communitySize: data?.communitySize || 'Large global community',
        advantages: data?.advantages || [
          'Free and open-source',
          'Cross-platform (Windows, Mac, Linux)',
          'Extensive plugin ecosystem',
          'OGC standards compliant',
        ],
      };
    },
  });

  // List of QGIS features to showcase
  const features: QGISFeature[] = [
    {
      id: 'data-formats',
      title: 'Open Data Format Support',
      description:
        'QGIS supports a wide variety of open geospatial data formats without vendor lock-in.',
      category: 'data',
      icon: <Database className="h-5 w-5 text-green-600" />,
      benefits: [
        'No license fees for data formats',
        'Interoperability with other systems',
        'Freedom from vendor lock-in',
        'Support for industry-standard formats',
      ],
      useCases: [
        'Import GeoJSON, Shapefile, GeoTIFF, and more',
        'Seamlessly use OpenStreetMap data',
        'Work with government open data catalogs',
      ],
      isFree: true,
      documentationUrl:
        'https://docs.qgis.org/3.22/en/docs/user_manual/managing_data_source/index.html',
    },
    {
      id: 'spatial-analysis',
      title: 'Advanced Spatial Analysis',
      description: 'Perform complex spatial analysis and calculations using built-in tools.',
      category: 'analysis',
      icon: <Map className="h-5 w-5 text-blue-600" />,
      benefits: [
        'No additional costs for analysis tools',
        'Transparency in analysis algorithms',
        'Community-reviewed reliable calculations',
        'Continually improved methodologies',
      ],
      useCases: [
        'Property valuation by location',
        'Tax district boundary analysis',
        'Proximity and clustering analysis',
        'Service area calculations',
      ],
      isFree: true,
      documentationUrl: 'https://docs.qgis.org/3.22/en/docs/user_manual/processing_algs/index.html',
    },
    {
      id: 'styling-customization',
      title: 'Advanced Styling & Visualization',
      description: 'Create beautiful, informative maps with fully customizable styling options.',
      category: 'visualization',
      icon: <Layers className="h-5 w-5 text-purple-600" />,
      benefits: [
        'Complete control over map appearance',
        'Data-driven styling capabilities',
        'Custom symbology and labeling',
        'Print-quality map production',
      ],
      useCases: [
        'Property value choropleth maps',
        'Assessment date visualizations',
        'Custom branded tax maps',
        'High-quality property reports',
      ],
      isFree: true,
      documentationUrl:
        'https://docs.qgis.org/3.22/en/docs/user_manual/working_with_vector/vector_properties.html',
    },
    {
      id: 'database-integration',
      title: 'Native Database Integration',
      description:
        'Connect directly to spatial databases like PostGIS for enterprise-grade data management.',
      category: 'integration',
      icon: <Database className="h-5 w-5 text-amber-600" />,
      benefits: [
        'Enterprise-level data management',
        'Direct connection to spatial databases',
        'No middleware required',
        'High-performance data access',
      ],
      useCases: [
        'County-wide property database access',
        'Multi-user concurrent editing',
        'Historical property data analysis',
        'Real-time data updates',
      ],
      isFree: true,
      documentationUrl:
        'https://docs.qgis.org/3.22/en/docs/user_manual/managing_data_source/opening_data.html#database-related-tools',
    },
    {
      id: 'python-scripting',
      title: 'Python & Automation',
      description:
        'Extend QGIS functionality with Python scripting for custom workflows and automation.',
      category: 'integration',
      icon: <Code className="h-5 w-5 text-indigo-600" />,
      benefits: [
        'Automate repetitive tasks',
        'Create custom tools and algorithms',
        'Extend core functionality',
        'Integrate with other systems via APIs',
      ],
      useCases: [
        'Automated property value calculations',
        'Custom tax district reports',
        'Scheduled data updates',
        'Integration with legacy systems',
      ],
      isFree: true,
      documentationUrl: 'https://docs.qgis.org/3.22/en/docs/pyqgis_developer_cookbook/index.html',
    },
    {
      id: 'processing-framework',
      title: 'Advanced Processing Framework',
      description: 'Access hundreds of geoprocessing algorithms in a unified interface.',
      category: 'analysis',
      icon: <BarChart4 className="h-5 w-5 text-red-600" />,
      benefits: [
        'Hundreds of built-in algorithms',
        'Model builder for complex workflows',
        'Batch processing capabilities',
        'Integration with external tools like GRASS',
      ],
      useCases: [
        'Mass property reappraisal calculations',
        'Complex tax district creation',
        'Multi-step data processing pipelines',
        'Statistical analysis of property values',
      ],
      isFree: true,
      documentationUrl: 'https://docs.qgis.org/3.22/en/docs/user_manual/processing/index.html',
    },
    {
      id: 'plugin-ecosystem',
      title: 'Extensive Plugin Ecosystem',
      description: 'Extend functionality with hundreds of free community-developed plugins.',
      category: 'community',
      icon: <Settings className="h-5 w-5 text-green-600" />,
      benefits: [
        'Thousands of free plugins available',
        'Specialized industry tools',
        'Regular updates and improvements',
        'Community support and documentation',
      ],
      useCases: [
        'Property report generation',
        'Advanced cartography for tax maps',
        'Property data import/export tools',
        'Specialized analysis plugins',
      ],
      isFree: true,
      documentationUrl: 'https://plugins.qgis.org/',
    },
    {
      id: 'community-support',
      title: 'Global Community Support',
      description:
        'Access a worldwide community of GIS professionals for support and collaboration.',
      category: 'community',
      icon: <Users className="h-5 w-5 text-blue-600" />,
      benefits: [
        'Free community support forums',
        'Documentation in multiple languages',
        'Regular training webinars and resources',
        'User groups and conferences',
      ],
      useCases: [
        'Problem-solving assistance',
        'Best practice guidance',
        'Training materials and tutorials',
        'Knowledge sharing across jurisdictions',
      ],
      isFree: true,
      documentationUrl: 'https://qgis.org/en/site/forusers/support.html',
    },
  ];

  // Get feature by ID
  const getFeatureById = (id: string): QGISFeature | undefined => {
    return features.find(feature => feature.id === id);
  };

  // Selected feature
  const selectedFeature = selectedFeatureId ? getFeatureById(selectedFeatureId) : null;

  // Toggle panel expansion
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle feature selection
  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeatureId(featureId === selectedFeatureId ? null : featureId);
    setIsExpanded(true);
  };

  // Get features by category
  const getFeaturesByCategory = (category: string) => {
    return features.filter(feature => feature.category === category);
  };

  return (
    <div
      className={cn(
        'tf-qgis-showcase absolute right-4 top-20 bg-white rounded-lg shadow-lg transition-all duration-300 z-30',
        isExpanded ? 'w-80' : 'w-12',
        className
      )}
    >
      {/* Expand/Collapse Toggle */}
      <div
        className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-primary rounded-full p-1 cursor-pointer shadow-md"
        onClick={toggleExpand}
      >
        {isExpanded ? (
          <ChevronRight className="h-4 w-4 text-white" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Collapsed View */}
      {!isExpanded && (
        <div className="flex flex-col items-center py-4">
<>
          <div className="text-green-600 transform rotate-45">▲</div>
          <div
</> className="vertical-text text-xs text-center font-medium text-primary mt-2">
            QGIS Open Source Features
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-primary flex items-center">
              <span className="text-green-600 mr-1">▲</span> QGIS Open Source
            </h3>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : selectedFeature ? (
            /* Feature Detail View */
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="mb-2 -ml-2 text-sm"
                onClick={() => setSelectedFeatureId(null)}
              >
<>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to features
              </Button>

              <div
</> className="flex items-center space-x-2">
                {selectedFeature.icon}
                <h4 className="text-base font-medium">{selectedFeature.title}</h4>
              </div>
<>

              <p className="text-sm text-gray-600">{selectedFeature.description}</p>

              <div
</> className="space-y-1 mt-3">
<>
                <h5 className="text-sm font-medium">Benefits:</h5>
                <ul
</> className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {selectedFeature.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1 mt-3">
<>
                <h5 className="text-sm font-medium">Use Cases:</h5>
                <ul
</> className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {selectedFeature.useCases.map((useCase, idx) => (
                    <li key={idx}>{useCase}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between mt-4">
                {selectedFeature.isFree ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Lock className="h-3 w-3 mr-1" /> Open Source & Free
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Lock className="h-3 w-3 mr-1" /> Premium Feature
                  </Badge>
                )}

                {selectedFeature.documentationUrl && (
                  <a
                    href={selectedFeature.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center"
                  >
                    <Book className="h-3 w-3 mr-1" /> Documentation
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* Feature List View */
            <div>
              {qgisInfo && (
                <div className="mb-4 border-b pb-3">
                  <div className="flex items-center mb-2">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
<>
                      <GitBranch className="h-3 w-3 mr-1" /> Open Source
                    </Badge>
                    <Badge
</>
                      variant="outline"
                      className="ml-2 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <Heart className="h-3 w-3 mr-1" /> Free
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    QGIS is released under the GNU General Public License, ensuring it remains free
                    and open-source for everyone.
                  </p>
                </div>
              )}

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="data">
                  <AccordionTrigger className="text-sm">
<>
                    <Database className="h-4 w-4 mr-2 text-blue-600" /> Data Management
                  </AccordionTrigger>
                  <AccordionContent
</>>
                    <div className="grid gap-2 pt-1">
                      {getFeaturesByCategory('data').map(feature => (
                        <Button
                          key={feature.id}
                          variant="ghost"
                          size="sm"
                          className="justify-start font-normal text-xs h-auto py-1.5 px-2"
                          onClick={() => handleFeatureSelect(feature.id)}
                        >
                          {feature.icon}
                          <span className="ml-2">{feature.title}</span>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="analysis">
                  <AccordionTrigger className="text-sm">
<>
                    <BarChart4 className="h-4 w-4 mr-2 text-red-600" /> Analysis Tools
                  </AccordionTrigger>
                  <AccordionContent
</>>
                    <div className="grid gap-2 pt-1">
                      {getFeaturesByCategory('analysis').map(feature => (
                        <Button
                          key={feature.id}
                          variant="ghost"
                          size="sm"
                          className="justify-start font-normal text-xs h-auto py-1.5 px-2"
                          onClick={() => handleFeatureSelect(feature.id)}
                        >
                          {feature.icon}
                          <span className="ml-2">{feature.title}</span>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="visualization">
                  <AccordionTrigger className="text-sm">
<>
                    <Layers className="h-4 w-4 mr-2 text-purple-600" /> Visualization
                  </AccordionTrigger>
                  <AccordionContent
</>>
                    <div className="grid gap-2 pt-1">
                      {getFeaturesByCategory('visualization').map(feature => (
                        <Button
                          key={feature.id}
                          variant="ghost"
                          size="sm"
                          className="justify-start font-normal text-xs h-auto py-1.5 px-2"
                          onClick={() => handleFeatureSelect(feature.id)}
                        >
                          {feature.icon}
                          <span className="ml-2">{feature.title}</span>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="integration">
                  <AccordionTrigger className="text-sm">
<>
                    <Settings className="h-4 w-4 mr-2 text-amber-600" /> Extensions
                  </AccordionTrigger>
                  <AccordionContent
</>>
                    <div className="grid gap-2 pt-1">
                      {getFeaturesByCategory('integration').map(feature => (
                        <Button
                          key={feature.id}
                          variant="ghost"
                          size="sm"
                          className="justify-start font-normal text-xs h-auto py-1.5 px-2"
                          onClick={() => handleFeatureSelect(feature.id)}
                        >
                          {feature.icon}
                          <span className="ml-2">{feature.title}</span>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="community">
                  <AccordionTrigger className="text-sm">
<>
                    <Users className="h-4 w-4 mr-2 text-green-600" /> Community
                  </AccordionTrigger>
                  <AccordionContent
</>>
                    <div className="grid gap-2 pt-1">
                      {getFeaturesByCategory('community').map(feature => (
                        <Button
                          key={feature.id}
                          variant="ghost"
                          size="sm"
                          className="justify-start font-normal text-xs h-auto py-1.5 px-2"
                          onClick={() => handleFeatureSelect(feature.id)}
                        >
                          {feature.icon}
                          <span className="ml-2">{feature.title}</span>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Terrafusion QGIS Integration Info */}
              <div className="mt-4 border-t pt-3">
                <p className="text-xs text-gray-600">
                  <span className="text-green-600">▲</span> Terrafusion leverages QGIS open-source
                  technology to provide powerful GIS capabilities without vendor lock-in or
                  expensive licensing.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Missing Book icon
const Book = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

export default QGISFeaturesShowcase;
