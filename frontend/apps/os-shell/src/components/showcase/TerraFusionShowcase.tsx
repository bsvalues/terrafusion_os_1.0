/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION COMPONENT SHOWCASE
 * Demonstration of all TerraFusion components working together
 * ═══════════════════════════════════════════════════════════════
 */

import {
  QuantumCheckbox,
  QuantumFormGroup,
  QuantumRadioGroup,
  QuantumSelect,
  QuantumSwitch,
  QuantumTextarea,
} from '@/components/forms/QuantumFormComponents';
import * as LucideIcons from 'lucide-react';
import { useState } from 'react';

// Dashboard Components
import {
  QuantumChartWidget,
  QuantumDataGrid,
  QuantumMetricCard,
  QuantumStatusIndicator,
  QuantumWidgetContainer,
} from '@/components/dashboard/DashboardWidgets';

// Notification Components
import {
  NotificationProvider,
  QuantumAlertBanner,
  QuantumStatusBadge,
  useToast,
} from '@/components/notifications/NotificationSystem';

// ═══ SAMPLE DATA ═══
const chartData = [
  { label: 'Jan', value: 65, color: '#00FFFF' },
  { label: 'Feb', value: 78, color: '#0080FF' },
  { label: 'Mar', value: 52, color: '#00CCCC' },
  { label: 'Apr', value: 91, color: '#0099FF' },
  { label: 'May', value: 87, color: '#00AAAA' },
  { label: 'Jun', value: 94, color: '#0066FF' },
];

const gridData = [
  { id: 1, name: 'John Doe', role: 'Administrator', status: 'Active', lastLogin: '2024-01-15' },
  { id: 2, name: 'Jane Smith', role: 'Operator', status: 'Active', lastLogin: '2024-01-14' },
  { id: 3, name: 'Bob Johnson', role: 'Viewer', status: 'Inactive', lastLogin: '2024-01-10' },
  { id: 4, name: 'Alice Brown', role: 'Administrator', status: 'Active', lastLogin: '2024-01-15' },
];

const gridColumns = [
  { key: 'id', label: 'ID', width: '60px' },
  { key: 'name', label: 'Name', width: '150px' },
  { key: 'role', label: 'Role', width: '120px' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'lastLogin', label: 'Last Login', width: '120px' },
];

