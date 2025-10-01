import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  FileText, 
  User, 
  Shield, 
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Zap
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  processingTime: string;
  fee: string;
  popularity: 'Very High' | 'High' | 'Medium' | 'Low';
  requirements: string[];
  documents: string[];
  availableOnline: boolean;
  rating: number;
  reviews: number;
  tags: string[];
}

interface ServiceCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  serviceCount: number;
  color: string;
}

const ServiceCatalog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [services, setServices] = useState<Service[]>([]);
  const [categories] = useState<ServiceCategory[]>([
    {
      id: 'licensing-permits',
      name: 'Licensing & Permits',
      icon: <Shield size={24} />,
      description: 'Business licenses, permits, and regulatory approvals',
      serviceCount: 47,
      color: '#0099ff'
    },
    {
      id: 'vital-records',
      name: 'Vital Records',
      icon: <FileText size={24} />,
      description: 'Birth, death, marriage certificates and official documents',
      serviceCount: 23,
      color: '#00ffaa'
    },
    {
      id: 'tax-services',
      name: 'Tax Services',
      icon: <DollarSign size={24} />,
      description: 'Property taxes, payments, and tax-related services',
      serviceCount: 18,
      color: '#00ffee'
    },
    {
      id: 'benefits-social',
      name: 'Benefits & Social Services',
      icon: <User size={24} />,
      description: 'Social services, benefits enrollment, and assistance programs',
      serviceCount: 32,
      color: '#ffaa00'
    },
    {
      id: 'planning-zoning',
      name: 'Planning & Zoning',
      icon: <MapPin size={24} />,
      description: 'Zoning applications, land use permits, and planning services',
      serviceCount: 19,
      color: '#ff6b6b'
    },
    {
      id: 'public-safety',
      name: 'Public Safety',
      icon: <AlertCircle size={24} />,
      description: 'Safety permits, inspections, and compliance services',
      serviceCount: 17,
      color: '#9c27b0'
    }
  ]);

  const sampleServices: Service[] = [
    {
      id: 'business-license',
      name: 'Business License Application',
      category: 'licensing-permits',
      description: 'Apply for a new business license or renew an existing one. Required for all commercial activities within the city.',
      processingTime: '2-3 business days',
      fee: '$150.00',
      popularity: 'Very High',
      requirements: [
        'Business owner identification',
        'Proof of business address',
        'Federal EIN or SSN',
        'Business plan (for new businesses)'
      ],
      documents: [
        'Government-issued photo ID',
        'Lease agreement or property deed',
        'EIN letter from IRS',
        'Business registration documents'
      ],
      availableOnline: true,
      rating: 4.8,
      reviews: 847,
      tags: ['business', 'license', 'commercial', 'permit']
    },
    {
      id: 'birth-certificate',
      name: 'Birth Certificate Request',
      category: 'vital-records',
      description: 'Request certified copies of birth certificates. Available for births registered in this jurisdiction.',
      processingTime: '1-2 business days',
      fee: '$25.00',
      popularity: 'Very High',
      requirements: [
        'Requestor identification',
        'Relationship to person on certificate',
        'Basic information about birth record'
      ],
      documents: [
        'Government-issued photo ID',
        'Proof of relationship (if applicable)',
        'Completed application form'
      ],
      availableOnline: true,
      rating: 4.9,
      reviews: 1293,
      tags: ['vital records', 'certificate', 'birth', 'official document']
    },
    {
      id: 'property-tax-payment',
      name: 'Property Tax Payment',
      category: 'tax-services',
      description: 'Pay property taxes online or schedule automatic payments. View payment history and tax assessments.',
      processingTime: 'Instant',
      fee: 'Varies by property',
      popularity: 'High',
      requirements: [
        'Property tax account number',
        'Payment method',
        'Property owner verification'
      ],
      documents: [
        'Tax bill or account number',
        'Bank account or credit card information'
      ],
      availableOnline: true,
      rating: 4.7,
      reviews: 2847,
      tags: ['tax', 'property', 'payment', 'online']
    },
    {
      id: 'parking-permit',
      name: 'Residential Parking Permit',
      category: 'licensing-permits',
      description: 'Apply for residential parking permits for restricted parking zones.',
      processingTime: '1 business day',
      fee: '$50.00 annually',
      popularity: 'Medium',
      requirements: [
        'Proof of residency',
        'Vehicle registration',
        'Valid driver\'s license'
      ],
      documents: [
        'Utility bill or lease agreement',
        'Vehicle registration certificate',
        'Driver\'s license'
      ],
      availableOnline: true,
      rating: 4.5,
      reviews: 394,
      tags: ['parking', 'permit', 'residential', 'vehicle']
    },
    {
      id: 'benefits-enrollment',
      name: 'Social Benefits Enrollment',
      category: 'benefits-social',
      description: 'Enroll in available social benefit programs including food assistance, housing support, and healthcare.',
      processingTime: '5-7 business days',
      fee: 'No fee',
      popularity: 'High',
      requirements: [
        'Income verification',
        'Household composition',
        'Identification documents',
        'Residency proof'
      ],
      documents: [
        'Pay stubs or tax returns',
        'Birth certificates for dependents',
        'Government-issued ID',
        'Proof of address'
      ],
      availableOnline: true,
      rating: 4.6,
      reviews: 629,
      tags: ['benefits', 'social services', 'assistance', 'enrollment']
    },
    {
      id: 'building-permit',
      name: 'Building Permit Application',
      category: 'licensing-permits',
      description: 'Apply for permits for new construction, renovations, or structural modifications.',
      processingTime: '7-14 business days',
      fee: '$200-$2000 (varies)',
      popularity: 'High',
      requirements: [
        'Property ownership verification',
        'Detailed construction plans',
        'Contractor information',
        'Site survey'
      ],
      documents: [
        'Property deed or ownership documents',
        'Architectural drawings',
        'Contractor license and insurance',
        'Site plan and survey'
      ],
      availableOnline: false,
      rating: 4.3,
      reviews: 278,
      tags: ['building', 'permit', 'construction', 'renovation']
    }
  ];

  useEffect(() => {
    setServices(sampleServices);
  }, []);

  const filteredServices = services
    .filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popularity': {
          const popularityOrder = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          return popularityOrder[b.popularity] - popularityOrder[a.popularity];
        }
        case 'rating':
          return b.rating - a.rating;
        case 'processing-time':
          return a.processingTime.localeCompare(b.processingTime);
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const getPopularityColor = (popularity: string) => {
    switch (popularity) {
      case 'Very High': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleServiceRequest = (serviceId: string) => {
    // Navigate to service request form
    console.log('Requesting service:', serviceId);
  };

  return (
    <div className="service-catalog">
      {/* Header */}
      <div className="catalog-header">
        <div className="header-content">
          <h1>Service Catalog</h1>
          <p>Browse and request government services online</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="catalog-controls">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="popularity">Sort by Popularity</option>
            <option value="rating">Sort by Rating</option>
            <option value="processing-time">Sort by Processing Time</option>
            <option value="alphabetical">Sort Alphabetically</option>
          </select>
        </div>
      </div>

      {/* Category Grid */}
      <div className="categories-section">
        <h2>Service Categories</h2>
        <div className="categories-grid">
          {categories.map(category => (
            <div 
              key={category.id} 
              className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
              style={{ borderColor: category.color }}
            >
              <div className="category-icon" style={{ color: category.color }}>
                {category.icon}
              </div>
              <div className="category-content">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <div className="service-count">{category.serviceCount} services</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="services-section">
        <div className="section-header">
          <h2>Available Services</h2>
          <div className="results-count">
            {filteredServices.length} services found
          </div>
        </div>

        <div className="services-grid">
          {filteredServices.map(service => (
            <div key={service.id} className="service-card">
              <div className="service-header">
                <div className="service-title">
                  <h3>{service.name}</h3>
                  {service.availableOnline && (
                    <span className="online-badge">
                      <Zap size={12} />
                      Online
                    </span>
                  )}
                </div>
                <div className="service-popularity">
                  <span className={`popularity-badge ${getPopularityColor(service.popularity)}`}>
                    {service.popularity}
                  </span>
                </div>
              </div>

              <div className="service-description">
                {service.description}
              </div>

              <div className="service-details">
                <div className="detail-item">
                  <Clock size={16} />
                  <span>{service.processingTime}</span>
                </div>
                <div className="detail-item">
                  <DollarSign size={16} />
                  <span>{service.fee}</span>
                </div>
                <div className="detail-item">
                  <Star size={16} />
                  <span>{service.rating} ({service.reviews} reviews)</span>
                </div>
              </div>

              <div className="service-requirements">
                <h4>Required Documents:</h4>
                <ul>
                  {service.documents.slice(0, 3).map((doc, index) => (
                    <li key={index}>{doc}</li>
                  ))}
                  {service.documents.length > 3 && (
                    <li className="more-items">+{service.documents.length - 3} more...</li>
                  )}
                </ul>
              </div>

              <div className="service-tags">
                {service.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="service-tag">{tag}</span>
                ))}
              </div>

              <div className="service-actions">
                <button 
                  className="btn-primary"
                  onClick={() => handleServiceRequest(service.id)}
                >
                  Request Service
                  <ArrowRight size={16} />
                </button>
                <button className="btn-secondary">
                  <Info size={16} />
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Services Quick Links */}
      <div className="quick-links-section">
        <h2>Most Requested Services</h2>
        <div className="quick-links-grid">
          {services
            .filter(s => s.popularity === 'Very High')
            .slice(0, 4)
            .map(service => (
              <div key={service.id} className="quick-link-card">
                <div className="quick-link-content">
                  <h4>{service.name}</h4>
                  <div className="quick-link-meta">
                    <span className="processing-time">
                      <Clock size={14} />
                      {service.processingTime}
                    </span>
                    <span className="fee">
                      <DollarSign size={14} />
                      {service.fee}
                    </span>
                  </div>
                </div>
                <button 
                  className="quick-link-action"
                  onClick={() => handleServiceRequest(service.id)}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <div className="help-content">
          <h2>Need Help?</h2>
          <div className="help-grid">
            <div className="help-card">
              <Phone size={24} />
              <h3>Call Support</h3>
              <p>Speak with a representative</p>
              <span>1-800-GOV-SERV</span>
            </div>
            <div className="help-card">
              <Mail size={24} />
              <h3>Email Support</h3>
              <p>Get help via email</p>
              <span>support@terrafusion.gov</span>
            </div>
            <div className="help-card">
              <Calendar size={24} />
              <h3>Schedule Appointment</h3>
              <p>Meet with an advisor</p>
              <button className="btn-text">Book Now</button>
            </div>
            <div className="help-card">
              <FileText size={24} />
              <h3>Service Guide</h3>
              <p>Download helpful resources</p>
              <button className="btn-text">
                <Download size={16} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCatalog;