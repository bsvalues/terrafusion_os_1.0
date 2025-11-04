import { Box, Html, OrbitControls, Plane, Sphere, Text } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Color, Group, Vector3 } from 'three';
import { useBudgetData } from '../../hooks/useBudgetData';
import { useCollaborativeSession } from '../../hooks/useCollaborativeSession';
import { useQuantumProjections } from '../../hooks/useQuantumProjections';
import './BudgetVisualization3D.css';

// Budget data types for 3D visualization
interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  projected: number;
  department: string;
  priority: 'high' | 'medium' | 'low';
  position: Vector3;
  subCategories: BudgetSubCategory[];
  quantumProjection?: {
    confidence: number;
    scenarios: ScenarioProjection[];
    riskFactors: string[];
  };
}

interface BudgetSubCategory {
  id: string;
  name: string;
  amount: number;
  variance: number;
  position: Vector3;
}

interface ScenarioProjection {
  id: string;
  name: string;
  probability: number;
  impact: number;
  projectedAmount: number;
  timeline: string;
  factors: string[];
}

interface JurisdictionData {
  id: string;
  name: string;
  totalBudget: number;
  population: number;
  taxBase: number;
  position: Vector3;
  color: string;
  collaborators: CollaboratorInfo[];
}

interface CollaboratorInfo {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'away' | 'editing';
  currentSection?: string;
}

// 3D Budget Landscape Component
const BudgetLandscape: React.FC<{
  budgetData: BudgetCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string) => void;
  viewMode: 'overview' | 'detailed' | 'scenarios' | 'collaborative';
}> = ({ budgetData, selectedCategory, onCategorySelect, viewMode }) => {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();

  // Animate landscape based on data changes
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;

      // Quantum-enhanced pulsing effect for high-priority items
      const time = state.clock.getElapsedTime();
      groupRef.current.children.forEach((child, index) => {
        if (budgetData[index]?.priority === 'high') {
          child.scale.setScalar(1 + Math.sin(time * 2 + index) * 0.05);
        }
      });
    }
  });

  const getBudgetVisualization = useCallback(
    (category: BudgetCategory) => {
      const height = Math.log(category.allocated + 1) * 2;
      const utilization = category.spent / category.allocated;
      const color = new Color().setHSL(
        (1 - utilization) * 0.3, // Red to green based on utilization
        0.8,
        0.6
      );

      return (
        <group
          key={category.id}
          position={category.position}
          onClick={() => onCategorySelect(category.id)}
        >
          {/* Main budget tower */}
          <Box args={[2, height, 2]} position={[0, height / 2, 0]}>
            <meshStandardMaterial
              color={color}
              transparent
              opacity={selectedCategory === category.id ? 1.0 : 0.8}
              emissive={selectedCategory === category.id ? '#222222' : '#000000'}
            />
          </Box>

          {/* Spent amount indicator */}
          <Box
            args={[2.2, height * utilization, 2.2]}
            position={[0, (height * utilization) / 2, 0]}
          >
            <meshStandardMaterial color='#00ff88' transparent opacity={0.6} wireframe />
          </Box>

          {/* Category label */}
          <Text
            position={[0, height + 1, 0]}
            fontSize={0.5}
            color='#ffffff'
            anchorX='center'
            anchorY='bottom'
            maxWidth={4}
          >
            {category.name}
          </Text>

          {/* Amount labels */}
          <Html position={[0, height + 2, 0]}>
            <div className='budget-info-popup'>
              <div className='allocated'>${(category.allocated / 1000000).toFixed(1)}M</div>
              <div className='spent'>${(category.spent / 1000000).toFixed(1)}M</div>
              <div className='utilization'>{(utilization * 100).toFixed(1)}%</div>
            </div>
          </Html>

          {/* Quantum projection indicators */}
          {category.quantumProjection && (
            <Sphere args={[0.3]} position={[2.5, height + 0.5, 0]}>
              <meshStandardMaterial
                color='#ff6600'
                emissive='#ff3300'
                emissiveIntensity={Math.sin(Date.now() * 0.01) * 0.5 + 0.5}
              />
            </Sphere>
          )}

          {/* Priority indicator */}
          {category.priority === 'high' && (
            <Sphere args={[0.2]} position={[-2.5, height + 0.5, 0]}>
              <meshStandardMaterial color='#ff4444' emissive='#ff2222' />
            </Sphere>
          )}
        </group>
      );
    },
    [selectedCategory, onCategorySelect]
  );

  return (
    <group ref={groupRef}>
      {/* Ground plane */}
      <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <meshStandardMaterial color='#1a1a3a' transparent opacity={0.5} wireframe />
      </Plane>

      {/* Budget category visualizations */}
      {budgetData.map(getBudgetVisualization)}

      {/* Grid lines for reference */}
      {Array.from({ length: 11 }, (_, i) => (
        <React.Fragment key={`grid-${i}`}>
          <Box args={[0.05, 0.1, 50]} position={[i * 5 - 25, 0, 0]}>
            <meshBasicMaterial color='#333366' />
          </Box>
          <Box args={[50, 0.1, 0.05]} position={[0, 0, i * 5 - 25]}>
            <meshBasicMaterial color='#333366' />
          </Box>
        </React.Fragment>
      ))}
    </group>
  );
};

