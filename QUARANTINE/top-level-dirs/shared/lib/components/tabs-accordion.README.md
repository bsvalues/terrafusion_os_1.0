# TerraFusion Tabs & Accordion System

Complete tabs and accordion component system for TerraFusion property assessment platform with keyboard navigation, animations, and full accessibility support.

## Overview

The TerraFusion Tabs & Accordion System provides production-ready components for organizing content in collapsible sections and navigable tabs. Built with zero dependencies, these components integrate seamlessly with the TerraFusion ecosystem.

### Key Features

- ✅ **Keyboard Navigation**: Full arrow key support (Left/Right for horizontal tabs, Up/Down for vertical)
- ✅ **Controlled/Uncontrolled**: Support for both controlled and uncontrolled state management
- ✅ **Multiple Orientations**: Horizontal and vertical tab layouts
- ✅ **Four Tab Variants**: Default, Pills, Underline, and Cards styling
- ✅ **Icon & Badge Support**: Rich content support in tab headers
- ✅ **Smooth Animations**: CSS transitions for accordion expand/collapse and tab switching
- ✅ **Single/Multiple Modes**: Accordion can expand one or multiple items simultaneously
- ✅ **Disabled States**: Individual tab and accordion item disabling
- ✅ **Full Accessibility**: ARIA attributes, focus management, screen reader support
- ✅ **Dark Mode Ready**: Built-in dark theme support
- ✅ **Zero Dependencies**: Pure React with inline CSS styling

### Integration Points

- **Day 6 Forms**: Form sections organized in accordions and tabs
- **Day 15 Loading**: Skeleton loading states for tab panels and accordion content
- **Day 16 Notifications**: Success/error notifications for tab/accordion actions
- **Day 17 Modals**: Tabs within modals for organized content presentation

## Components

### Core Components

| Component | Purpose | Features |
|-----------|---------|----------|
| `Tabs` | Root container | State management, context provider |
| `TabList` | Tab button container | Keyboard navigation, orientation |
| `Tab` | Individual tab button | Active states, icons, badges |
| `TabPanel` | Tab content area | Content display, animations |
| `Accordion` | Accordion container | Single/multiple expansion modes |
| `AccordionItem` | Accordion section | Individual section container |
| `AccordionTrigger` | Accordion header | Clickable expand/collapse trigger |
| `AccordionContent` | Accordion content | Collapsible content area |

## Quick Start

### Basic Tabs

```tsx
import { Tabs, TabList, Tab, TabPanel } from '@/components/tabs-accordion';

function PropertyTabs() {
  return (
    <Tabs defaultValue="details">
      <TabList>
        <Tab value="details">Property Details</Tab>
        <Tab value="tax">Tax History</Tab>
        <Tab value="comparables">Comparables</Tab>
      </TabList>
      <TabPanel value="details">
        <PropertyDetailsContent />
      </TabPanel>
      <TabPanel value="tax">
        <TaxHistoryContent />
      </TabPanel>
      <TabPanel value="comparables">
        <ComparablesContent />
      </TabPanel>
    </Tabs>
  );
}
```

### Basic Accordion

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/tabs-accordion';

