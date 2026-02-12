/**
 * CostForge AI - Enhanced Feature Demonstration
 * Showcases all championship-level UI/UX capabilities
 */

class CostForgeDemoSystem {
    constructor() {
        this.demoSteps = [];
        this.currentStep = 0;
        this.isRunning = false;
        this.initializeDemoSystem();
    }

    initializeDemoSystem() {
        this.createDemoInterface();
        this.setupDemoSteps();
        this.addDemoEventListeners();
    }

    createDemoInterface() {
        // Create demo control panel
        const demoPanel = document.createElement('div');
        demoPanel.id = 'demoPanel';
        demoPanel.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--transcend-cyan);
            border-radius: 12px;
            padding: 16px;
            color: white;
            font-size: 0.9rem;
            z-index: 1001;
            min-width: 300px;
            max-width: 400px;
        `;

        demoPanel.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <div style="font-size: 1.5rem;">🎬</div>
                <div>
                    <div style="font-weight: 600; color: var(--transcend-cyan);">CostForge AI Demo</div>
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7);">Championship Features Showcase</div>
                </div>
            </div>

            <div class="demo-controls" style="display: flex; gap: 8px; margin-bottom: 12px;">
                <button id="startDemo" class="quantum-btn" style="padding: 8px 16px; font-size: 0.8rem;">
                    ▶️ Start Demo
                </button>
                <button id="pauseDemo" class="quantum-btn-secondary" style="padding: 8px 16px; font-size: 0.8rem;">
                    ⏸️ Pause
                </button>
                <button id="resetDemo" class="quantum-btn-warning" style="padding: 8px 16px; font-size: 0.8rem;">
                    🔄 Reset
                </button>
            </div>

            <div class="demo-progress" style="margin-bottom: 12px;">
                <div style="font-size: 0.8rem; margin-bottom: 4px; color: rgba(255,255,255,0.7);">
                    Progress: <span id="demoProgress">0/0</span>
                </div>
                <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                    <div id="demoProgressBar" style="width: 0%; height: 100%; background: var(--clarity-gradient); transition: width 0.3s ease;"></div>
                </div>
            </div>

            <div class="demo-current-step" style="font-size: 0.8rem;">
                <div style="color: var(--success-green); margin-bottom: 4px;">Current Step:</div>
                <div id="currentStepText" style="color: rgba(255,255,255,0.9);">Ready to begin demonstration</div>
            </div>

            <div class="demo-features" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 0.8rem; color: var(--transcend-cyan); margin-bottom: 8px;">Features to Demonstrate:</div>
                <div style="font-size: 0.7rem; line-height: 1.4; color: rgba(255,255,255,0.7);">
                    • Glass morphism UI with quantum animations<br>
                    • Real-time performance charts & metrics<br>
                    • Interactive property mapping<br>
                    • Floating action buttons (FAB)<br>
                    • Keyboard shortcuts & quick actions<br>
                    • Notification system<br>
                    • TerraFusion government branding
                </div>
            </div>
        `;

