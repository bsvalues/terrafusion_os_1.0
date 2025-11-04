const AppConfig = {
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    
    api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
    },

    collaboration: {
        wsUrl: process.env.WS_URL || 'ws://localhost:3000',
        reconnectAttempts: 5,
        reconnectDelay: 1000,
        pingInterval: 30000
    },

    visualization: {
        defaultTheme: 'light',
        chartDefaults: {
            responsive: true,
            maintainAspectRatio: false,
            animation: true
        },
        colors: {
            primary: '#4ECDC4',
            secondary: '#45B7D1',
            success: '#96CEB4',
            warning: '#FFEEAD',
            error: '#FF6B6B',
            info: '#3498DB'
        }
    },

    plugins: {
        directory: '/plugins',
        autoLoad: true,
        enabledByDefault: true
    },

    security: {
        csrfToken: process.env.CSRF_TOKEN,
        allowedOrigins: ['http://localhost:3000', 'https://terra-fusion.com'],
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100
        }
    },

    performance: {
        debounceDelay: 300,
        throttleDelay: 1000,
        maxHistoryItems: 100,
        maxUndoSteps: 50
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
        maxEntries: 1000,
        persistLogs: true
    },

    features: {
        enableCollaboration: true,
        enablePlugins: true,
        enableVisualization: true,
        enableAnalytics: true,
        enableOfflineMode: true
    },

    ui: {
        theme: {
            light: {
                background: '#FFFFFF',
                text: '#333333',
                primary: '#4ECDC4',
                secondary: '#45B7D1',
                accent: '#96CEB4'
            },
            dark: {
                background: '#1A1A1A',
                text: '#FFFFFF',
                primary: '#4ECDC4',
                secondary: '#45B7D1',
                accent: '#96CEB4'
            }
        },
        layout: {
            sidebarWidth: 280,
            headerHeight: 60,
            footerHeight: 40
        },
        responsive: {
            breakpoints: {
                xs: 0,
                sm: 576,
                md: 768,
                lg: 992,
                xl: 1200
            }
        }
    }
};

export default AppConfig; 