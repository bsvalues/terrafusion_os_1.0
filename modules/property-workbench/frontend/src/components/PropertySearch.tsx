import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  TFCard, 
  TFHeading, 
  TFText, 
  TFInput,
  TFButton,
  TFFlex,
  TFGrid,
  TFBadge
} from '@terrafusion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Home,
  DollarSign,
  Calendar,
  User,
  Building
} from 'lucide-react';

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--tf-spacing-xl);
`;

const SearchHeader = styled(TFCard)`
  padding: var(--tf-spacing-xl);
`;

const SearchForm = styled.form`
  display: flex;
  gap: var(--tf-spacing-md);
  align-items: end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--tf-spacing-xs);
  flex: 1;
`;

const Label = styled.label`
  color: var(--tf-color-light);
  font-weight: 600;
  font-size: 0.875rem;
`;

const FilterPanel = styled(TFCard)<{ isOpen: boolean }>`
  max-height: ${props => props.isOpen ? '500px' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
  padding: ${props => props.isOpen ? 'var(--tf-spacing-lg)' : '0 var(--tf-spacing-lg)'};
`;

const PropertyCard = styled(TFCard)`
  padding: var(--tf-spacing-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--tf-shadow-lg);
    border-color: var(--tf-color-primary);
  }
`;

const PropertyImage = styled.div`
  width: 120px;
  height: 90px;
  border-radius: var(--tf-radius-md);
  background: linear-gradient(135deg, var(--tf-color-dark-lighter) 0%, var(--tf-color-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--tf-spacing-md);
  
  svg {
    width: 48px;
    height: 48px;
    color: var(--tf-color-gray);
  }
`;

const PropertyInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--tf-spacing-xs);
`;

const PropertyAddress = styled(TFText)`
  font-weight: 700;
  font-size: 1.125rem;
  margin-bottom: var(--tf-spacing-xs);
`;

const PropertyMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--tf-spacing-sm);
  margin-top: var(--tf-spacing-sm);
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--tf-spacing-xs);
  color: var(--tf-color-gray);
  font-size: 0.875rem;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

interface Property {
  id: string;
  address: string;
  parcelId: string;
  owner: string;
  assessedValue: number;
  marketValue: number;
  propertyType: string;
  yearBuilt: number;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  status: 'active' | 'pending' | 'appeal';
}