function SettingsAccordion() {
  return (
    <Accordion type="single" defaultValue="display">
      <AccordionItem value="display">
        <AccordionTrigger>Display Settings</AccordionTrigger>
        <AccordionContent>
          <DisplaySettingsForm />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="notifications">
        <AccordionTrigger>Notifications</AccordionTrigger>
        <AccordionContent>
          <NotificationSettingsForm />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

## API Reference

### Tabs Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `undefined` | Current active tab (controlled) |
| `defaultValue` | `string` | `undefined` | Default active tab (uncontrolled) |
| `onValueChange` | `(value: string) => void` | `undefined` | Callback when tab changes |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Tab layout orientation |
| `variant` | `'default' \| 'pills' \| 'underline' \| 'cards'` | `'default'` | Tab styling variant |
| `disabled` | `boolean` | `false` | Disable all tabs |

### Tab Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | required | Tab identifier |
| `icon` | `ReactNode` | `undefined` | Icon before label |
| `badge` | `string \| number` | `undefined` | Badge content |
| `disabled` | `boolean` | `false` | Disable this tab |

### Accordion Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'single' \| 'multiple'` | `'single'` | Expansion mode |
| `value` | `string \| string[]` | `undefined` | Current expanded value(s) (controlled) |
| `defaultValue` | `string \| string[]` | `undefined` | Default expanded value(s) (uncontrolled) |
| `onValueChange` | `(value: string \| string[]) => void` | `undefined` | Callback when expansion changes |
| `disabled` | `boolean` | `false` | Disable all accordion items |

### AccordionItem Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | required | Item identifier |
| `disabled` | `boolean` | `false` | Disable this item |

## Real-World Examples

### Example 1: Property Details Tabs in Modal (Day 17 Integration)

```tsx
import { Modal } from '@/components/modal';
import { Tabs, TabList, Tab, TabPanel } from '@/components/tabs-accordion';
import { LoadingSpinner } from '@/components/loading';

function PropertyDetailsModal({ propertyId, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Property Details"
      size="xl"
    >
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        variant="underline"
      >
        <TabList>
          <Tab 
            value="overview" 
            icon={<HomeIcon />}
          >
            Overview
          </Tab>
          <Tab 
            value="tax" 
            icon={<DollarIcon />}
            badge={5}
          >
            Tax History
          </Tab>
          <Tab 
            value="comparables" 
            icon={<CompareIcon />}
          >
            Comparables
          </Tab>
          <Tab 
            value="documents" 
            icon={<DocumentIcon />}
            badge="New"
          >
            Documents
          </Tab>
        </TabList>

        <TabPanel value="overview">
          {isLoading ? (
            <LoadingSpinner message="Loading property overview..." />
          ) : (
            <PropertyOverview propertyId={propertyId} />
          )}
        </TabPanel>

        <TabPanel value="tax">
          <TaxHistoryTable propertyId={propertyId} />
        </TabPanel>

        <TabPanel value="comparables">
          <ComparablesMap propertyId={propertyId} />
        </TabPanel>

        <TabPanel value="documents">
          <DocumentLibrary propertyId={propertyId} />
        </TabPanel>
      </Tabs>
    </Modal>
  );
}
```

### Example 2: Settings Accordion in Drawer (Day 17 Integration)

```tsx
import { Drawer } from '@/components/modal';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/tabs-accordion';
import { Form } from '@/components/forms';
import { showNotification } from '@/components/notifications';

function SettingsDrawer({ isOpen, onClose }) {
  const [expandedSections, setExpandedSections] = useState(['display']);

  const handleSave = async (section, data) => {
    try {
      await saveSettings(section, data);
      showNotification({
        type: 'success',
        title: 'Settings saved',
        message: `${section} settings have been updated successfully.`
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Save failed',
        message: 'Failed to save settings. Please try again.'
      });
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Application Settings"
      position="right"
      size="md"
    >
      <Accordion 
        type="multiple" 
        value={expandedSections}
        onValueChange={setExpandedSections}
      >
        <AccordionItem value="display">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <DisplayIcon />
              Display & Theme
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Form onSubmit={(data) => handleSave('display', data)}>
              <FormField name="theme" label="Theme">
                <Select options={['dark', 'light', 'auto']} />
              </FormField>
              <FormField name="fontSize" label="Font Size">
                <Slider min={12} max={18} />
              </FormField>
              <FormField name="animations" label="Enable Animations">
                <Switch />
              </FormField>
              <FormActions>
                <Button type="submit">Save Display Settings</Button>
              </FormActions>
            </Form>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="notifications">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <BellIcon />
              Notifications
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Form onSubmit={(data) => handleSave('notifications', data)}>
              <FormField name="email" label="Email Notifications">
                <Switch />
              </FormField>
              <FormField name="push" label="Push Notifications">
                <Switch />
              </FormField>
              <FormField name="frequency" label="Notification Frequency">
                <Select options={['immediate', 'daily', 'weekly']} />
              </FormField>
              <FormActions>
                <Button type="submit">Save Notification Settings</Button>
              </FormActions>
            </Form>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="privacy">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <ShieldIcon />
              Privacy & Security
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Form onSubmit={(data) => handleSave('privacy', data)}>
              <FormField name="analytics" label="Analytics Tracking">
                <Switch />
              </FormField>
              <FormField name="cookies" label="Cookie Preferences">
                <Select options={['all', 'essential', 'none']} />
              </FormField>
              <FormField name="twoFactor" label="Two-Factor Authentication">
                <Switch />
              </FormField>
              <FormActions>
                <Button type="submit">Save Privacy Settings</Button>
              </FormActions>
            </Form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Drawer>
  );
}
```

### Example 3: Multi-Step Form Tabs (Day 6 Integration)

```tsx
import { Tabs, TabList, Tab, TabPanel } from '@/components/tabs-accordion';
import { Form, FormStep } from '@/components/forms';
import { ValidationErrors } from '@/components/forms';

function PropertyAssessmentForm({ onSubmit }) {
  const [currentStep, setCurrentStep] = useState('basic');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const steps = [
    { id: 'basic', label: 'Basic Info', icon: <InfoIcon /> },
    { id: 'location', label: 'Location', icon: <MapIcon /> },
    { id: 'valuation', label: 'Valuation', icon: <DollarIcon /> },
    { id: 'review', label: 'Review', icon: <CheckIcon /> }
  ];

  const validateStep = async (stepId, data) => {
    const stepErrors = await validateFormStep(stepId, data);
    setErrors(prev => ({ ...prev, [stepId]: stepErrors }));
    return Object.keys(stepErrors).length === 0;
  };

  const handleStepChange = async (newStep) => {
    const isValid = await validateStep(currentStep, formData[currentStep]);
    if (isValid) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(newStep);
    }
  };

  const isStepCompleted = (stepId) => completedSteps.has(stepId);
  const hasStepErrors = (stepId) => errors[stepId] && Object.keys(errors[stepId]).length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Property Assessment Form</h1>
      
      <Tabs 
        value={currentStep} 
        onValueChange={handleStepChange}
        variant="pills"
      >
        <TabList>
          {steps.map((step) => (
            <Tab 
              key={step.id}
              value={step.id}
              icon={step.icon}
              badge={
                hasStepErrors(step.id) ? '!' : 
                isStepCompleted(step.id) ? '✓' : 
                undefined
              }
            >
              {step.label}
            </Tab>
          ))}
        </TabList>

        <TabPanel value="basic">
          <FormStep title="Basic Property Information">
            <Form 
              data={formData.basic}
              onChange={(data) => setFormData(prev => ({ ...prev, basic: data }))}
            >
              <FormField name="address" label="Property Address" required>
                <Input placeholder="123 Main St, City, State" />
              </FormField>
              <FormField name="propertyType" label="Property Type" required>
                <Select options={['residential', 'commercial', 'industrial']} />
              </FormField>
              <FormField name="yearBuilt" label="Year Built">
                <Input type="number" min="1800" max="2025" />
              </FormField>
              <FormField name="squareFootage" label="Square Footage">
                <Input type="number" min="0" />
              </FormField>
            </Form>
            {errors.basic && <ValidationErrors errors={errors.basic} />}
          </FormStep>
        </TabPanel>

        <TabPanel value="location">
          <FormStep title="Location Details">
            <Form 
              data={formData.location}
              onChange={(data) => setFormData(prev => ({ ...prev, location: data }))}
            >
              <FormField name="neighborhood" label="Neighborhood">
                <Input placeholder="Downtown, Suburbs, etc." />
              </FormField>
              <FormField name="schoolDistrict" label="School District">
                <Input placeholder="School district name" />
              </FormField>
              <FormField name="proximity" label="Proximity to Amenities">
                <CheckboxGroup options={[
                  'Shopping Centers',
                  'Public Transportation',
                  'Parks & Recreation',
                  'Hospitals',
                  'Schools'
                ]} />
              </FormField>
            </Form>
            {errors.location && <ValidationErrors errors={errors.location} />}
          </FormStep>
        </TabPanel>

        <TabPanel value="valuation">
          <FormStep title="Valuation Information">
            <Form 
              data={formData.valuation}
              onChange={(data) => setFormData(prev => ({ ...prev, valuation: data }))}
            >
              <FormField name="currentValue" label="Current Assessed Value">
                <Input type="number" prefix="$" />
              </FormField>
              <FormField name="marketValue" label="Estimated Market Value">
                <Input type="number" prefix="$" />
              </FormField>
              <FormField name="taxRate" label="Current Tax Rate">
                <Input type="number" step="0.01" suffix="%" />
              </FormField>
              <FormField name="improvements" label="Recent Improvements">
                <Textarea placeholder="Describe any recent improvements or renovations" />
              </FormField>
            </Form>
            {errors.valuation && <ValidationErrors errors={errors.valuation} />}
          </FormStep>
        </TabPanel>

        <TabPanel value="review">
          <FormStep title="Review & Submit">
            <div className="space-y-6">
              <ReviewSection title="Basic Information" data={formData.basic} />
              <ReviewSection title="Location Details" data={formData.location} />
              <ReviewSection title="Valuation Information" data={formData.valuation} />
              
              <div className="flex gap-4 pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('valuation')}
                >
                  Back to Edit
                </Button>
                <Button 
                  type="submit" 
                  onClick={() => onSubmit(formData)}
                  disabled={!completedSteps.has('basic') || !completedSteps.has('location') || !completedSteps.has('valuation')}
                >
                  Submit Assessment
                </Button>
              </div>
            </div>
          </FormStep>
        </TabPanel>
      </Tabs>
    </div>
  );
}
```

### Example 4: Expandable Filters Accordion

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/tabs-accordion';
import { Form } from '@/components/forms';

function PropertyFilters({ filters, onFiltersChange }) {
  const [activeFilters, setActiveFilters] = useState(filters);
  const [expandedSections, setExpandedSections] = useState(['price', 'location']);

  const updateFilters = (section, data) => {
    const newFilters = { ...activeFilters, [section]: data };
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFiltersChange({});
  };

  const getActiveFilterCount = (section) => {
    const sectionFilters = activeFilters[section] || {};
    return Object.values(sectionFilters).filter(Boolean).length;
  };

  return (
    <div className="w-80 bg-gray-900 border border-gray-700 rounded-lg">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold">Filter Properties</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearAllFilters}
        >
          Clear All
        </Button>
      </div>

      <Accordion 
        type="multiple" 
        value={expandedSections}
        onValueChange={setExpandedSections}
      >
        <AccordionItem value="price">
          <AccordionTrigger>
            <div className="flex items-center justify-between w-full">
              <span>Price Range</span>
              {getActiveFilterCount('price') > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {getActiveFilterCount('price')}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Form 
              data={activeFilters.price}
              onChange={(data) => updateFilters('price', data)}
            >
              <FormField name="minPrice" label="Minimum Price">
                <Input type="number" prefix="$" placeholder="0" />
              </FormField>
              <FormField name="maxPrice" label="Maximum Price">
                <Input type="number" prefix="$" placeholder="No limit" />
              </FormField>
              <FormField name="pricePerSqFt" label="Price per Sq Ft">
                <RangeSlider min={50} max={500} />
              </FormField>
            </Form>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="location">
          <AccordionTrigger>
            <div className="flex items-center justify-between w-full">
              <span>Location</span>
              {getActiveFilterCount('location') > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {getActiveFilterCount('location')}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Form 
              data={activeFilters.location}
              onChange={(data) => updateFilters('location', data)}
            >
              <FormField name="city" label="City">
                <MultiSelect options={['Seattle', 'Portland', 'Vancouver']} />
              </FormField>
              <FormField name="neighborhood" label="Neighborhood">
                <MultiSelect options={['Downtown', 'Suburbs', 'Waterfront']} />
              </FormField>
              <FormField name="zipCode" label="ZIP Code">
                <Input placeholder="98101, 98102..." />
              </FormField>
            </Form>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="property">
          <AccordionTrigger>
            <div className="flex items-center justify-between w-full">
              <span>Property Details</span>
              {getActiveFilterCount('property') > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {getActiveFilterCount('property')}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Form 
              data={activeFilters.property}
              onChange={(data) => updateFilters('property', data)}
            >
              <FormField name="propertyType" label="Property Type">
                <CheckboxGroup options={[
                  'Single Family',
                  'Condo',
                  'Townhouse',
                  'Multi-Family'
                ]} />
              </FormField>
              <FormField name="bedrooms" label="Bedrooms">
                <Select options={['1+', '2+', '3+', '4+']} />
              </FormField>
              <FormField name="bathrooms" label="Bathrooms">
                <Select options={['1+', '2+', '3+', '4+']} />
              </FormField>
              <FormField name="yearBuilt" label="Year Built">
                <RangeSlider min={1900} max={2025} />
              </FormField>
            </Form>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="amenities">
          <AccordionTrigger>
            <div className="flex items-center justify-between w-full">
              <span>Amenities</span>
              {getActiveFilterCount('amenities') > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {getActiveFilterCount('amenities')}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Form 
              data={activeFilters.amenities}
              onChange={(data) => updateFilters('amenities', data)}
            >
              <FormField name="features" label="Property Features">
                <CheckboxGroup options={[
                  'Pool',
                  'Garage',
                  'Fireplace',
                  'Hardwood Floors',
                  'Updated Kitchen',
                  'Air Conditioning'
                ]} />
              </FormField>
              <FormField name="proximity" label="Near">
                <CheckboxGroup options={[
                  'Public Transit',
                  'Schools',
                  'Shopping',
                  'Parks',
                  'Hospital'
                ]} />
              </FormField>
            </Form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
```

### Example 5: Documentation Sections with Vertical Tabs

```tsx
import { Tabs, TabList, Tab, TabPanel } from '@/components/tabs-accordion';
import { LoadingSpinner } from '@/components/loading';

function DocumentationViewer({ sections }) {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar with vertical tabs */}
      <div className="w-80 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold mb-3">Documentation</h2>
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <Tabs 
          value={activeSection} 
          onValueChange={setActiveSection}
          orientation="vertical"
          variant="default"
          className="flex-1"
        >
          <TabList className="p-4 overflow-y-auto">
            {filteredSections.map((section) => (
              <Tab 
                key={section.id}
                value={section.id}
                icon={section.icon}
                className="w-full justify-start text-left"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{section.title}</span>
                  <span className="text-sm text-gray-400 truncate">
                    {section.description}
                  </span>
                </div>
              </Tab>
            ))}
          </TabList>
        </Tabs>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <Tabs 
          value={activeSection} 
          onValueChange={setActiveSection}
          className="flex-1"
        >
          {filteredSections.map((section) => (
            <TabPanel key={section.id} value={section.id} className="flex-1 p-6 overflow-y-auto">
              {isLoading ? (
                <LoadingSpinner message="Loading documentation..." />
              ) : (
                <div className="max-w-4xl">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">{section.title}</h1>
                    <p className="text-gray-400">{section.description}</p>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: section.content }} />
                  </div>

                  {section.codeExamples && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4">Code Examples</h3>
                      {section.codeExamples.map((example, index) => (
                        <div key={index} className="mb-6">
                          <h4 className="font-medium mb-2">{example.title}</h4>
                          <CodeBlock
                            language={example.language}
                            code={example.code}
                            filename={example.filename}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {section.relatedSections && (
                    <div className="mt-8 p-4 bg-gray-800 rounded-lg">
                      <h3 className="font-medium mb-2">Related Sections</h3>
                      <div className="flex flex-wrap gap-2">
                        {section.relatedSections.map((relatedId) => {
                          const related = sections.find(s => s.id === relatedId);
                          return (
                            <Button
                              key={relatedId}
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveSection(relatedId)}
                            >
                              {related?.title}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabPanel>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
```

### Example 6: FAQ Accordion with Notifications (Day 16 Integration)

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/tabs-accordion';
import { showNotification } from '@/components/notifications';

function FAQSection({ faqs, onFeedback }) {
  const [expandedItems, setExpandedItems] = useState([]);
  const [helpfulVotes, setHelpfulVotes] = useState({});

  const handleFeedback = async (faqId, isHelpful) => {
    try {
      await onFeedback(faqId, isHelpful);
      setHelpfulVotes(prev => ({ ...prev, [faqId]: isHelpful }));
      
      showNotification({
        type: 'success',
        title: 'Thanks for your feedback!',
        message: isHelpful ? 'Glad this helped!' : 'We\'ll work on improving this answer.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Feedback failed',
        message: 'Unable to record your feedback. Please try again.'
      });
    }
  };

  const searchFAQs = (query) => {
    if (!query) return faqs;
    return faqs.filter(faq =>
      faq.question.toLowerCase().includes(query.toLowerCase()) ||
      faq.answer.toLowerCase().includes(query.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFAQs, setFilteredFAQs] = useState(faqs);

  useEffect(() => {
    setFilteredFAQs(searchFAQs(searchQuery));
  }, [searchQuery, faqs]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Frequently Asked Questions</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredFAQs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No FAQs found matching your search.</p>
          <Button 
            variant="outline"
            onClick={() => setSearchQuery('')}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <Accordion 
          type="multiple" 
          value={expandedItems}
          onValueChange={setExpandedItems}
        >
          {filteredFAQs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger>
                <div className="flex items-start justify-between w-full">
                  <div className="text-left">
                    <h3 className="font-medium">{faq.question}</h3>
                    <div className="flex gap-2 mt-1">
                      {faq.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {faq.isNew && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded ml-2">
                      New
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div 
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />

                  {faq.relatedLinks && (
                    <div>
                      <h4 className="font-medium mb-2">Related Resources</h4>
                      <ul className="space-y-1">
                        {faq.relatedLinks.map((link, index) => (
                          <li key={index}>
                            <a 
                              href={link.url}
                              className="text-blue-400 hover:text-blue-300 underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {link.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">Was this helpful?</span>
                      <div className="flex gap-2">
                        <Button
                          variant={helpfulVotes[faq.id] === true ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => handleFeedback(faq.id, true)}
                        >
                          👍 Yes
                        </Button>
                        <Button
                          variant={helpfulVotes[faq.id] === false ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => handleFeedback(faq.id, false)}
                        >
                          👎 No
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>Updated {faq.lastUpdated}</span>
                      {faq.viewCount && (
                        <span>• {faq.viewCount} views</span>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <div className="mt-12 text-center">
        <p className="text-gray-400 mb-4">Can't find what you're looking for?</p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline">
            Contact Support
          </Button>
          <Button>
            Submit a Question
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Example 7: Dashboard Expandable Sections

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/tabs-accordion';
import { LoadingSpinner } from '@/components/loading';

function PropertyDashboard({ propertyId }) {
  const [expandedSections, setExpandedSections] = useState(['overview', 'analytics']);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());

  const sections = [
    {
      id: 'overview',
      title: 'Property Overview',
      icon: <HomeIcon />,
      badge: null,
      priority: 'high'
    },
    {
      id: 'analytics',
      title: 'Market Analytics',
      icon: <ChartIcon />,
      badge: 'Updated',
      priority: 'high'
    },
    {
      id: 'financial',
      title: 'Financial Summary',
      icon: <DollarIcon />,
      badge: 3,
      priority: 'medium'
    },
    {
      id: 'maintenance',
      title: 'Maintenance & Issues',
      icon: <WrenchIcon />,
      badge: 'Alert',
      priority: 'urgent'
    },
    {
      id: 'documents',
      title: 'Documents & Records',
      icon: <DocumentIcon />,
      badge: 12,
      priority: 'low'
    },
    {
      id: 'history',
      title: 'Transaction History',
      icon: <HistoryIcon />,
      badge: null,
      priority: 'low'
    }
  ];

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await fetchPropertyData(propertyId);
      setRefreshTimestamp(Date.now());
      showNotification({
        type: 'success',
        title: 'Data refreshed',
        message: 'Property information has been updated.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Refresh failed',
        message: 'Unable to refresh property data.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeVariant = (priority) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Property Dashboard</h1>
          <p className="text-gray-400">
            Last updated: {new Date(refreshTimestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <RefreshIcon />}
            Refresh
          </Button>
          <Button>
            Export Report
          </Button>
        </div>
      </div>

      <Accordion 
        type="multiple" 
        value={expandedSections}
        onValueChange={setExpandedSections}
      >
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger>
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center gap-2">
                  {section.icon}
                  <span className="font-medium">{section.title}</span>
                </div>
                {section.badge && (
                  <Badge variant={getBadgeVariant(section.priority)}>
                    {section.badge}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 space-y-4">
                {section.id === 'overview' && (
                  <PropertyOverviewSection propertyId={propertyId} />
                )}
                {section.id === 'analytics' && (
                  <MarketAnalyticsSection propertyId={propertyId} />
                )}
                {section.id === 'financial' && (
                  <FinancialSummarySection propertyId={propertyId} />
                )}
                {section.id === 'maintenance' && (
                  <MaintenanceSection propertyId={propertyId} />
                )}
                {section.id === 'documents' && (
                  <DocumentsSection propertyId={propertyId} />
                )}
                {section.id === 'history' && (
                  <TransactionHistorySection propertyId={propertyId} />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
```

## Advanced Usage

### Keyboard Navigation

The tabs component supports full keyboard navigation:

- **Arrow Keys**: Navigate between tabs (Left/Right for horizontal, Up/Down for vertical)
- **Home/End**: Jump to first/last tab
- **Enter/Space**: Activate accordion triggers
- **Tab**: Move focus between interactive elements

### Accessibility Features

- **ARIA Labels**: All components include proper ARIA attributes
- **Focus Management**: Keyboard focus is properly managed and visible
- **Screen Reader Support**: Content is announced correctly to assistive technologies
- **High Contrast**: Components work well with high contrast themes

### Performance Optimizations

- **Lazy Loading**: Tab panels can be lazy-loaded for better performance
- **Virtual Scrolling**: For large lists of tabs or accordion items
- **Memoization**: Components are optimized to prevent unnecessary re-renders

### Styling Customization

Components use CSS custom properties for easy theming:

```css
.terrafusion-tabs {
  --tabs-bg-color: rgba(255, 255, 255, 0.05);
  --tabs-border-color: rgba(255, 255, 255, 0.1);
  --tabs-text-color: #ffffff;
  --tabs-active-color: #0ea5e9;
  --tabs-hover-color: rgba(255, 255, 255, 0.1);
}

.terrafusion-accordion {
  --accordion-bg-color: transparent;
  --accordion-border-color: rgba(255, 255, 255, 0.1);
  --accordion-text-color: #ffffff;
  --accordion-hover-color: rgba(255, 255, 255, 0.05);
}
```

## Integration Examples

### With Day 15 Loading States

```tsx
function TabsWithLoading() {
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <Tabs defaultValue="data">
      <TabList>
        <Tab value="data">Data</Tab>
        <Tab value="charts">Charts</Tab>
      </TabList>
      <TabPanel value="data">
        {isLoading ? <LoadingSpinner /> : <DataTable />}
      </TabPanel>
      <TabPanel value="charts">
        {isLoading ? <ChartSkeleton /> : <Charts />}
      </TabPanel>
    </Tabs>
  );
}
```

### With Day 16 Notifications

```tsx
function TabsWithNotifications() {
  const handleTabChange = (value) => {
    showNotification({
      type: 'info',
      title: 'Tab changed',
      message: `Switched to ${value} tab`
    });
  };

  return (
    <Tabs onValueChange={handleTabChange}>
      {/* Tab content */}
    </Tabs>
  );
}
```

## Troubleshooting

### Common Issues

1. **Tabs not switching**: Ensure `value` prop matches tab values exactly
2. **Accordion not expanding**: Check `type` prop (single vs multiple)
3. **Keyboard navigation not working**: Verify proper DOM structure and focus management
4. **Styling issues**: Check CSS custom properties and theme variables

### Performance Tips

1. Use `React.memo` for heavy tab content
2. Implement lazy loading for large datasets
3. Minimize re-renders with proper key props
4. Use accordion for large content sections to improve scroll performance

## Contributing

When contributing to the tabs-accordion system:

1. Follow the existing code patterns and naming conventions
2. Add comprehensive tests for new features
3. Update documentation with new examples
4. Ensure accessibility standards are maintained
5. Test keyboard navigation thoroughly

## License

Part of the TerraFusion component library. See main project license for details.