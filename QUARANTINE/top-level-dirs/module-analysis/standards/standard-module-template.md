# Standard Terrafusion Module Structure

```
module-name/
├── README.md                 # Module documentation
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Build configuration
├── src/                    # Source code
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Main component
│   ├── components/        # Reusable components
│   ├── services/          # Business logic
│   ├── types/             # TypeScript definitions
│   └── styles/            # Styling files
├── src-tauri/             # Tauri backend (if native)
│   ├── Cargo.toml         # Rust dependencies
│   ├── src/               # Rust source
│   └── tauri.conf.json    # Tauri configuration
├── tests/                 # Test files
├── docs/                  # Additional documentation
└── dist/                  # Build output
```