export const PropertySearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    propertyType: '',
    priceRange: '',
    yearRange: '',
    status: ''
  });

  // Mock property data - in real app, this would come from API
  const properties: Property[] = [
    {
      id: '1',
      address: '1234 Oak Street',
      parcelId: 'BN-2023-001234',
      owner: 'Johnson, Sarah M.',
      assessedValue: 425000,
      marketValue: 465000,
      propertyType: 'Single Family',
      yearBuilt: 1995,
      sqft: 2100,
      bedrooms: 3,
      bathrooms: 2,
      status: 'active'
    },
    {
      id: '2',
      address: '5678 Pine Avenue',
      parcelId: 'BN-2023-005678',
      owner: 'Smith Properties LLC',
      assessedValue: 675000,
      marketValue: 720000,
      propertyType: 'Commercial',
      yearBuilt: 1987,
      sqft: 4500,
      bedrooms: 0,
      bathrooms: 3,
      status: 'pending'
    },
    {
      id: '3',
      address: '9012 Maple Drive',
      parcelId: 'BN-2023-009012',
      owner: 'Davis, Michael & Jennifer',
      assessedValue: 385000,
      marketValue: 395000,
      propertyType: 'Single Family',
      yearBuilt: 2008,
      sqft: 1850,
      bedrooms: 3,
      bathrooms: 2,
      status: 'active'
    },
    {
      id: '4',
      address: '3456 Elm Street',
      parcelId: 'BN-2023-003456',
      owner: 'Wilson, Robert J.',
      assessedValue: 295000,
      marketValue: 310000,
      propertyType: 'Condo',
      yearBuilt: 2015,
      sqft: 1200,
      bedrooms: 2,
      bathrooms: 1,
      status: 'appeal'
    }
  ];

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.parcelId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.owner.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success' as const;
      case 'pending': return 'warning' as const;
      case 'appeal': return 'error' as const;
      default: return 'primary' as const;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search logic would go here
    console.log('Searching for:', searchTerm);
  };

  return (
    <SearchContainer>
      {/* Search Header */}
      <SearchHeader>
        <TFHeading level={1} gradient style={{ marginBottom: 'var(--tf-spacing-md)' }}>
          Property Search
        </TFHeading>
        <TFText color="var(--tf-color-gray)" style={{ marginBottom: 'var(--tf-spacing-lg)' }}>
          Search and filter through {properties.length.toLocaleString()} county properties
        </TFText>

        <SearchForm onSubmit={handleSearch}>
          <FormGroup>
            <Label htmlFor="search">Search Properties</Label>
            <TFInput
              id="search"
              placeholder="Enter address, parcel ID, or owner name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
            />
          </FormGroup>
          <TFButton type="submit" variant="primary">
            <Search size={20} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
            Search
          </TFButton>
          <TFButton 
            type="button" 
            variant="secondary"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter size={20} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
            Filters
          </TFButton>
        </SearchForm>
      </SearchHeader>

      {/* Advanced Filters */}
      <FilterPanel isOpen={filterOpen}>
        <TFHeading level={4} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
          Advanced Filters
        </TFHeading>
        <TFGrid columns={4} responsive>
          <FormGroup>
            <Label htmlFor="propertyType">Property Type</Label>
            <TFInput
              id="propertyType"
              placeholder="Any"
              value={selectedFilters.propertyType}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, propertyType: e.target.value }))}
              fullWidth
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="priceRange">Price Range</Label>
            <TFInput
              id="priceRange"
              placeholder="Any"
              value={selectedFilters.priceRange}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, priceRange: e.target.value }))}
              fullWidth
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="yearRange">Year Built</Label>
            <TFInput
              id="yearRange"
              placeholder="Any"
              value={selectedFilters.yearRange}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, yearRange: e.target.value }))}
              fullWidth
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="status">Status</Label>
            <TFInput
              id="status"
              placeholder="Any"
              value={selectedFilters.status}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
              fullWidth
            />
          </FormGroup>
        </TFGrid>
      </FilterPanel>

      {/* Search Results */}
      <TFCard>
        <TFFlex justify="space-between" align="center" style={{ marginBottom: 'var(--tf-spacing-lg)' }}>
          <TFHeading level={3}>
            Search Results ({filteredProperties.length.toLocaleString()})
          </TFHeading>
          <TFFlex gap="var(--tf-spacing-sm)">
            <TFButton variant="ghost" size="sm">Sort by Value</TFButton>
            <TFButton variant="ghost" size="sm">Sort by Date</TFButton>
          </TFFlex>
        </TFFlex>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tf-spacing-md)' }}>
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id}>
              <TFFlex align="flex-start">
                <PropertyImage>
                  <Home />
                </PropertyImage>
                
                <PropertyInfo>
                  <TFFlex justify="space-between" align="flex-start">
                    <div>
                      <PropertyAddress>{property.address}</PropertyAddress>
                      <TFText color="var(--tf-color-gray)">
                        Parcel ID: {property.parcelId}
                      </TFText>
                    </div>
                    <TFBadge variant={getStatusBadgeVariant(property.status)}>
                      {property.status.toUpperCase()}
                    </TFBadge>
                  </TFFlex>

                  <PropertyMeta>
                    <MetaItem>
                      <User />
                      {property.owner}
                    </MetaItem>
                    <MetaItem>
                      <DollarSign />
                      Assessed: {formatCurrency(property.assessedValue)}
                    </MetaItem>
                    <MetaItem>
                      <DollarSign />
                      Market: {formatCurrency(property.marketValue)}
                    </MetaItem>
                    <MetaItem>
                      <Building />
                      {property.propertyType}
                    </MetaItem>
                    <MetaItem>
                      <Calendar />
                      Built: {property.yearBuilt}
                    </MetaItem>
                    <MetaItem>
                      <MapPin />
                      {property.sqft.toLocaleString()} sq ft
                    </MetaItem>
                    {property.bedrooms > 0 && (
                      <MetaItem>
                        <Home />
                        {property.bedrooms} bed, {property.bathrooms} bath
                      </MetaItem>
                    )}
                  </PropertyMeta>
                </PropertyInfo>
              </TFFlex>
            </PropertyCard>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <TFFlex justify="center" align="center" style={{ padding: 'var(--tf-spacing-4xl)' }}>
            <div style={{ textAlign: 'center' }}>
              <Search size={48} style={{ color: 'var(--tf-color-gray)', marginBottom: 'var(--tf-spacing-md)' }} />
              <TFHeading level={4} color="var(--tf-color-gray)">
                No properties found
              </TFHeading>
              <TFText color="var(--tf-color-gray)">
                Try adjusting your search criteria or filters
              </TFText>
            </div>
          </TFFlex>
        )}
      </TFCard>
    </SearchContainer>
  );
};