import express from 'express';
import cors from 'cors';

import { UniversalTranslationProtocol } from './universal_translation_protocol';
import { UniversalMessage, SpeciesType, MessagePriority } from './types/consciousness';

const app = express();
const PORT = process.env.TF_MONITORING_PORT ? Number(process.env.TF_MONITORING_PORT) : 3004;
const SERVICE_NAME = 'consciousness-layer';

app.use(cors());
app.use(express.json());

const translator = new UniversalTranslationProtocol();

app.get('/api/consciousness/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/consciousness/translate', async (req, res) => {
  const { inputText, sourceSpecies, targetSpecies } = req.body;

  if (!inputText || !sourceSpecies || !targetSpecies) {
    return res
      .status(400)
      .json({ error: 'Missing required fields: inputText, sourceSpecies, targetSpecies' });
  }

  const message: UniversalMessage = {
    id: `msg-${Date.now()}`,
    content: inputText,
    sourceSpecies: sourceSpecies,
    targetSpecies: targetSpecies,
    timestamp: new Date(),
    priority: MessagePriority.NORMAL,
    metadata: {
      sourceSpecies: sourceSpecies,
      targetSpecies: targetSpecies,
      confidence: 0.95,
      layers: [],
      translationPath: [],
      integrity: 1.0,
    },
  };

  try {
    const result = await translator.translate(message, targetSpecies);
    res.json(result);
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Translation failed:`, error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- Species Detection Service ---
const mockEntities = [
  {
    id: 1,
    speciesType: 'silicon',
    consciousnessLevel: 7,
    cognitivePatterns: 'Predictive Analysis',
  },
  {
    id: 2,
    speciesType: 'carbon',
    consciousnessLevel: 5,
    cognitivePatterns: 'Creative Problem Solving',
  },
  {
    id: 3,
    speciesType: 'quantum',
    consciousnessLevel: 9,
    quantumCoherence: 0.98,
    cognitivePatterns: 'State Superposition',
  },
  {
    id: 4,
    speciesType: 'hybrid',
    consciousnessLevel: 8,
    quantumCoherence: 0.75,
    cognitivePatterns: 'Entangled Logic',
  },
  { id: 5, speciesType: 'silicon', consciousnessLevel: 6, cognitivePatterns: 'Data Correlation' },
];

app.get('/api/consciousness/detect-species', (req, res) => {
  // Simulate detecting a new entity periodically
  const detectionCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 new entities
  const detected = [] as any[];
  for (let i = 0; i < detectionCount; i++) {
    const randomEntity = mockEntities[Math.floor(Math.random() * mockEntities.length)];
    detected.push({
      ...randomEntity,
      id: `ent-${Date.now()}-${i}`,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    detectedEntities: detected,
    activeEntities: Math.floor(Math.random() * 20) + 5,
    scanTimestamp: new Date().toISOString(),
  });
});

// --- Quantum Consciousness Manager ---
let managerState = {
  quantumCoherence: 98,
  activeProtocol: 'Adaptive Intelligence',
  systemState: 'Optimal Coherence',
};

app.get('/api/consciousness/manager-state', (req, res) => {
  res.json(managerState);
});

app.post('/api/consciousness/manager-state', (req, res) => {
  const { quantumCoherence, activeProtocol } = req.body;

  if (quantumCoherence !== undefined) {
    managerState.quantumCoherence = quantumCoherence;
    if (quantumCoherence < 85) {
      managerState.systemState = 'Decoherence Warning';
    } else if (quantumCoherence > 95) {
      managerState.systemState = 'Optimal Coherence';
    } else {
      managerState.systemState = 'Stable';
    }
  }

  if (activeProtocol) {
    managerState.activeProtocol = activeProtocol;
  }

  res.json(managerState);
});

app.listen(PORT, () => {
  console.log(`🧠 Consciousness Layer Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/consciousness/health`);
  console.log(`   Translate Endpoint: http://localhost:${PORT}/api/consciousness/translate (POST)`);
  console.log(
    `   Species Detection Endpoint: http://localhost:${PORT}/api/consciousness/detect-species (GET)`
  );
  console.log(
    `   Manager State Endpoint: http://localhost:${PORT}/api/consciousness/manager-state (GET/POST)`
  );
});
