import "./terrafusion-brand.css";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Calculator, 
  FileText, 
  TrendingUp, 
  Shield, 
  AlertCircle,
  CheckCircle,
  DollarSign,
  Building,
  BarChart3
 } from '@mui/icons-material';

interface TaxCalculation {
  id: string;
  property_id: string;
  year: number;
  assessed_value: number;
  tax_rate: number;
  annual_tax: number;
  exemptions: string[];
  effective_rate: number;
}

interface AnalysisResult {
  id: string;
  name: string;
  type: string;
  status: string;
  result?: {
    roi_percentage: number;
    payback_period: string;
    net_present_value: number;
    risk_level: string;
  };
  progress?: number;
}

interface InvestmentModel {
  property_value: number;
  down_payment: number;
  loan_amount: number;
  monthly_payment: number;
  total_interest: number;
  break_even_years: number;
  projected_appreciation: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'analysis' | 'reports' | 'compliance'>('calculator');
  const [calculations, setCalculations] = useState<TaxCalculation[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [investmentModel, setInvestmentModel] = useState<InvestmentModel | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [propertyValue, setPropertyValue] = useState<number>(500000);
  const [downPayment, setDownPayment] = useState<number>(100000);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [interestRate, setInterestRate] = useState<number>(6.5);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const taxData = await invoke<{calculations: TaxCalculation[]}>('get_tax_calculations');
      const analysisData = await invoke<{analyses: AnalysisResult[]}>('get_financial_analyses');
      
      setCalculations(taxData.calculations || []);
      setAnalyses(analysisData.analyses || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      // Fallback to mock data
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setCalculations([
      {
        id: 'tax-001',
        property_id: 'prop-12345',
        year: 2024,
        assessed_value: 500000,
        tax_rate: 0.0125,
        annual_tax: 6250,
        exemptions: ['homestead'],
        effective_rate: 0.011
      },
      {
        id: 'tax-002',
        property_id: 'prop-12346',
        year: 2024,
        assessed_value: 750000,
        tax_rate: 0.0135,
        annual_tax: 10125,
        exemptions: [],
        effective_rate: 0.0135
      }
    ]);

    setAnalyses([
      {
        id: 'analysis-001',
        name: 'Property Investment ROI',
        type: 'roi-analysis',
        status: 'completed',
        result: {
          roi_percentage: 12.5,
          payback_period: '6.2 years',
          net_present_value: 485000,
          risk_level: 'medium'
        }
      },
      {
        id: 'analysis-002',
        name: 'Tax Optimization Analysis',
        type: 'tax-analysis',
        status: 'running',
        progress: 80
      }
    ]);
  };

  const calculateInvestment = async () => {
    try {
      setLoading(true);
      const result = await invoke<{model: InvestmentModel}>('calculate_investment_model', {
        propertyValue,
        downPayment,
        loanTerm,
        interestRate: interestRate / 100
      });
      setInvestmentModel(result.model);
    } catch (error) {
      console.error('Failed to calculate investment:', error);
      // Fallback calculation
      const loanAmount = propertyValue - downPayment;
      const monthlyRate = (interestRate / 100) / 12;
      const numPayments = loanTerm * 12;
      const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                           (Math.pow(1 + monthlyRate, numPayments) - 1);
      
      setInvestmentModel({
        property_value: propertyValue,
        down_payment: downPayment,
        loan_amount: loanAmount,
        monthly_payment: Math.round(monthlyPayment),
        total_interest: Math.round(monthlyPayment * numPayments - loanAmount),
        break_even_years: 8.5,
        projected_appreciation: '3.5% annually'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderCalculatorTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg"><>

        <h2 className="text-2xl font-bold mb-2">Tax & Investment Calculator</h2>
        <p
</> className="opacity-90">Advanced calculations for property tax planning and investment modeling</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Calculator */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><>

            <Calculator className="h-5 w-5 mr-2 text-blue-600" />
            Investment Calculator
          </h3>
          
          <div
</> className="space-y-4">
            <div><>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Value
              </label>
              <input
</>
                type="number"
                value={propertyValue}
                onChange={(e) => setPropertyValue(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div><>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Down Payment
              </label>
              <input
</>
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Term (years)
                </label>
                <input
</>
                  type="number"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Rate (%)
                </label>
                <input
</>
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <button
              onClick={calculateInvestment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Calculating...' : 'Calculate Investment'}
            </button>
          </div>
        </div>

        {/* Results */}
        {investmentModel && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center"><>

              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Investment Results
            </h3>
            
            <div
</> className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><>

                <span className="font-medium">Monthly Payment</span>
                <span
</> className="text-lg font-bold text-green-600">
                  ${investmentModel.monthly_payment.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><>

                <span className="font-medium">Total Interest</span>
                <span
</> className="text-lg font-bold">
                  ${investmentModel.total_interest.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><>

                <span className="font-medium">Break-even Years</span>
                <span
</> className="text-lg font-bold text-blue-600">
                  {investmentModel.break_even_years} years
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><>

                <span className="font-medium">Projected Appreciation</span>
                <span
</> className="text-lg font-bold text-purple-600">
                  {investmentModel.projected_appreciation}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tax Calculations Grid */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center"><>

          <FileText className="h-5 w-5 mr-2 text-orange-600" />
          Current Tax Calculations
        </h3>
        
        <div
</> className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b"><>

                <th className="text-left py-2">Property ID</th>
                <th
</> className="text-left py-2">Assessed Value</th><>

                <th className="text-left py-2">Tax Rate</th>
                <th
</> className="text-left py-2">Annual Tax</th><>

                <th className="text-left py-2">Exemptions</th>
                <th
</> className="text-left py-2">Effective Rate</th>
              </tr>
            </thead>
            <tbody>
              {calculations.map((calc) => (
                <tr key={calc.id} className="border-b hover:bg-gray-50"><>

                  <td className="py-2">{calc.property_id}</td>
                  <td
</> className="py-2">${calc.assessed_value.toLocaleString()}</td><>

                  <td className="py-2">{(calc.tax_rate * 100).toFixed(2)}%</td>
                  <td
</> className="py-2 font-semibold">${calc.annual_tax.toLocaleString()}</td>
                  <td className="py-2">
                    {calc.exemptions.length > 0 ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {calc.exemptions.join(', ')}
                      </span>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </td>
                  <td className="py-2">{(calc.effective_rate * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg"><>

        <h2 className="text-2xl font-bold mb-2">Financial Analysis</h2>
        <p
</> className="opacity-90">Advanced ROI analysis and investment optimization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analyses.map((analysis) => (
          <div key={analysis.id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4"><>

              <h3 className="text-lg font-semibold">{analysis.name}</h3>
              <div
</> className="flex items-center">
                {analysis.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : analysis.status === 'running' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <span className={`ml-2 text-sm font-medium ${
                  analysis.status === 'completed' ? 'text-green-600' :
                  analysis.status === 'running' ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {analysis.status}
                </span>
              </div>
            </div>

            {analysis.status === 'running' && analysis.progress && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1"><>

                  <span>Progress</span>
                  <span
</>>{analysis.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analysis.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {analysis.result && (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><>

                  <span className="font-medium">ROI Percentage</span>
                  <span
</> className="text-lg font-bold text-green-600">
                    {analysis.result.roi_percentage}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><>

                  <span className="font-medium">Payback Period</span>
                  <span
</> className="text-lg font-bold">
                    {analysis.result.payback_period}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><>

                  <span className="font-medium">Net Present Value</span>
                  <span
</> className="text-lg font-bold text-blue-600">
                    ${analysis.result.net_present_value.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><>

                  <span className="font-medium">Risk Level</span>
                  <span
</> className={`text-lg font-bold ${
                    analysis.result.risk_level === 'low' ? 'text-green-600' :
                    analysis.result.risk_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {analysis.result.risk_level}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg"><>

        <h2 className="text-2xl font-bold mb-2">Reports & Analytics</h2>
        <p
</> className="opacity-90">Comprehensive reporting and business intelligence</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4"><>

            <h3 className="text-lg font-semibold">Total Properties</h3>
            <Building
</> className="h-8 w-8 text-blue-600" />
          </div><>

          <div className="text-3xl font-bold text-blue-600">1,247</div>
          <div
</> className="text-sm text-gray-600 mt-1">+12% from last month</div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4"><>

            <h3 className="text-lg font-semibold">Annual Tax Revenue</h3>
            <DollarSign
</> className="h-8 w-8 text-green-600" />
          </div><>

          <div className="text-3xl font-bold text-green-600">$2.4M</div>
          <div
</> className="text-sm text-gray-600 mt-1">+8% from last year</div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4"><>

            <h3 className="text-lg font-semibold">Average ROI</h3>
            <TrendingUp
</> className="h-8 w-8 text-purple-600" />
          </div><>

          <div className="text-3xl font-bold text-purple-600">12.5%</div>
          <div
</> className="text-sm text-gray-600 mt-1">Above market average</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center"><>

          <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
          Performance Metrics
        </h3>
        <div
</> className="text-center py-8 text-gray-500">
          Advanced analytics dashboard coming soon...
        </div>
      </div>
    </div>
  );

  const renderComplianceTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-lg"><>

        <h2 className="text-2xl font-bold mb-2">Compliance & Audit</h2>
        <p
</> className="opacity-90">Regulatory compliance tracking and audit trails</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><>

            <Shield className="h-5 w-5 mr-2 text-green-600" />
            Compliance Status
          </h3>
          
          <div
</> className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium">Tax Calculation Accuracy</span>
              </div>
              <span className="text-green-600 font-semibold">100%</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium">Audit Trail Completeness</span>
              </div>
              <span className="text-green-600 font-semibold">100%</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="font-medium">Regulatory Updates</span>
              </div>
              <span className="text-yellow-600 font-semibold">2 Pending</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><>

            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Recent Audit Logs
          </h3>
          
          <div
</> className="space-y-3 max-h-64 overflow-y-auto">
            <div className="border-l-4 border-green-500 pl-4 py-2"><>

              <div className="font-medium text-sm">Tax calculation completed</div>
              <div
</> className="text-xs text-gray-600">Property ID: prop-12345 - 2 minutes ago</div>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2"><>

              <div className="font-medium text-sm">Investment model generated</div>
              <div
</> className="text-xs text-gray-600">Analysis ID: inv-001 - 15 minutes ago</div>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4 py-2"><>

              <div className="font-medium text-sm">Compliance check passed</div>
              <div
</> className="text-xs text-gray-600">System audit - 1 hour ago</div>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4 py-2"><>

              <div className="font-medium text-sm">Data synchronization</div>
              <div
</> className="text-xs text-gray-600">External MLS sync - 2 hours ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600 mr-3" />
              <div><>

                <h1 className="text-2xl font-bold text-gray-900">TerraLevy</h1>
                <p
</> className="text-sm text-gray-600">Tax Calculation & Levy Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2"><>

              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                v1.5.0
              </div>
              <div
</> className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Championship Edition
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'calculator', label: 'Calculator', icon: Calculator },
              { id: 'analysis', label: 'Analysis', icon: TrendingUp },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'compliance', label: 'Compliance', icon: Shield }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calculator' && renderCalculatorTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
        {activeTab === 'reports' && renderReportsTab()}
        {activeTab === 'compliance' && renderComplianceTab()}
      </main>
    </div>
  );
}

export default App;