        document.body.appendChild(demoPanel);
    }

    setupDemoSteps() {
        this.demoSteps = [
            {
                title: "Welcome to CostForge AI",
                description: "Showcasing championship-level government transcendence",
                action: () => this.showWelcomeMessage(),
                duration: 3000
            },
            {
                title: "Glass Morphism Interface",
                description: "Demonstrating transcendent UI design",
                action: () => this.highlightGlassElements(),
                duration: 4000
            },
            {
                title: "Real-time Performance Charts",
                description: "Adding live data to performance visualization",
                action: () => this.demonstratePerformanceCharts(),
                duration: 5000
            },
            {
                title: "Interactive Property Map",
                description: "Showing property location intelligence",
                action: () => this.demonstratePropertyMap(),
                duration: 4000
            },
            {
                title: "Advanced Metrics Widgets",
                description: "Updating quantum efficiency and system metrics",
                action: () => this.demonstrateMetricsWidgets(),
                duration: 4000
            },
            {
                title: "Floating Action Buttons",
                description: "Showing quick access controls",
                action: () => this.demonstrateFloatingActions(),
                duration: 5000
            },
            {
                title: "Quick Property Calculation",
                description: "Populating and calculating property valuation",
                action: () => this.demonstrateQuickCalculation(),
                duration: 6000
            },
            {
                title: "Keyboard Shortcuts",
                description: "Demonstrating Ctrl+Enter, Ctrl+R, Ctrl+M shortcuts",
                action: () => this.demonstrateKeyboardShortcuts(),
                duration: 4000
            },
            {
                title: "Notification System",
                description: "Showing success, warning, and info notifications",
                action: () => this.demonstrateNotifications(),
                duration: 5000
            },
            {
                title: "Export Functionality",
                description: "Generating and downloading system report",
                action: () => this.demonstrateExportFeature(),
                duration: 3000
            },
            {
                title: "Demo Complete",
                description: "All CostForge AI features demonstrated successfully",
                action: () => this.showCompletionMessage(),
                duration: 3000
            }
        ];
    }

    addDemoEventListeners() {
        document.getElementById('startDemo').addEventListener('click', () => this.startDemo());
        document.getElementById('pauseDemo').addEventListener('click', () => this.pauseDemo());
        document.getElementById('resetDemo').addEventListener('click', () => this.resetDemo());
    }

    async startDemo() {
        if (this.isRunning) return;

        this.isRunning = true;
        document.getElementById('startDemo').disabled = true;

        for (let i = this.currentStep; i < this.demoSteps.length && this.isRunning; i++) {
            this.currentStep = i;
            const step = this.demoSteps[i];

            this.updateDemoProgress();
            await this.executeStep(step);

            if (this.isRunning) {
                await this.delay(step.duration);
            }
        }

        this.isRunning = false;
        document.getElementById('startDemo').disabled = false;
    }

    pauseDemo() {
        this.isRunning = false;
        document.getElementById('startDemo').disabled = false;
    }

    resetDemo() {
        this.isRunning = false;
        this.currentStep = 0;
        this.updateDemoProgress();
        document.getElementById('startDemo').disabled = false;
        document.getElementById('currentStepText').textContent = 'Ready to begin demonstration';
    }

    async executeStep(step) {
        document.getElementById('currentStepText').textContent = step.description;
        await step.action();
    }

    updateDemoProgress() {
        const progress = `${this.currentStep}/${this.demoSteps.length}`;
        const percentage = (this.currentStep / this.demoSteps.length) * 100;

        document.getElementById('demoProgress').textContent = progress;
        document.getElementById('demoProgressBar').style.width = `${percentage}%`;
    }

    // Demo step implementations
    async showWelcomeMessage() {
        if (window.notifications) {
            window.notifications.show('Welcome to CostForge AI Championship Demo!', 'success', 3000);
        }
    }

    async highlightGlassElements() {
        const glassCards = document.querySelectorAll('.glass-card');
        glassCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.border = '2px solid var(--transcend-cyan)';
                card.style.boxShadow = '0 0 20px rgba(0, 255, 238, 0.5)';

                setTimeout(() => {
                    card.style.border = '';
                    card.style.boxShadow = '';
                }, 1500);
            }, index * 500);
        });
    }

    async demonstratePerformanceCharts() {
        if (window.performanceChart) {
            for (let i = 0; i < 5; i++) {
                const accuracy = 97 + Math.random() * 2;
                const responseTime = 40 + Math.random() * 20;
                window.performanceChart.addDataPoint(accuracy, responseTime);
                await this.delay(800);
            }
        }

        if (window.notifications) {
            window.notifications.show('Performance charts updated with real-time data', 'info', 2000);
        }
    }

    async demonstratePropertyMap() {
        if (window.propertyMap) {
            const locations = [
                { lat: 47.6062, lng: -122.3321 },
                { lat: 47.6205, lng: -122.3493 },
                { lat: 47.5952, lng: -122.3316 }
            ];

            for (const location of locations) {
                window.propertyMap.updatePropertyLocation(location.lat, location.lng);
                await this.delay(1000);
            }
        }

        if (window.notifications) {
            window.notifications.show('Property map updated with location intelligence', 'success', 2000);
        }
    }

    async demonstrateMetricsWidgets() {
        if (window.metricsWidget) {
            window.metricsWidget.updateMetrics();
        }

        if (window.notifications) {
            window.notifications.show('System metrics refreshed - Quantum efficiency optimal', 'info', 2000);
        }
    }

    async demonstrateFloatingActions() {
        const fabMain = document.querySelector('.fab-main');
        if (fabMain) {
            // Highlight the FAB
            fabMain.style.transform = 'scale(1.2)';
            fabMain.style.boxShadow = '0 8px 32px rgba(0, 255, 238, 0.8)';

            await this.delay(1000);

            // Show actions
            if (window.costForgeUI) {
                window.costForgeUI.toggleQuickActions();
            }

            await this.delay(2000);

            // Reset FAB
            fabMain.style.transform = '';
            fabMain.style.boxShadow = '';

            // Hide actions
            if (window.costForgeUI) {
                window.costForgeUI.toggleQuickActions();
            }
        }

        if (window.notifications) {
            window.notifications.show('Floating action buttons demonstrated', 'success', 2000);
        }
    }

    async demonstrateQuickCalculation() {
        if (window.costForgeUI) {
            window.costForgeUI.quickCalculate();
            await this.delay(2000);
            window.costForgeUI.handleQuickCalculation();
        }

        if (window.notifications) {
            window.notifications.show('Quick calculation completed with quantum precision', 'success', 2000);
        }
    }

    async demonstrateKeyboardShortcuts() {
        if (window.notifications) {
            window.notifications.show('Keyboard shortcuts: Ctrl+Enter (calculate), Ctrl+R (report), Ctrl+M (map)', 'info', 4000);
        }
    }

    async demonstrateNotifications() {
        if (window.notifications) {
            window.notifications.show('Success notification example', 'success', 2000);
            await this.delay(1000);
            window.notifications.show('Warning notification example', 'warning', 2000);
            await this.delay(1000);
            window.notifications.show('Info notification example', 'info', 2000);
        }
    }

    async demonstrateExportFeature() {
        if (window.costForgeUI) {
            window.costForgeUI.exportReport();
        }

        if (window.notifications) {
            window.notifications.show('System report exported successfully', 'success', 2000);
        }
    }

    async showCompletionMessage() {
        if (window.notifications) {
            window.notifications.show('🎉 Demo completed! All CostForge AI features showcased.', 'success', 5000);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize demo system when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for other components to load
    setTimeout(() => {
        window.costForgeDemoSystem = new CostForgeDemoSystem();

        if (window.notifications) {
            window.notifications.show('Demo system ready! Click "Start Demo" to begin showcase.', 'info', 5000);
        }
    }, 2000);
});