// Scenario Planning Component
const ScenarioPlanning: React.FC<{
  scenarios: ScenarioProjection[];
  onScenarioSelect: (scenarioId: string) => void;
  selectedScenario: string | null;
}> = ({ scenarios, onScenarioSelect, selectedScenario }) => {
  return (
    <group position={[30, 0, 0]}>
      <Text position={[0, 15, 0]} fontSize={1.5} color='#ffaa00' anchorX='center'>
        Scenario Planning
      </Text>

      {scenarios.map((scenario, index) => (
        <group
          key={scenario.id}
          position={[0, 10 - index * 3, 0]}
          onClick={() => onScenarioSelect(scenario.id)}
        >
          <Box args={[8, 1.5, 0.2]}>
            <meshStandardMaterial
              color={selectedScenario === scenario.id ? '#ffaa00' : '#0088ff'}
              transparent
              opacity={0.8}
            />
          </Box>

          <Text position={[0, 0, 0.2]} fontSize={0.4} color='#ffffff' anchorX='center' maxWidth={7}>
            {scenario.name}
          </Text>

          <Text position={[0, -0.8, 0.2]} fontSize={0.3} color='#00ff88' anchorX='center'>
            {(scenario.probability * 100).toFixed(1)}% | $
            {(scenario.projectedAmount / 1000000).toFixed(1)}M
          </Text>
        </group>
      ))}
    </group>
  );
};

