import "./terrafusion-brand.css";
import {useState, useEffect} from "react";
import {invoke} from "@tauri-apps/api/tauri";
import "./App.css";

interface Property {id: string;
  address: string;
  parcel_id: string;
  current_value: number;
  assessed_value: number;
  assessment_year: number;
  property_type: string;
  square_footage: number;
  lot_size: number;
  bedrooms?: number;
  bathrooms?: number;
  year_built?: number;
  tax_status: 'current' | 'delinquent' | 'exempt';
  last_sale_date?: string;
  last_sale_price?: number;}

interface AssessmentRequest {property_id: string;
  assessment_type: 'market_value' | 'insurance' | 'tax_assessment' | 'depreciation';
  methodology: 'comparable_sales' | 'cost_approach' | 'income_approach' | 'ai_ml';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requested_by: string;
  due_date: string;}

interface AssessmentResult {property_id: string;
  assessed_value: number;
  confidence_score: number;
  methodology_used: string;
  comparable_properties: string[];
  assessment_factors: Record<string, number>;
  report_url?: string;
  assessment_date: string;
  assessor_notes: string;}

function App() {const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [assessmentRequests, setAssessmentRequests] = useState<AssessmentRequest[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [currentView, setCurrentView] = useState<'search' | 'assess' | 'results' | 'reports'>('search');
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() =>{
    const mockProperties: Property[] = [
      {
        id: "P001",
        address: "123 Main Street, Springfield, IL 62701",
        parcel_id: "14-28-401-016",
        current_value: 285000,
        assessed_value: 256500,
        assessment_year: 2024,
        property_type: "Single Family Residential",
        square_footage: 2150,
        lot_size: 0.25,
        bedrooms: 3,
        bathrooms: 2,
        year_built: 1995,
        tax_status: 'current',
        last_sale_date: "2023-06-15",
        last_sale_price: 275000},
      {id: "P002",
        address: "456 Oak Avenue, Springfield, IL 62702",
        parcel_id: "14-28-401-017",
        current_value: 450000,
        assessed_value: 405000,
        assessment_year: 2024,
        property_type: "Single Family Residential",
        square_footage: 3200,
        lot_size: 0.35,
        bedrooms: 4,
        bathrooms: 3,
        year_built: 2010,
        tax_status: 'current'},
      {id: "P003",
        address: "789 Commercial Blvd, Springfield, IL 62703",
        parcel_id: "14-28-402-001",
        current_value: 1250000,
        assessed_value: 1125000,
        assessment_year: 2024,
        property_type: "Commercial",
        square_footage: 8500,
        lot_size: 1.2,
        tax_status: 'current',
        last_sale_date: "2022-11-30",
        last_sale_price: 1200000}
    ];
    setProperties(mockProperties);
  }, []);

  const handlePropertySearch = async () => {setLoading(true);
    try {
      // In a real implementation, this would call the Rust backend
      const filteredProperties = properties.filter(p => 
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.parcel_id.includes(searchQuery)
      );
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setProperties(filteredProperties);} catch (error) {console.error("Property search failed:", error);} finally {setLoading(false);}
  };

  const handleAssessmentRequest = async (property: Property, assessmentType: string, methodology: string) => {try {
      const newRequest: AssessmentRequest = {
        property_id: property.id,
        assessment_type: assessmentType as any,
        methodology: methodology as any,
        priority: 'medium',
        requested_by: 'County Assessor',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]};
      
      setAssessmentRequests(prev => [...prev, newRequest]);
      
      // Simulate assessment process
      setTimeout(() => {const mockResult: AssessmentResult = {
          property_id: property.id,
          assessed_value: property.current_value * (0.9 + Math.random() * 0.2),
          confidence_score: 85 + Math.random() * 10,
          methodology_used: methodology,
          comparable_properties: ['P004', 'P005', 'P006'],
          assessment_factors: {
            location_score: 8.5,
            condition_score: 7.8,
            market_trends: 9.2,
            improvements: 8.0},
          assessment_date: new Date().toISOString().split('T')[0],
          assessor_notes: `Comprehensive ${assessmentType} assessment completed using ${methodology} methodology. Property shows good condition with recent market appreciation.`
        };
        
        setAssessmentResults(prev => [...prev, mockResult]);
      }, 2000);
      
    } catch (error) {console.error("Assessment request failed:", error);}
  };

  const formatCurrency = (amount: number) => {return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'}).format(amount);
  };

  const getStatusColor = (status: string) => {switch (status) {
      case 'current': return '#00ff00';
      case 'delinquent': return '#ff0000';
      case 'exempt': return '#ff9500';
      default: return '#666';}
  };

  return (<div className="assessor-container"><header className="assessor-header"><><h1>Terrafusion Property Assessor</h1><div
</>

className="nav-tabs"><><button 
            className={currentView === 'search' ? 'tab-active' : 'tab'} 
            onClick={() =>setCurrentView('search')}
          >
            Property Search</button><button
</>className={currentView === 'assess' ? 'tab-active' : 'tab'} 
            onClick={() => setCurrentView('assess')}
          >
            Assessment Tools</button><><button 
            className={currentView === 'results' ? 'tab-active' : 'tab'} 
            onClick={() =>setCurrentView('results')}
          >
            Results ({assessmentResults.length})</button><button
</>className={currentView === 'reports' ? 'tab-active' : 'tab'} 
            onClick={() => setCurrentView('reports')}
          >
            Reports</button></div></header><div className="assessor-content">{currentView === 'search' && (<section className="search-panel"><div className="search-controls"><><h2>Property Search</h2><div
</>

className="search-bar"><input
                  type="text"
                  placeholder="Enter address or parcel ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                /><button onClick={handlePropertySearch} className="search-btn" disabled={loading}>{loading ? "Searching..." : "Search"}</button></div></div><div className="properties-grid">{properties.map(property => (<div key={property.id} className="property-card" onClick={() => setSelectedProperty(property)}><div className="property-header"><><h3>{property.address}</h3><span
</>className="tax-status" style={{ color: getStatusColor(property.tax_status)}}>
                      {property.tax_status.toUpperCase()}</span></div><div className="property-details"><div className="detail-row"><><span>Parcel ID:</span><span
</></>>{property.parcel_id}</span></div><div className="detail-row"><><span>Current Value:</span><span
</>

className="value-highlight">{formatCurrency(property.current_value)}</span></div><div className="detail-row"><><span>Assessed Value:</span><span
</></>>{formatCurrency(property.assessed_value)}</span></div><div className="detail-row"><><span>Type:</span><span
</></>>{property.property_type}</span></div></div></div>))}</div></section>)}

        {currentView === 'assess' && selectedProperty && (<section className="assessment-panel"><div className="selected-property"><><h2>Assessment Tools - {selectedProperty.address}</h2><div
</>

className="property-summary"><div className="summary-card"><><h4>Property Details</h4><div
</></>>Square Footage: {selectedProperty.square_footage.toLocaleString()} sq ft</div><div>Lot Size: {selectedProperty.lot_size} acres</div>{selectedProperty.bedrooms &&<div>Bedrooms: {selectedProperty.bedrooms}</div>}
                  {selectedProperty.bathrooms && <div>Bathrooms: {selectedProperty.bathrooms}</div>}
                  {selectedProperty.year_built && <div>Year Built: {selectedProperty.year_built}</div>}
                </div><div className="summary-card"><><h4>Current Valuation</h4><div
</></>>Current Value: {formatCurrency(selectedProperty.current_value)}</div><><div>Assessed Value: {formatCurrency(selectedProperty.assessed_value)}</div><div
</></>>Assessment Year: {selectedProperty.assessment_year}</div><div>Assessment Ratio: {((selectedProperty.assessed_value / selectedProperty.current_value) * 100).toFixed(1)}%</div></div></div></div><div className="assessment-methods"><><h3>Assessment Methods</h3><div
</>

className="method-grid"><div className="method-card"><><h4>Market Value Assessment</h4><p
</></>>Based on recent comparable sales in the area</p><button 
                    className="assess-btn market" 
                    onClick={() =>handleAssessmentRequest(selectedProperty, 'market_value', 'comparable_sales')}
                  >
                    Run Market Assessment</button></div><div className="method-card"><><h4>Cost Approach</h4><p
</></>>Replacement cost minus depreciation</p><button 
                    className="assess-btn cost" 
                    onClick={() =>handleAssessmentRequest(selectedProperty, 'market_value', 'cost_approach')}
                  >
                    Run Cost Assessment</button></div><div className="method-card"><><h4>Income Approach</h4><p
</></>>Based on potential rental income (commercial/investment properties)</p><button 
                    className="assess-btn income" 
                    onClick={() =>handleAssessmentRequest(selectedProperty, 'market_value', 'income_approach')}
                  >
                    Run Income Assessment</button></div><div className="method-card"><><h4>AI/ML Assessment</h4><p
</></>>Advanced machine learning model analysis</p><button 
                    className="assess-btn ai" 
                    onClick={() =>handleAssessmentRequest(selectedProperty, 'market_value', 'ai_ml')}
                  >
                    Run AI Assessment</button></div></div></div></section>)}

        {currentView === 'results' && (<section className="results-panel"><><h2>Assessment Results</h2><div
</>className="results-grid">
              {assessmentResults.map((result /* , index */) => {
                const property = properties.find(p => p.id === result.property_id);
                return (<div key={index} className="result-card"><div className="result-header"><><h3>{property?.address || result.property_id}</h3><div
</>className="confidence-score">
                        Confidence: {result.confidence_score.toFixed(1)}%</div></div><div className="result-details"><div className="detail-row"><><span>Assessed Value:</span><span
</>

className="value-highlight">{formatCurrency(result.assessed_value)}</span></div><div className="detail-row"><><span>Methodology:</span><span
</></>>{result.methodology_used.replace('_', ' ')}</span></div><div className="detail-row"><><span>Assessment Date:</span><span
</></>>{result.assessment_date}</span></div></div><div className="assessment-factors"><h4>Assessment Factors</h4>{Object.entries(result.assessment_factors).map(([factor, score]) => (<div key={factor} className="factor-row"><><span>{factor.replace('_', ' ')}:</span><span
</></>>{score}/10</span></div>))}</div><div className="result-actions"><><button className="action-btn">View Full Report</button><button
</>

className="action-btn">📧 Email Report</button><button className="action-btn">Re-assess</button></div></div>);
              })}</div></section>)}

        {currentView === 'reports' && (<section className="reports-panel"><><h2>Assessment Reports</h2><div
</>

className="reports-controls"><><button className="report-btn">Generate Summary Report</button><button
</>

className="report-btn">📈 Market Trend Report</button><><button className="report-btn">Neighborhood Analysis</button><button
</>

className="report-btn">Assessment Queue</button></div><div className="reports-list"><div className="report-item"><div className="report-info"><><h4>Monthly Assessment Summary - November 2024</h4><p
</></>>Comprehensive report of all assessments completed this month</p><span className="report-date">Generated: Nov 30, 2024</span></div><div className="report-actions"><><button className="action-btn">Download PDF</button><button
</>

className="action-btn">Preview</button></div></div><div className="report-item"><div className="report-info"><><h4>Market Trend Analysis - Q4 2024</h4><p
</></>>Quarterly market analysis with property value trends</p><span className="report-date">Generated: Dec 1, 2024</span></div><div className="report-actions"><><button className="action-btn">Download PDF</button><button
</>

className="action-btn">Preview</button></div></div></div></section>)}</div></div>
  );
}

export default App;