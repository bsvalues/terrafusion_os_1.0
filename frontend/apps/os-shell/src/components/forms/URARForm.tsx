/**
 * TFT-117: URAR (Uniform Residential Appraisal Report) Form
 *
 * Matches the Fannie Mae 1004 form layout with standard sections:
 * Subject, Contract, Neighborhood, Site, Improvements,
 * Sales Comparison, and Reconciliation.
 */

import React, { useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubjectSection {
  propertyAddress: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  legalDescription: string;
  assessorParcelNumber: string;
  taxYear: string;
  realEstateTaxes: string;
  specialAssessments: string;
  borrowerName: string;
  occupant: 'owner' | 'tenant' | 'vacant' | '';
  propertyRights: 'fee_simple' | 'leasehold' | 'other' | '';
  assignmentType: 'purchase' | 'refinance' | 'other' | '';
  lenderClient: string;
  neighborhood: string;
  mapReference: string;
  censusTract: string;
}

interface ContractSection {
  contractPrice: string;
  contractDate: string;
  isPropertySeller: 'yes' | 'no' | '';
  dataSourcesVerification: string;
  financingConcessions: string;
}

interface NeighborhoodSection {
  builtUp: 'over_75' | '25_75' | 'under_25' | '';
  growth: 'rapid' | 'stable' | 'slow' | '';
  propertyValues: 'increasing' | 'stable' | 'declining' | '';
  demandSupply: 'shortage' | 'in_balance' | 'over_supply' | '';
  marketingTime: 'under_3_months' | '3_6_months' | 'over_6_months' | '';
  neighborhoodDescription: string;
  marketConditions: string;
  oneSiteHousing: 'detached' | 'attached' | 'semi_detached' | '';
  priceRangeLow: string;
  priceRangeHigh: string;
  predominantPrice: string;
  ageRangeLow: string;
  ageRangeHigh: string;
  predominantAge: string;
}

interface SiteSection {
  lotDimensions: string;
  lotArea: string;
  lotShape: string;
  view: string;
  specificZoning: string;
  zoningDescription: string;
  zoningCompliance: 'legal' | 'legal_nonconforming' | 'no_zoning' | 'illegal' | '';
  highestAndBestUse: 'present_use' | 'other' | '';
  utilities: {
    electricPublic: boolean;
    gasPublic: boolean;
    waterPublic: boolean;
    sanitarySewerPublic: boolean;
  };
  floodZone: string;
  femaFloodMapNumber: string;
  femaMapDate: string;
  siteComments: string;
}

interface ImprovementSection {
  generalDescription: {
    units: string;
    stories: string;
    type: 'detached' | 'attached' | 'semi_detached' | '';
    existingProposed: 'existing' | 'proposed' | 'under_construction' | '';
    designStyle: string;
    yearBuilt: string;
    effectiveAge: string;
  };
  foundation: {
    concrete: boolean;
    crawlSpace: boolean;
    fullBasement: boolean;
    partialBasement: boolean;
    slab: boolean;
    basementFinishPercent: string;
  };
  exterior: {
    wallType: string;
    roofType: string;
    gutters: boolean;
    windowType: string;
    stormSash: boolean;
    screens: boolean;
  };
  interior: {
    floors: string;
    walls: string;
    trim: string;
    bath: string;
    doors: string;
  };
  heating: {
    type: string;
    fuel: string;
    condition: string;
  };
  cooling: {
    central: boolean;
    other: string;
    condition: string;
  };
  rooms: {
    totalRooms: string;
    bedrooms: string;
    bathsFull: string;
    bathsHalf: string;
    sqftGrossLiving: string;
    sqftBasement: string;
    sqftFinishedBasement: string;
  };
  carStorage: {
    garageSpaces: string;
    carportSpaces: string;
    driveway: string;
  };
  amenities: {
    fireplace: boolean;
    fireplaceCount: string;
    patioDeck: boolean;
    pool: boolean;
    fence: boolean;
    porch: boolean;
    other: string;
  };
  condition: string;
  additionalComments: string;
}

interface SalesCompComparable {
  address: string;
  proximity: string;
  salePrice: string;
  saleDate: string;
  dataSource: string;
  adjustments: {
    saleOrFinancingConcessions: string;
    dateOfSaleTime: string;
    location: string;
    siteView: string;
    design: string;
    qualityOfConstruction: string;
    actualAge: string;
    condition: string;
    grossLivingArea: string;
    basementFinishedRooms: string;
    functionalUtility: string;
    heatingCooling: string;
    energyEfficiency: string;
    garagePorch: string;
    other: string;
    netAdjustment: string;
    adjustedSalePrice: string;
  };
}

interface SalesComparisonSection {
  comparable1: SalesCompComparable;
  comparable2: SalesCompComparable;
  comparable3: SalesCompComparable;
  salesCompComments: string;
  indicatedValueBySalesComparison: string;
}

interface ReconciliationSection {
  indicatedValueByCost: string;
  indicatedValueBySalesComparison: string;
  indicatedValueByIncome: string;
  reconciledValue: string;
  effectiveDateOfAppraisal: string;
  reconciliationComments: string;
}

export interface URARFormData {
  subject: SubjectSection;
  contract: ContractSection;
  neighborhood: NeighborhoodSection;
  site: SiteSection;
  improvements: ImprovementSection;
  salesComparison: SalesComparisonSection;
  reconciliation: ReconciliationSection;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function emptyComparable(): SalesCompComparable {
  return {
    address: '',
    proximity: '',
    salePrice: '',
    saleDate: '',
    dataSource: '',
    adjustments: {
      saleOrFinancingConcessions: '',
      dateOfSaleTime: '',
      location: '',
      siteView: '',
      design: '',
      qualityOfConstruction: '',
      actualAge: '',
      condition: '',
      grossLivingArea: '',
      basementFinishedRooms: '',
      functionalUtility: '',
      heatingCooling: '',
      energyEfficiency: '',
      garagePorch: '',
      other: '',
      netAdjustment: '',
      adjustedSalePrice: '',
    },
  };
}

function defaultFormData(): URARFormData {
  return {
    subject: {
      propertyAddress: '',
      city: '',
      state: '',
      zipCode: '',
      county: '',
      legalDescription: '',
      assessorParcelNumber: '',
      taxYear: '',
      realEstateTaxes: '',
      specialAssessments: '',
      borrowerName: '',
      occupant: '',
      propertyRights: '',
      assignmentType: '',
      lenderClient: '',
      neighborhood: '',
      mapReference: '',
      censusTract: '',
    },
    contract: {
      contractPrice: '',
      contractDate: '',
      isPropertySeller: '',
      dataSourcesVerification: '',
      financingConcessions: '',
    },
    neighborhood: {
      builtUp: '',
      growth: '',
      propertyValues: '',
      demandSupply: '',
      marketingTime: '',
      neighborhoodDescription: '',
      marketConditions: '',
      oneSiteHousing: '',
      priceRangeLow: '',
      priceRangeHigh: '',
      predominantPrice: '',
      ageRangeLow: '',
      ageRangeHigh: '',
      predominantAge: '',
    },
    site: {
      lotDimensions: '',
      lotArea: '',
      lotShape: '',
      view: '',
      specificZoning: '',
      zoningDescription: '',
      zoningCompliance: '',
      highestAndBestUse: '',
      utilities: {
        electricPublic: false,
        gasPublic: false,
        waterPublic: false,
        sanitarySewerPublic: false,
      },
      floodZone: '',
      femaFloodMapNumber: '',
      femaMapDate: '',
      siteComments: '',
    },
    improvements: {
      generalDescription: {
        units: '',
        stories: '',
        type: '',
        existingProposed: '',
        designStyle: '',
        yearBuilt: '',
        effectiveAge: '',
      },
      foundation: {
        concrete: false,
        crawlSpace: false,
        fullBasement: false,
        partialBasement: false,
        slab: false,
        basementFinishPercent: '',
      },
      exterior: {
        wallType: '',
        roofType: '',
        gutters: false,
        windowType: '',
        stormSash: false,
        screens: false,
      },
      interior: {
        floors: '',
        walls: '',
        trim: '',
        bath: '',
        doors: '',
      },
      heating: { type: '', fuel: '', condition: '' },
      cooling: { central: false, other: '', condition: '' },
      rooms: {
        totalRooms: '',
        bedrooms: '',
        bathsFull: '',
        bathsHalf: '',
        sqftGrossLiving: '',
        sqftBasement: '',
        sqftFinishedBasement: '',
      },
      carStorage: { garageSpaces: '', carportSpaces: '', driveway: '' },
      amenities: {
        fireplace: false,
        fireplaceCount: '',
        patioDeck: false,
        pool: false,
        fence: false,
        porch: false,
        other: '',
      },
      condition: '',
      additionalComments: '',
    },
    salesComparison: {
      comparable1: emptyComparable(),
      comparable2: emptyComparable(),
      comparable3: emptyComparable(),
      salesCompComments: '',
      indicatedValueBySalesComparison: '',
    },
    reconciliation: {
      indicatedValueByCost: '',
      indicatedValueBySalesComparison: '',
      indicatedValueByIncome: '',
      reconciledValue: '',
      effectiveDateOfAppraisal: '',
      reconciliationComments: '',
    },
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  type?: string;
}

function Field({ label, value, onChange, className = '', type = 'text' }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-white/50">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 block w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
      />
    </label>
  );
}

interface CheckFieldProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function CheckField({ label, checked, onChange }: CheckFieldProps) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-white/70">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-white/20"
      />
      {label}
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  className?: string;
}

function SelectField({ label, value, options, onChange, className = '' }: SelectFieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-white/50">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 block w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
      >
        <option value="">--</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-white/20 pb-1 pt-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-white/80">{title}</h2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function URARForm() {
  const [form, setForm] = useState<URARFormData>(defaultFormData);

  // Generic updater for nested paths
  const update = useCallback(
    <S extends keyof URARFormData>(
      section: S,
      field: string,
      value: unknown,
    ) => {
      setForm((prev) => {
        const sectionData = { ...prev[section] } as Record<string, unknown>;
        // Handle dot-notation for one level of nesting
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          sectionData[parent] = {
            ...(sectionData[parent] as Record<string, unknown>),
            [child]: value,
          };
        } else {
          sectionData[field] = value;
        }
        return { ...prev, [section]: sectionData };
      });
    },
    [],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6 text-white">
      <h1 className="text-xl font-bold">
        Uniform Residential Appraisal Report (URAR / Fannie Mae 1004)
      </h1>

      {/* ---------------------------------------------------------------- */}
      {/* SUBJECT */}
      {/* ---------------------------------------------------------------- */}
      <SectionHeader title="Subject" />
      <div className="grid grid-cols-4 gap-3">
        <Field label="Property Address" value={form.subject.propertyAddress} onChange={(v) => update('subject', 'propertyAddress', v)} className="col-span-2" />
        <Field label="City" value={form.subject.city} onChange={(v) => update('subject', 'city', v)} />
        <Field label="State" value={form.subject.state} onChange={(v) => update('subject', 'state', v)} />
        <Field label="Zip Code" value={form.subject.zipCode} onChange={(v) => update('subject', 'zipCode', v)} />
        <Field label="County" value={form.subject.county} onChange={(v) => update('subject', 'county', v)} />
        <Field label="Legal Description" value={form.subject.legalDescription} onChange={(v) => update('subject', 'legalDescription', v)} className="col-span-2" />
        <Field label="Assessor Parcel #" value={form.subject.assessorParcelNumber} onChange={(v) => update('subject', 'assessorParcelNumber', v)} />
        <Field label="Tax Year" value={form.subject.taxYear} onChange={(v) => update('subject', 'taxYear', v)} />
        <Field label="R.E. Taxes $" value={form.subject.realEstateTaxes} onChange={(v) => update('subject', 'realEstateTaxes', v)} />
        <Field label="Special Assessments $" value={form.subject.specialAssessments} onChange={(v) => update('subject', 'specialAssessments', v)} />
        <Field label="Borrower" value={form.subject.borrowerName} onChange={(v) => update('subject', 'borrowerName', v)} />
        <SelectField label="Occupant" value={form.subject.occupant} onChange={(v) => update('subject', 'occupant', v)} options={[{ value: 'owner', label: 'Owner' }, { value: 'tenant', label: 'Tenant' }, { value: 'vacant', label: 'Vacant' }]} />
        <SelectField label="Property Rights" value={form.subject.propertyRights} onChange={(v) => update('subject', 'propertyRights', v)} options={[{ value: 'fee_simple', label: 'Fee Simple' }, { value: 'leasehold', label: 'Leasehold' }, { value: 'other', label: 'Other' }]} />
        <SelectField label="Assignment Type" value={form.subject.assignmentType} onChange={(v) => update('subject', 'assignmentType', v)} options={[{ value: 'purchase', label: 'Purchase' }, { value: 'refinance', label: 'Refinance' }, { value: 'other', label: 'Other' }]} />
        <Field label="Lender / Client" value={form.subject.lenderClient} onChange={(v) => update('subject', 'lenderClient', v)} />
        <Field label="Neighborhood Name" value={form.subject.neighborhood} onChange={(v) => update('subject', 'neighborhood', v)} />
        <Field label="Map Reference" value={form.subject.mapReference} onChange={(v) => update('subject', 'mapReference', v)} />
        <Field label="Census Tract" value={form.subject.censusTract} onChange={(v) => update('subject', 'censusTract', v)} />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* CONTRACT */}
      {/* ---------------------------------------------------------------- */}
      <SectionHeader title="Contract" />
      <div className="grid grid-cols-4 gap-3">
        <Field label="Contract Price $" value={form.contract.contractPrice} onChange={(v) => update('contract', 'contractPrice', v)} />
        <Field label="Date of Contract" value={form.contract.contractDate} onChange={(v) => update('contract', 'contractDate', v)} type="date" />
        <SelectField label="Is property seller owner of public record?" value={form.contract.isPropertySeller} onChange={(v) => update('contract', 'isPropertySeller', v)} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
        <Field label="Data Source(s)" value={form.contract.dataSourcesVerification} onChange={(v) => update('contract', 'dataSourcesVerification', v)} />
        <Field label="Financing Concessions" value={form.contract.financingConcessions} onChange={(v) => update('contract', 'financingConcessions', v)} className="col-span-2" />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* NEIGHBORHOOD */}
      {/* ---------------------------------------------------------------- */}
      <SectionHeader title="Neighborhood" />
      <div className="grid grid-cols-5 gap-3">
        <SelectField label="Built Up" value={form.neighborhood.builtUp} onChange={(v) => update('neighborhood', 'builtUp', v)} options={[{ value: 'over_75', label: 'Over 75%' }, { value: '25_75', label: '25-75%' }, { value: 'under_25', label: 'Under 25%' }]} />
        <SelectField label="Growth" value={form.neighborhood.growth} onChange={(v) => update('neighborhood', 'growth', v)} options={[{ value: 'rapid', label: 'Rapid' }, { value: 'stable', label: 'Stable' }, { value: 'slow', label: 'Slow' }]} />
        <SelectField label="Property Values" value={form.neighborhood.propertyValues} onChange={(v) => update('neighborhood', 'propertyValues', v)} options={[{ value: 'increasing', label: 'Increasing' }, { value: 'stable', label: 'Stable' }, { value: 'declining', label: 'Declining' }]} />
        <SelectField label="Demand/Supply" value={form.neighborhood.demandSupply} onChange={(v) => update('neighborhood', 'demandSupply', v)} options={[{ value: 'shortage', label: 'Shortage' }, { value: 'in_balance', label: 'In Balance' }, { value: 'over_supply', label: 'Over Supply' }]} />
        <SelectField label="Marketing Time" value={form.neighborhood.marketingTime} onChange={(v) => update('neighborhood', 'marketingTime', v)} options={[{ value: 'under_3_months', label: 'Under 3 Mo.' }, { value: '3_6_months', label: '3-6 Mo.' }, { value: 'over_6_months', label: 'Over 6 Mo.' }]} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Price Range Low $" value={form.neighborhood.priceRangeLow} onChange={(v) => update('neighborhood', 'priceRangeLow', v)} />
        <Field label="Price Range High $" value={form.neighborhood.priceRangeHigh} onChange={(v) => update('neighborhood', 'priceRangeHigh', v)} />
        <Field label="Predominant Price $" value={form.neighborhood.predominantPrice} onChange={(v) => update('neighborhood', 'predominantPrice', v)} />
        <Field label="Age Range Low" value={form.neighborhood.ageRangeLow} onChange={(v) => update('neighborhood', 'ageRangeLow', v)} />
        <Field label="Age Range High" value={form.neighborhood.ageRangeHigh} onChange={(v) => update('neighborhood', 'ageRangeHigh', v)} />
        <Field label="Predominant Age" value={form.neighborhood.predominantAge} onChange={(v) => update('neighborhood', 'predominantAge', v)} />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* SITE */}
      {/* ---------------------------------------------------------------- */}
      <SectionHeader title="Site" />
      <div className="grid grid-cols-4 gap-3">
        <Field label="Lot Dimensions" value={form.site.lotDimensions} onChange={(v) => update('site', 'lotDimensions', v)} />
        <Field label="Lot Area" value={form.site.lotArea} onChange={(v) => update('site', 'lotArea', v)} />
        <Field label="Lot Shape" value={form.site.lotShape} onChange={(v) => update('site', 'lotShape', v)} />
        <Field label="View" value={form.site.view} onChange={(v) => update('site', 'view', v)} />
        <Field label="Specific Zoning" value={form.site.specificZoning} onChange={(v) => update('site', 'specificZoning', v)} />
        <Field label="Zoning Description" value={form.site.zoningDescription} onChange={(v) => update('site', 'zoningDescription', v)} className="col-span-2" />
        <SelectField label="Zoning Compliance" value={form.site.zoningCompliance} onChange={(v) => update('site', 'zoningCompliance', v)} options={[{ value: 'legal', label: 'Legal' }, { value: 'legal_nonconforming', label: 'Legal Nonconforming' }, { value: 'no_zoning', label: 'No Zoning' }, { value: 'illegal', label: 'Illegal' }]} />
        <Field label="FEMA Flood Zone" value={form.site.floodZone} onChange={(v) => update('site', 'floodZone', v)} />
        <Field label="FEMA Map #" value={form.site.femaFloodMapNumber} onChange={(v) => update('site', 'femaFloodMapNumber', v)} />
        <Field label="FEMA Map Date" value={form.site.femaMapDate} onChange={(v) => update('site', 'femaMapDate', v)} type="date" />
      </div>
      <div className="flex flex-wrap gap-4 pt-2">
        <CheckField label="Electric (Public)" checked={form.site.utilities.electricPublic} onChange={(v) => update('site', 'utilities.electricPublic', v)} />
        <CheckField label="Gas (Public)" checked={form.site.utilities.gasPublic} onChange={(v) => update('site', 'utilities.gasPublic', v)} />
        <CheckField label="Water (Public)" checked={form.site.utilities.waterPublic} onChange={(v) => update('site', 'utilities.waterPublic', v)} />
        <CheckField label="Sanitary Sewer (Public)" checked={form.site.utilities.sanitarySewerPublic} onChange={(v) => update('site', 'utilities.sanitarySewerPublic', v)} />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* IMPROVEMENTS */}
      {/* ---------------------------------------------------------------- */}
      <SectionHeader title="Improvements" />
      <div className="grid grid-cols-4 gap-3">
        <Field label="# of Units" value={form.improvements.generalDescription.units} onChange={(v) => update('improvements', 'generalDescription.units', v)} />
        <Field label="# of Stories" value={form.improvements.generalDescription.stories} onChange={(v) => update('improvements', 'generalDescription.stories', v)} />
        <SelectField label="Type" value={form.improvements.generalDescription.type} onChange={(v) => update('improvements', 'generalDescription.type', v)} options={[{ value: 'detached', label: 'Detached' }, { value: 'attached', label: 'Attached' }, { value: 'semi_detached', label: 'Semi-Detached' }]} />
        <SelectField label="Existing / Proposed" value={form.improvements.generalDescription.existingProposed} onChange={(v) => update('improvements', 'generalDescription.existingProposed', v)} options={[{ value: 'existing', label: 'Existing' }, { value: 'proposed', label: 'Proposed' }, { value: 'under_construction', label: 'Under Construction' }]} />
        <Field label="Design / Style" value={form.improvements.generalDescription.designStyle} onChange={(v) => update('improvements', 'generalDescription.designStyle', v)} />
        <Field label="Year Built" value={form.improvements.generalDescription.yearBuilt} onChange={(v) => update('improvements', 'generalDescription.yearBuilt', v)} />
        <Field label="Effective Age" value={form.improvements.generalDescription.effectiveAge} onChange={(v) => update('improvements', 'generalDescription.effectiveAge', v)} />
      </div>

      {/* Rooms */}
      <div className="grid grid-cols-7 gap-3 pt-2">
        <Field label="Total Rooms" value={form.improvements.rooms.totalRooms} onChange={(v) => update('improvements', 'rooms.totalRooms', v)} />
        <Field label="Bedrooms" value={form.improvements.rooms.bedrooms} onChange={(v) => update('improvements', 'rooms.bedrooms', v)} />
        <Field label="Baths (Full)" value={form.improvements.rooms.bathsFull} onChange={(v) => update('improvements', 'rooms.bathsFull', v)} />
        <Field label="Baths (Half)" value={form.improvements.rooms.bathsHalf} onChange={(v) => update('improvements', 'rooms.bathsHalf', v)} />
        <Field label="GLA Sq Ft" value={form.improvements.rooms.sqftGrossLiving} onChange={(v) => update('improvements', 'rooms.sqftGrossLiving', v)} />
        <Field label="Basement Sq Ft" value={form.improvements.rooms.sqftBasement} onChange={(v) => update('improvements', 'rooms.sqftBasement', v)} />
        <Field label="Fin. Bsmt Sq Ft" value={form.improvements.rooms.sqftFinishedBasement} onChange={(v) => update('improvements', 'rooms.sqftFinishedBasement', v)} />
      </div>

      {/* Exterior / Interior */}
      <div className="grid grid-cols-4 gap-3 pt-2">
        <Field label="Ext Wall Type" value={form.improvements.exterior.wallType} onChange={(v) => update('improvements', 'exterior.wallType', v)} />
        <Field label="Roof Type" value={form.improvements.exterior.roofType} onChange={(v) => update('improvements', 'exterior.roofType', v)} />
        <Field label="Window Type" value={form.improvements.exterior.windowType} onChange={(v) => update('improvements', 'exterior.windowType', v)} />
        <Field label="Condition" value={form.improvements.condition} onChange={(v) => update('improvements', 'condition', v)} />
      </div>

      {/* Heating / Cooling */}
      <div className="grid grid-cols-4 gap-3 pt-2">
        <Field label="Heating Type" value={form.improvements.heating.type} onChange={(v) => update('improvements', 'heating.type', v)} />
        <Field label="Heating Fuel" value={form.improvements.heating.fuel} onChange={(v) => update('improvements', 'heating.fuel', v)} />
        <Field label="Heating Condition" value={form.improvements.heating.condition} onChange={(v) => update('improvements', 'heating.condition', v)} />
        <div className="flex items-end gap-3">
          <CheckField label="Central A/C" checked={form.improvements.cooling.central} onChange={(v) => update('improvements', 'cooling.central', v)} />
        </div>
      </div>

      {/* Car Storage */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <Field label="Garage Spaces" value={form.improvements.carStorage.garageSpaces} onChange={(v) => update('improvements', 'carStorage.garageSpaces', v)} />
        <Field label="Carport Spaces" value={form.improvements.carStorage.carportSpaces} onChange={(v) => update('improvements', 'carStorage.carportSpaces', v)} />
        <Field label="Driveway" value={form.improvements.carStorage.driveway} onChange={(v) => update('improvements', 'carStorage.driveway', v)} />
      </div>

      {/* Amenities */}
      <div className="flex flex-wrap gap-4 pt-2">
        <CheckField label="Fireplace" checked={form.improvements.amenities.fireplace} onChange={(v) => update('improvements', 'amenities.fireplace', v)} />
        <CheckField label="Patio/Deck" checked={form.improvements.amenities.patioDeck} onChange={(v) => update('improvements', 'amenities.patioDeck', v)} />
        <CheckField label="Pool" checked={form.improvements.amenities.pool} onChange={(v) => update('improvements', 'amenities.pool', v)} />
        <CheckField label="Fence" checked={form.improvements.amenities.fence} onChange={(v) => update('improvements', 'amenities.fence', v)} />
        <CheckField label="Porch" checked={form.improvements.amenities.porch} onChange={(v) => update('improvements', 'amenities.porch', v)} />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* SALES COMPARISON */}
      {/* ---------------------------------------------------------------- */}
      <SectionHeader title="Sales Comparison Approach" />
      <p className="text-xs text-white/40">
        Enter up to three comparable sales with line-item adjustments.
      </p>
      {(['comparable1', 'comparable2', 'comparable3'] as const).map((key, idx) => {
        const comp = form.salesComparison[key];
        return (
          <div key={key} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
            <div className="text-xs font-bold text-white/60">Comparable {idx + 1}</div>
            <div className="grid grid-cols-4 gap-2">
              <Field label="Address" value={comp.address} onChange={(v) => { const c = { ...comp, address: v }; update('salesComparison', key, c); }} className="col-span-2" />
              <Field label="Sale Price $" value={comp.salePrice} onChange={(v) => { const c = { ...comp, salePrice: v }; update('salesComparison', key, c); }} />
              <Field label="Sale Date" value={comp.saleDate} onChange={(v) => { const c = { ...comp, saleDate: v }; update('salesComparison', key, c); }} type="date" />
              <Field label="Proximity" value={comp.proximity} onChange={(v) => { const c = { ...comp, proximity: v }; update('salesComparison', key, c); }} />
              <Field label="Data Source" value={comp.dataSource} onChange={(v) => { const c = { ...comp, dataSource: v }; update('salesComparison', key, c); }} />
              <Field label="Net Adjustment $" value={comp.adjustments.netAdjustment} onChange={(v) => { const c = { ...comp, adjustments: { ...comp.adjustments, netAdjustment: v } }; update('salesComparison', key, c); }} />
              <Field label="Adjusted Price $" value={comp.adjustments.adjustedSalePrice} onChange={(v) => { const c = { ...comp, adjustments: { ...comp.adjustments, adjustedSalePrice: v } }; update('salesComparison', key, c); }} />
            </div>
          </div>
        );
      })}
      <Field label="Indicated Value by Sales Comparison $" value={form.salesComparison.indicatedValueBySalesComparison} onChange={(v) => update('salesComparison', 'indicatedValueBySalesComparison', v)} />

      {/* ---------------------------------------------------------------- */}
      {/* RECONCILIATION */}
      {/* ---------------------------------------------------------------- */}
      <SectionHeader title="Reconciliation" />
      <div className="grid grid-cols-4 gap-3">
        <Field label="Indicated Value (Cost) $" value={form.reconciliation.indicatedValueByCost} onChange={(v) => update('reconciliation', 'indicatedValueByCost', v)} />
        <Field label="Indicated Value (Sales) $" value={form.reconciliation.indicatedValueBySalesComparison} onChange={(v) => update('reconciliation', 'indicatedValueBySalesComparison', v)} />
        <Field label="Indicated Value (Income) $" value={form.reconciliation.indicatedValueByIncome} onChange={(v) => update('reconciliation', 'indicatedValueByIncome', v)} />
        <Field label="Effective Date" value={form.reconciliation.effectiveDateOfAppraisal} onChange={(v) => update('reconciliation', 'effectiveDateOfAppraisal', v)} type="date" />
      </div>
      <div className="grid grid-cols-1 gap-3 pt-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-white/50">Reconciliation Comments</span>
          <textarea
            value={form.reconciliation.reconciliationComments}
            onChange={(e) => update('reconciliation', 'reconciliationComments', e.target.value)}
            rows={4}
            className="mt-0.5 block w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          />
        </label>
      </div>
      <div className="rounded-lg border-2 border-blue-500/30 bg-blue-500/10 p-4">
        <Field
          label="Final Reconciled Value $"
          value={form.reconciliation.reconciledValue}
          onChange={(v) => update('reconciliation', 'reconciledValue', v)}
        />
      </div>
    </div>
  );
}