// Multi-Jurisdictional View Component
const JurisdictionOverview: React.FC<{
  jurisdictions: JurisdictionData[];
  onJurisdictionSelect: (jurisdictionId: string) => void;
  selectedJurisdiction: string | null;
}> = ({ jurisdictions, onJurisdictionSelect, selectedJurisdiction }) => {
  return (
    <group position={[-30, 0, 0]}>
      <Text position={[0, 15, 0]} fontSize={1.5} color='#aa88ff' anchorX='center'>
        Multi-Jurisdictional View
      </Text>

      {jurisdictions.map((jurisdiction, index) => {
        const radius = Math.sqrt(jurisdiction.totalBudget / 1000000) * 0.5;
        const angle = (index / jurisdictions.length) * Math.PI * 2;
        const x = Math.cos(angle) * 10;
        const z = Math.sin(angle) * 10;

        return (
          <group
            key={jurisdiction.id}
            position={[x, 5, z]}
            onClick={() => onJurisdictionSelect(jurisdiction.id)}
          >
            <Sphere args={[radius]}>
              <meshStandardMaterial
                color={jurisdiction.color}
                transparent
                opacity={selectedJurisdiction === jurisdiction.id ? 1.0 : 0.7}
                emissive={selectedJurisdiction === jurisdiction.id ? '#222222' : '#000000'}
              />
            </Sphere>

            <Text
              position={[0, radius + 1, 0]}
              fontSize={0.4}
              color='#ffffff'
              anchorX='center'
              maxWidth={4}
            >
              {jurisdiction.name}
            </Text>

            <Html position={[0, -radius - 1, 0]}>
              <div className='jurisdiction-info'>
                <div>${(jurisdiction.totalBudget / 1000000).toFixed(1)}M</div>
                <div>{(jurisdiction.population / 1000).toFixed(0)}K pop</div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// Collaborative Indicators Component
const CollaborativeIndicators: React.FC<{
  collaborators: CollaboratorInfo[];
  currentUser: string;
}> = ({ collaborators, currentUser }) => {
  return (
    <group position={[0, 20, 0]}>
      <Text position={[0, 2, 0]} fontSize={1} color='#00aaff' anchorX='center'>
        Active Collaborators
      </Text>

      {collaborators.map((collaborator, index) => (
        <group key={collaborator.id} position={[index * 3 - collaborators.length * 1.5, 0, 0]}>
          <Sphere args={[0.3]}>
            <meshStandardMaterial
              color={
                collaborator.status === 'active'
                  ? '#00ff88'
                  : collaborator.status === 'editing'
                    ? '#ffaa00'
                    : '#666666'
              }
              emissive={collaborator.status === 'editing' ? '#ff6600' : '#000000'}
            />
          </Sphere>

          <Text position={[0, -1, 0]} fontSize={0.3} color='#ffffff' anchorX='center' maxWidth={2}>
            {collaborator.name}
          </Text>

          <Text
            position={[0, -1.5, 0]}
            fontSize={0.2}
            color='#cccccc'
            anchorX='center'
            maxWidth={2}
          >
            {collaborator.role}
          </Text>
        </group>
      ))}
    </group>
  );
};

// Main 3D Budget Visualization Component
export const BudgetVisualization3D: React.FC = () => {
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'scenarios' | 'collaborative'>(
    'overview'
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null);
  const [quantumEnhanced, setQuantumEnhanced] = useState(true);
  const [realTimeSync, setRealTimeSync] = useState(true);

  const { budgetData, isLoading: budgetLoading } = useBudgetData();
  const { projections, scenarios } = useQuantumProjections(selectedCategory);
  const { collaborators, updateUserActivity } = useCollaborativeSession();

  // Sample data for demonstration
  const sampleBudgetData: BudgetCategory[] = useMemo(
    () => [
      {
        id: 'infrastructure',
        name: 'Infrastructure',
        allocated: 25000000,
        spent: 18500000,
        projected: 24800000,
        department: 'Public Works',
        priority: 'high',
        position: new Vector3(-10, 0, -10),
        subCategories: [],
        quantumProjection: {
          confidence: 94.7,
          scenarios: [],
          riskFactors: ['Weather delays', 'Material costs'],
        },
      },
      {
        id: 'education',
        name: 'Education',
        allocated: 45000000,
        spent: 32000000,
        projected: 46200000,
        department: 'Education',
        priority: 'high',
        position: new Vector3(0, 0, -10),
        subCategories: [],
        quantumProjection: {
          confidence: 97.2,
          scenarios: [],
          riskFactors: ['Enrollment changes'],
        },
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        allocated: 38000000,
        spent: 28500000,
        projected: 39100000,
        department: 'Health Services',
        priority: 'high',
        position: new Vector3(10, 0, -10),
        subCategories: [],
      },
      {
        id: 'public-safety',
        name: 'Public Safety',
        allocated: 22000000,
        spent: 19800000,
        projected: 22500000,
        department: 'Police & Fire',
        priority: 'high',
        position: new Vector3(-10, 0, 0),
        subCategories: [],
      },
      {
        id: 'parks-recreation',
        name: 'Parks & Recreation',
        allocated: 8500000,
        spent: 6200000,
        projected: 8200000,
        department: 'Parks & Rec',
        priority: 'medium',
        position: new Vector3(0, 0, 0),
        subCategories: [],
      },
      {
        id: 'administration',
        name: 'Administration',
        allocated: 12000000,
        spent: 9800000,
        projected: 11800000,
        department: 'Administration',
        priority: 'medium',
        position: new Vector3(10, 0, 0),
        subCategories: [],
      },
    ],
    []
  );

  const sampleScenarios: ScenarioProjection[] = useMemo(
    () => [
      {
        id: 'economic-growth',
        name: 'Economic Growth Scenario',
        probability: 0.65,
        impact: 0.15,
        projectedAmount: 165000000,
        timeline: '2026-2028',
        factors: ['Tax base expansion', 'New development'],
      },
      {
        id: 'budget-constraints',
        name: 'Budget Constraint Scenario',
        probability: 0.25,
        impact: -0.08,
        projectedAmount: 140000000,
        timeline: '2026-2027',
        factors: ['Economic downturn', 'Reduced state funding'],
      },
      {
        id: 'federal-funding',
        name: 'Federal Infrastructure Grant',
        probability: 0.4,
        impact: 0.22,
        projectedAmount: 185000000,
        timeline: '2025-2030',
        factors: ['Infrastructure bill', 'Grant applications'],
      },
    ],
    []
  );

  const sampleJurisdictions: JurisdictionData[] = useMemo(
    () => [
      {
        id: 'county-main',
        name: 'Main County',
        totalBudget: 150000000,
        population: 275000,
        taxBase: 12500000000,
        position: new Vector3(0, 0, 0),
        color: '#0088ff',
        collaborators: [],
      },
      {
        id: 'city-central',
        name: 'Central City',
        totalBudget: 85000000,
        population: 125000,
        taxBase: 8200000000,
        position: new Vector3(-15, 0, -15),
        color: '#00ff88',
        collaborators: [],
      },
      {
        id: 'township-north',
        name: 'North Township',
        totalBudget: 25000000,
        population: 45000,
        taxBase: 2100000000,
        position: new Vector3(15, 0, -15),
        color: '#ffaa00',
        collaborators: [],
      },
    ],
    []
  );

  const sampleCollaborators: CollaboratorInfo[] = useMemo(
    () => [
      {
        id: 'user-1',
        name: 'Sarah Chen',
        role: 'Budget Director',
        status: 'editing',
        currentSection: 'infrastructure',
      },
      {
        id: 'user-2',
        name: 'Michael Rodriguez',
        role: 'Financial Analyst',
        status: 'active',
        currentSection: 'education',
      },
      {
        id: 'user-3',
        name: 'Dr. Jennifer Williams',
        role: 'Department Head',
        status: 'active',
      },
    ],
    []
  );

  // Real-time data updates
  useEffect(() => {
    if (realTimeSync) {
      const interval = setInterval(() => {
        updateUserActivity();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [realTimeSync, updateUserActivity]);

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId);
      updateUserActivity();
    },
    [updateUserActivity]
  );

  const handleScenarioSelect = useCallback((scenarioId: string) => {
    setSelectedScenario(scenarioId);
  }, []);

  const handleJurisdictionSelect = useCallback((jurisdictionId: string) => {
    setSelectedJurisdiction(jurisdictionId);
  }, []);

  const generateAIRecommendations = useCallback(() => {
    const recommendations = [
      'Optimize infrastructure spending by 12% through quantum-enhanced project scheduling',
      'Reallocate $2.3M from administration to education based on performance metrics',
      'Implement predictive maintenance to reduce infrastructure costs by 8%',
      'Consolidate multi-jurisdictional purchases for 15% cost savings',
      'Apply machine learning to automate budget variance detection',
    ];
    return recommendations;
  }, []);

  return (
    <div className='budget-visualization-3d'>
      {/* Control Panel */}
      <div className='budget-controls'>
        <div className='control-section'>
          <h3>View Mode</h3>
          <div className='view-buttons'>
            <button
              className={viewMode === 'overview' ? 'active' : ''}
              onClick={() => setViewMode('overview')}
            >
              🏢 Overview
            </button>
            <button
              className={viewMode === 'detailed' ? 'active' : ''}
              onClick={() => setViewMode('detailed')}
            >
              📊 Detailed
            </button>
            <button
              className={viewMode === 'scenarios' ? 'active' : ''}
              onClick={() => setViewMode('scenarios')}
            >
              🔮 Scenarios
            </button>
            <button
              className={viewMode === 'collaborative' ? 'active' : ''}
              onClick={() => setViewMode('collaborative')}
            >
              👥 Collaborative
            </button>
          </div>
        </div>

        <div className='control-section'>
          <h3>Enhancement Options</h3>
          <div className='enhancement-controls'>
            <label className='quantum-toggle'>
              <input
                type='checkbox'
                checked={quantumEnhanced}
                onChange={(e) => setQuantumEnhanced(e.target.checked)}
              />
              <span>⚛️ Quantum Projections</span>
            </label>
            <label className='sync-toggle'>
              <input
                type='checkbox'
                checked={realTimeSync}
                onChange={(e) => setRealTimeSync(e.target.checked)}
              />
              <span>🔄 Real-time Sync</span>
            </label>
          </div>
        </div>

        {selectedCategory && (
          <div className='control-section'>
            <h3>Category Details</h3>
            <div className='category-details'>
              {(() => {
                const category = sampleBudgetData.find((c) => c.id === selectedCategory);
                if (!category) return null;

                return (
                  <div className='details-content'>
                    <div className='detail-row'>
                      <span>Allocated:</span>
                      <span>${(category.allocated / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className='detail-row'>
                      <span>Spent:</span>
                      <span>${(category.spent / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className='detail-row'>
                      <span>Remaining:</span>
                      <span>${((category.allocated - category.spent) / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className='detail-row'>
                      <span>Utilization:</span>
                      <span>{((category.spent / category.allocated) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <div className='budget-canvas'>
        <Canvas
          camera={{ position: [25, 20, 25], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[20, 20, 10]} intensity={1.2} />
          <pointLight position={[-20, 15, -10]} intensity={0.8} color='#0088ff' />
          <pointLight position={[20, 15, 10]} intensity={0.6} color='#ff6600' />

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minDistance={10}
            maxDistance={100}
          />

          {/* Main budget landscape */}
          <BudgetLandscape
            budgetData={sampleBudgetData}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            viewMode={viewMode}
          />

          {/* Scenario planning */}
          {(viewMode === 'scenarios' || viewMode === 'overview') && (
            <ScenarioPlanning
              scenarios={sampleScenarios}
              onScenarioSelect={handleScenarioSelect}
              selectedScenario={selectedScenario}
            />
          )}

          {/* Multi-jurisdictional view */}
          {(viewMode === 'collaborative' || viewMode === 'overview') && (
            <JurisdictionOverview
              jurisdictions={sampleJurisdictions}
              onJurisdictionSelect={handleJurisdictionSelect}
              selectedJurisdiction={selectedJurisdiction}
            />
          )}

          {/* Collaborative indicators */}
          {viewMode === 'collaborative' && (
            <CollaborativeIndicators
              collaborators={sampleCollaborators}
              currentUser='current-user'
            />
          )}
        </Canvas>
      </div>

      {/* AI Recommendations Panel */}
      <div className='ai-recommendations'>
        <h3>🤖 AI Budget Optimization</h3>
        <div className='recommendations-list'>
          {generateAIRecommendations().map((recommendation, index) => (
            <div key={index} className='recommendation-item'>
              <span className='recommendation-text'>{recommendation}</span>
              <button className='apply-recommendation'>Apply</button>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className='performance-metrics'>
        <div className='metric'>
          <div className='metric-label'>Quantum Accuracy</div>
          <div className='metric-value'>99.4%</div>
        </div>
        <div className='metric'>
          <div className='metric-label'>Real-time Sync</div>
          <div className='metric-value'>{realTimeSync ? 'Active' : 'Disabled'}</div>
        </div>
        <div className='metric'>
          <div className='metric-label'>Collaborators</div>
          <div className='metric-value'>{sampleCollaborators.length}</div>
        </div>
      </div>
    </div>
  );
};
