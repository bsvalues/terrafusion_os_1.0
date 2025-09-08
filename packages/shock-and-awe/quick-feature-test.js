/**
 * Quick Feature Test for Terrafusion Shock-and-Awe
 */

const fs = require('fs');

console.log('🧪 QUICK FEATURE ANALYSIS');
console.log('========================\n');

// Define features to check
const features = [
    { name: 'CostForge AI', file: 'js/costforge-wizard.js', className: 'CostForgeWizard' },
    { name: 'GIS Pro', file: 'js/gis-viewer.js', className: 'GISViewer' },
    { name: 'Terra-Levy', file: 'js/terra-levy.js', className: 'TerraLevy' },
    { name: 'Terra-Miner', file: 'js/terra-miner.js', className: 'TerraMiner' },
    { name: 'AI Swarm', file: 'js/ai-swarm.js', className: 'AISwarmVisualization' },
    { name: 'Hybrid LLM', file: 'js/hybrid-llm-security.js', className: 'HybridLLMSecurity' }
];

console.log('📜 Checking JavaScript files...\n');

let workingFeatures = 0;

features.forEach(feature => {
    const filePath = `/mnt/e/TerraFusion_OS_1.0/modules/shock-and-awe/${feature.file}`;
    
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasClass = content.includes('class ' + feature.className) || 
                         content.includes('class TerraFusionGIS') || 
                         (feature.className === 'GISViewer' && content.includes('class TerraFusionGIS'));
        const hasWindowExport = content.includes('window.' + feature.className) || content.includes('window.launch');
        const hasShowMethod = content.includes('.show()') || content.includes('show:') || content.includes('function show');
        
        console.log('📄 ' + feature.name + ':');
        console.log('   ✅ File: ' + content.length + ' bytes');
        console.log('   ' + (hasClass ? '✅' : '❌') + ' Class: ' + (hasClass ? 'Found' : 'Missing'));
        console.log('   ' + (hasWindowExport ? '✅' : '❌') + ' Export: ' + (hasWindowExport ? 'Found' : 'Missing')); 
        console.log('   ' + (hasShowMethod ? '✅' : '❌') + ' Show: ' + (hasShowMethod ? 'Found' : 'Missing'));
        
        if (hasClass && hasWindowExport) {
            workingFeatures++;
            console.log('   🎯 STATUS: READY\n');
        } else {
            console.log('   ⚠️  STATUS: NEEDS FIXES\n');
        }
    } else {
        console.log('❌ ' + feature.name + ': FILE MISSING\n');
    }
});

console.log('📊 SUMMARY: ' + workingFeatures + '/' + features.length + ' features ready\n');

// Check main.js launch functions
console.log('🚀 Checking launch functions in main.js...');
const mainJsPath = '/mnt/e/TerraFusion_OS_1.0/modules/shock-and-awe/js/main.js';

if (fs.existsSync(mainJsPath)) {
    const mainContent = fs.readFileSync(mainJsPath, 'utf8');
    const launchFunctions = [
        'launchCostForgeWizard',
        'launchGISViewer',
        'launchTerraLevy', 
        'launchTerraMiner',
        'showAISwarmViz',
        'launchHybridLLMSecurity'
    ];
    
    launchFunctions.forEach(func => {
        const hasFunction = mainContent.includes('window.' + func);
        console.log('   ' + (hasFunction ? '✅' : '❌') + ' ' + func);
    });
} else {
    console.log('❌ main.js not found');
}

console.log('\n🏁 Quick analysis complete!');