// ═══ DEMO COMPONENT ═══
function TerraFusionShowcase() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    selectedOption: '',
    checkboxValue: false,
    radioValue: '',
    textareaValue: '',
    switchValue: false,
  });

  // Sample notification handlers
  const showSuccessToast = () => {
    toast.success('Quantum Protocol Activated', 'All systems are operating at optimal parameters');
  };

  const showErrorToast = () => {
    toast.error('System Alert', 'Quantum coherence levels below threshold', {
      persistent: true,
      actions: [
        { label: 'Recalibrate', action: () => console.log('Recalibrating...'), variant: 'primary' },
        { label: 'Ignore', action: () => console.log('Ignored'), variant: 'secondary' },
      ],
    });
  };

  const showWarningToast = () => {
    toast.warning('Resource Warning', 'CPU usage approaching 85% capacity');
  };

  const showInfoToast = () => {
    toast.info('System Update', 'New quantum features available', {
      variant: 'quantum',
      glow: true,
    });
  };

  const handleRefresh = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Data refreshed');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6'>
      <div className='max-w-7xl mx-auto space-y-8'>
        {/* Header */}
        <div className='text-center space-y-4'>
          <h1 className='text-4xl font-bold text-white'>
            <span className='text-cyan-400'>TerraFusion</span> Component Showcase
          </h1>
          <p className='text-slate-300 text-lg'>
            Quantum-themed components with terra-cyan styling and advanced animations
          </p>
        </div>

        {/* Alert Banner */}
        <QuantumAlertBanner
          type='info'
          title='System Status'
          message='All quantum governance protocols are operational. Terra-cyan subsystems functioning normally.'
          variant='quantum'
          glow
        />

        {/* Toast Notification Demos */}
        <QuantumWidgetContainer
          title='Notification System'
          subtitle='Toast notifications with quantum effects'
          variant='glass'
          glow
        >
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <button
              onClick={showSuccessToast}
              className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors'
            >
              Success Toast
            </button>
            <button
              onClick={showErrorToast}
              className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors'
            >
              Error Toast
            </button>
            <button
              onClick={showWarningToast}
              className='px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors'
            >
              Warning Toast
            </button>
            <button
              onClick={showInfoToast}
              className='px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors'
            >
              Quantum Toast
            </button>
          </div>

          <div className='flex flex-wrap gap-4 mt-6'>
            <QuantumStatusBadge type='success' label='Online' pulse glow />
            <QuantumStatusBadge type='warning' label='Warning' variant='quantum' />
            <QuantumStatusBadge type='error' label='Critical' pulse />
            <QuantumStatusBadge type='info' label='Quantum Mode' variant='quantum' glow />
          </div>
        </QuantumWidgetContainer>

        {/* Metrics Dashboard */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <QuantumMetricCard
            title='Active Users'
            value='1,247'
            change={12.5}
            trend='up'
            icon={(() => {
              const UsersIcon = LucideIcons.Users as any;
              return <UsersIcon className='w-6 h-6' />;
            })()}
            variant='quantum'
            glow
          />
          <QuantumMetricCard
            title='Revenue'
            value='$89.2K'
            change={-3.2}
            trend='down'
            icon={(() => {
              const DollarSignIcon = LucideIcons.DollarSign as any;
              return <DollarSignIcon className='w-6 h-6' />;
            })()}
            variant='glass'
          />
          <QuantumMetricCard
            title='System Load'
            value='67%'
            change={5.1}
            trend='up'
            icon={(() => {
              const ActivityIcon = LucideIcons.Activity as any;
              return <ActivityIcon className='w-6 h-6' />;
            })()}
            variant='default'
          />
          <QuantumMetricCard
            title='Success Rate'
            value='98.7%'
            change={0.3}
            trend='up'
            icon={(() => {
              const TargetIcon = LucideIcons.Target as any;
              return <TargetIcon className='w-6 h-6' />;
            })()}
            variant='quantum'
            glow
          />
        </div>

        {/* Charts and Data Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <QuantumChartWidget
            title='Quantum Performance Metrics'
            data={chartData}
            type='bar'
            variant='quantum'
            height={300}
            refreshable
            onRefresh={handleRefresh}
            glow
          />

          <QuantumChartWidget
            title='Terra-Cyan Oscillation Pattern'
            data={chartData}
            type='line'
            variant='glass'
            height={300}
            refreshable
            onRefresh={handleRefresh}
          />
        </div>

        {/* Status Indicators */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <QuantumStatusIndicator
            title='Quantum Core'
            status='online'
            description='All quantum processing units operating within normal parameters'
            uptime='99.97%'
            variant='quantum'
            glow
          />
          <QuantumStatusIndicator
            title='Terra Network'
            status='warning'
            description='Minor latency detected in terra-cyan transmission protocols'
            uptime='99.12%'
            variant='glass'
          />
          <QuantumStatusIndicator
            title='Backup Systems'
            status='maintenance'
            description='Scheduled maintenance in progress'
            uptime='98.45%'
            variant='default'
          />
        </div>

        {/* Form Components */}
        <QuantumWidgetContainer
          title='Quantum Form Controls'
          subtitle='Advanced form inputs with terra-cyan theming'
          variant='quantum'
          glow
        >
          <QuantumFormGroup
            title='User Configuration'
            description='Configure quantum governance parameters'
            variant='glass'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-4'>
                <QuantumSelect
                  label='Quantum Mode'
                  placeholder='Select quantum mode...'
                  options={[
                    { value: 'standard', label: 'Standard Protocol' },
                    { value: 'enhanced', label: 'Enhanced Terra-Cyan' },
                    { value: 'maximum', label: 'Maximum Quantum Coherence' },
                  ]}
                  value={formData.selectedOption}
                  onChange={(value) => setFormData((prev) => ({ ...prev, selectedOption: value }))}
                  variant='quantum'
                  glow
                />

                <QuantumTextarea
                  label='Quantum Instructions'
                  placeholder='Enter quantum protocol instructions...'
                  value={formData.textareaValue}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, textareaValue: e.target.value }))
                  }
                  variant='glass'
                  rows={4}
                />
              </div>

              <div className='space-y-4'>
                <QuantumRadioGroup
                  label='Terra-Cyan Intensity'
                  name='intensity'
                  options={[
                    { value: 'low', label: 'Low Intensity' },
                    { value: 'medium', label: 'Medium Intensity' },
                    { value: 'high', label: 'High Intensity' },
                  ]}
                  value={formData.radioValue}
                  onChange={(value) => setFormData((prev) => ({ ...prev, radioValue: value }))}
                  variant='quantum'
                  layout='vertical'
                />

                <div className='space-y-3'>
                  <QuantumCheckbox
                    label='Enable quantum authentication protocols'
                    checked={formData.checkboxValue}
                    onChange={(checked) =>
                      setFormData((prev) => ({ ...prev, checkboxValue: checked }))
                    }
                    variant='quantum'
                    glow
                  />

                  <QuantumSwitch
                    label='Activate terra-cyan enhancements'
                    checked={formData.switchValue}
                    onChange={(checked) =>
                      setFormData((prev) => ({ ...prev, switchValue: checked }))
                    }
                    size='lg'
                    variant='quantum'
                    glow
                  />
                </div>
              </div>
            </div>
          </QuantumFormGroup>
        </QuantumWidgetContainer>

        {/* Data Grid */}
        <QuantumDataGrid
          title='System User Registry'
          columns={gridColumns}
          data={gridData}
          variant='quantum'
          searchable
          sortable
          maxRows={10}
          glow
        />

        {/* Footer */}
        <div className='text-center text-slate-400 py-8'>
          <p>TerraFusion Quantum Governance Platform v1.0</p>
          <p className='text-sm mt-2'>
            Powered by terra-cyan consciousness and quantum effect engineering
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══ MAIN APP COMPONENT ═══
export default function TerraFusionComponentShowcase() {
  return (
    <NotificationProvider>
      <TerraFusionShowcase />
    </NotificationProvider>
  );
}
