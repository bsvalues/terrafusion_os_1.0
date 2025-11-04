#!/usr/bin/env python3
"""
TerraFusion Code Quality & Standards Deployer
THE TERRAFUSION WAY - Government-grade ESLint/Prettier across all 57 workspaces
"""

import json
import os
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TerraFusionCodeQualityDeployer:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.analysis_file = self.root_path / "workspace_analysis_results.json"
        self.created_files = []
        self.updated_workspaces = []

    def load_workspace_analysis(self) -> dict:
        """Load the workspace analysis results"""
        with open(self.analysis_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def get_workspace_categories(self, workspace_details: dict) -> dict[str, list[str]]:
        """Categorize workspaces for targeted code quality setup"""
        categories = {
            "frontend": [],
            "marketplace": [],
            "platform": [],
            "core": []
        }

        for workspace_name, details in workspace_details.items():
            category = details.get('category', 'core')
            categories[category].append(workspace_name)

        return categories

    def create_eslint_config(self, workspace_path: Path, workspace_type: str) -> bool:
        """Create ESLint configuration for government compliance"""
        if workspace_type in ["frontend", "marketplace"]:
            eslint_config = {
                "env": {
                    "browser": True,
                    "es2022": True,
                    "node": True,
                    "jest": True
                },
                "extends": [
                    "eslint:recommended",
                    "@typescript-eslint/recommended",
                    "@typescript-eslint/recommended-requiring-type-checking",
                    "plugin:react/recommended",
                    "plugin:react-hooks/recommended",
                    "plugin:jsx-a11y/recommended",
                    "plugin:security/recommended"
                ],
                "parser": "@typescript-eslint/parser",
                "parserOptions": {
                    "ecmaFeatures": {"jsx": True},
                    "ecmaVersion": "latest",
                    "sourceType": "module",
                    "project": "./tsconfig.json"
                },
                "plugins": [
                    "@typescript-eslint",
                    "react",
                    "react-hooks",
                    "jsx-a11y",
                    "security",
                    "import"
                ],
                "rules": {
                    # TypeScript strict rules
                    "@typescript-eslint/no-explicit-any": "error",
                    "@typescript-eslint/explicit-function-return-type": "error",
                    "@typescript-eslint/no-unused-vars": "error",
                    "@typescript-eslint/prefer-const": "error",
                    "@typescript-eslint/no-inferrable-types": "off",

                    # Government security requirements
                    "security/detect-object-injection": "error",
                    "security/detect-non-literal-regexp": "error",
                    "security/detect-unsafe-regex": "error",
                    "security/detect-buffer-noassert": "error",
                    "security/detect-child-process": "error",
                    "security/detect-disable-mustache-escape": "error",
                    "security/detect-eval-with-expression": "error",
                    "security/detect-no-csrf-before-method-override": "error",
                    "security/detect-non-literal-fs-filename": "error",
                    "security/detect-non-literal-require": "error",
                    "security/detect-possible-timing-attacks": "error",
                    "security/detect-pseudoRandomBytes": "error",

                    # WCAG 2.2 AA Accessibility requirements
                    "jsx-a11y/alt-text": "error",
                    "jsx-a11y/aria-props": "error",
                    "jsx-a11y/aria-proptypes": "error",
                    "jsx-a11y/aria-unsupported-elements": "error",
                    "jsx-a11y/role-has-required-aria-props": "error",
                    "jsx-a11y/role-supports-aria-props": "error",
                    "jsx-a11y/img-redundant-alt": "error",
                    "jsx-a11y/label-has-associated-control": "error",
                    "jsx-a11y/mouse-events-have-key-events": "error",
                    "jsx-a11y/no-access-key": "error",
                    "jsx-a11y/no-autofocus": "error",
                    "jsx-a11y/no-distracting-elements": "error",
                    "jsx-a11y/no-redundant-roles": "error",
                    "jsx-a11y/tabindex-no-positive": "error",
                    "jsx-a11y/heading-has-content": "error",
                    "jsx-a11y/html-has-lang": "error",
                    "jsx-a11y/lang": "error",
                    "jsx-a11y/scope": "error",

                    # React best practices
                    "react/prop-types": "off",  # Using TypeScript instead
                    "react/react-in-jsx-scope": "off",  # Not needed in React 17+
                    "react-hooks/rules-of-hooks": "error",
                    "react-hooks/exhaustive-deps": "warn",

                    # Import organization
                    "import/order": ["error", {
                        "groups": [
                            "builtin",
                            "external",
                            "internal",
                            "parent",
                            "sibling",
                            "index"
                        ],
                        "newlines-between": "always"
                    }],

                    # General code quality
                    "no-console": "warn",
                    "no-debugger": "error",
                    "no-alert": "error",
                    "no-eval": "error",
                    "no-implied-eval": "error",
                    "no-new-func": "error",
                    "no-script-url": "error",
                    "prefer-const": "error",
                    "no-var": "error",
                    "eqeqeq": "error",
                    "curly": "error"
                },
                "settings": {
                    "react": {
                        "version": "detect"
                    },
                    "import/resolver": {
                        "typescript": {}
                    }
                }
            }
        else:
            # Backend/Platform ESLint config
            eslint_config = {
                "env": {
                    "node": True,
                    "es2022": True,
                    "jest": True
                },
                "extends": [
                    "eslint:recommended",
                    "@typescript-eslint/recommended",
                    "@typescript-eslint/recommended-requiring-type-checking",
                    "plugin:security/recommended"
                ],
                "parser": "@typescript-eslint/parser",
                "parserOptions": {
                    "ecmaVersion": "latest",
                    "sourceType": "module",
                    "project": "./tsconfig.json"
                },
                "plugins": [
                    "@typescript-eslint",
                    "security",
                    "import"
                ],
                "rules": {
                    # TypeScript strict rules
                    "@typescript-eslint/no-explicit-any": "error",
                    "@typescript-eslint/explicit-function-return-type": "error",
                    "@typescript-eslint/no-unused-vars": "error",
                    "@typescript-eslint/prefer-const": "error",
                    "@typescript-eslint/no-inferrable-types": "off",

                    # Government security requirements
                    "security/detect-object-injection": "error",
                    "security/detect-non-literal-regexp": "error",
                    "security/detect-unsafe-regex": "error",
                    "security/detect-buffer-noassert": "error",
                    "security/detect-child-process": "error",
                    "security/detect-disable-mustache-escape": "error",
                    "security/detect-eval-with-expression": "error",
                    "security/detect-no-csrf-before-method-override": "error",
                    "security/detect-non-literal-fs-filename": "error",
                    "security/detect-non-literal-require": "error",
                    "security/detect-possible-timing-attacks": "error",
                    "security/detect-pseudoRandomBytes": "error",

                    # Import organization
                    "import/order": ["error", {
                        "groups": [
                            "builtin",
                            "external",
                            "internal",
                            "parent",
                            "sibling",
                            "index"
                        ],
                        "newlines-between": "always"
                    }],

                    # General code quality
                    "no-console": "warn",
                    "no-debugger": "error",
                    "no-eval": "error",
                    "no-implied-eval": "error",
                    "no-new-func": "error",
                    "prefer-const": "error",
                    "no-var": "error",
                    "eqeqeq": "error",
                    "curly": "error"
                }
            }

        config_path = workspace_path / ".eslintrc.json"

        try:
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(eslint_config, f, indent=2)
            self.created_files.append(str(config_path))
            return True
        except Exception as e:
            logger.error(f"Failed to create ESLint config for {workspace_path}: {e}")
            return False

    def create_prettier_config(self, workspace_path: Path) -> bool:
        """Create Prettier configuration for consistent formatting"""
        prettier_config = {
            "semi": True,
            "trailingComma": "es5",
            "singleQuote": True,
            "printWidth": 100,
            "tabWidth": 2,
            "useTabs": False,
            "quoteProps": "as-needed",
            "jsxSingleQuote": True,
            "bracketSpacing": True,
            "bracketSameLine": False,
            "arrowParens": "avoid",
            "endOfLine": "lf",
            "embeddedLanguageFormatting": "auto",
            "htmlWhitespaceSensitivity": "css",
            "insertPragma": False,
            "jsxBracketSameLine": False,
            "proseWrap": "preserve",
            "requirePragma": False,
            "vueIndentScriptAndStyle": False
        }

        config_path = workspace_path / ".prettierrc.json"

        try:
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(prettier_config, f, indent=2)
            self.created_files.append(str(config_path))
            return True
        except Exception as e:
            logger.error(f"Failed to create Prettier config for {workspace_path}: {e}")
            return False

    def create_prettier_ignore(self, workspace_path: Path) -> bool:
        """Create .prettierignore file"""
        ignore_content = """# Dependencies
node_modules/

# Build outputs
dist/
build/
coverage/

# Generated files
*.generated.*
*.min.js
*.min.css

# Package files
package-lock.json
yarn.lock

# Environment files
.env*

# IDE files
.vscode/
.idea/

# Logs
*.log

# Government sensitive files
*.gov
*.classified

# Binary files
*.jpg
*.jpeg
*.png
*.gif
*.ico
*.pdf
*.zip
*.tar.gz

# Documentation
CHANGELOG.md
LICENSE
*.md
"""

        ignore_path = workspace_path / ".prettierignore"

        try:
            with open(ignore_path, 'w', encoding='utf-8') as f:
                f.write(ignore_content)
            self.created_files.append(str(ignore_path))
            return True
        except Exception as e:
            logger.error(f"Failed to create .prettierignore for {workspace_path}: {e}")
            return False

    def create_eslint_ignore(self, workspace_path: Path) -> bool:
        """Create .eslintignore file"""
        ignore_content = """# Dependencies
node_modules/

# Build outputs
dist/
build/
coverage/

# Generated files
*.generated.*
*.min.js

# Configuration files
*.config.js
webpack.config.js
rollup.config.js
vite.config.js

# Package files
package-lock.json

# Environment files
.env*

# IDE files
.vscode/
.idea/

# Logs
*.log

# Government sensitive files
*.gov
*.classified

# Test files (if needed)
# *.test.ts
# *.spec.ts
"""

        ignore_path = workspace_path / ".eslintignore"

        try:
            with open(ignore_path, 'w', encoding='utf-8') as f:
                f.write(ignore_content)
            self.created_files.append(str(ignore_path))
            return True
        except Exception as e:
            logger.error(f"Failed to create .eslintignore for {workspace_path}: {e}")
            return False

    def update_package_json_for_quality(self, workspace_path: Path, workspace_type: str) -> bool:
        """Update package.json with code quality dependencies and scripts"""
        package_json_path = workspace_path / "package.json"

        if not package_json_path.exists():
            logger.warning(f"No package.json found in {workspace_path}")
            return False

        try:
            with open(package_json_path, 'r', encoding='utf-8') as f:
                package_data = json.load(f)

            # Add code quality dependencies
            if "devDependencies" not in package_data:
                package_data["devDependencies"] = {}

            base_deps = {
                "eslint": "^8.57.0",
                "@typescript-eslint/eslint-plugin": "^6.21.0",
                "@typescript-eslint/parser": "^6.21.0",
                "eslint-plugin-security": "^2.1.0",
                "eslint-plugin-import": "^2.29.0",
                "prettier": "^3.2.0",
                "eslint-config-prettier": "^9.1.0",
                "eslint-plugin-prettier": "^5.1.0"
            }

            if workspace_type in ["frontend", "marketplace"]:
                frontend_deps = {
                    "eslint-plugin-react": "^7.33.0",
                    "eslint-plugin-react-hooks": "^4.6.0",
                    "eslint-plugin-jsx-a11y": "^6.8.0",
                    "eslint-import-resolver-typescript": "^3.6.0"
                }
                base_deps.update(frontend_deps)

            package_data["devDependencies"].update(base_deps)

            # Add code quality scripts
            if "scripts" not in package_data:
                package_data["scripts"] = {}

            quality_scripts = {
                "lint": "eslint src tests --ext .ts,.tsx,.js,.jsx",
                "lint:fix": "eslint src tests --ext .ts,.tsx,.js,.jsx --fix",
                "format": "prettier --write src tests",
                "format:check": "prettier --check src tests",
                "quality": "npm run lint && npm run format:check",
                "quality:fix": "npm run lint:fix && npm run format",
                "government:compliance": "npm run lint -- --rule 'jsx-a11y/*: error' --rule 'security/*: error'",
                "precommit": "npm run quality && npm test"
            }

            package_data["scripts"].update(quality_scripts)

            # Write updated package.json
            with open(package_json_path, 'w', encoding='utf-8') as f:
                json.dump(package_data, f, indent=2)

            self.created_files.append(str(package_json_path))
            return True

        except Exception as e:
            logger.error(f"Failed to update package.json for {workspace_path}: {e}")
            return False

    def create_editorconfig(self, workspace_path: Path) -> bool:
        """Create .editorconfig for consistent editor settings"""
        editorconfig_content = """# TerraFusion Government EditorConfig
# THE TERRAFUSION WAY - Consistent coding standards

root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.{js,ts,tsx,jsx,json,yml,yaml}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[*.{py,rb,go}]
indent_size = 4

[Makefile]
indent_style = tab

[*.bat]
end_of_line = crlf
"""

        config_path = workspace_path / ".editorconfig"

        try:
            with open(config_path, 'w', encoding='utf-8') as f:
                f.write(editorconfig_content)
            self.created_files.append(str(config_path))
            return True
        except Exception as e:
            logger.error(f"Failed to create .editorconfig for {workspace_path}: {e}")
            return False

    def create_vscode_settings(self, workspace_path: Path) -> bool:
        """Create VS Code workspace settings for code quality"""
        vscode_settings = {
            "editor.formatOnSave": True,
            "editor.defaultFormatter": "esbenp.prettier-vscode",
            "editor.codeActionsOnSave": {
                "source.fixAll.eslint": True,
                "source.organizeImports": True
            },
            "typescript.preferences.organizeImports": True,
            "eslint.validate": [
                "javascript",
                "javascriptreact",
                "typescript",
                "typescriptreact"
            ],
            "files.associations": {
                "*.env.*": "dotenv"
            },
            "emmet.includeLanguages": {
                "typescript": "html",
                "typescriptreact": "html"
            },
            "typescript.suggest.autoImports": True,
            "javascript.suggest.autoImports": True,
            "editor.rulers": [100],
            "files.trimTrailingWhitespace": True,
            "files.insertFinalNewline": True,
            "search.exclude": {
                "**/node_modules": True,
                "**/dist": True,
                "**/build": True,
                "**/coverage": True
            },
            "files.exclude": {
                "**/node_modules": True,
                "**/.git": True,
                "**/.DS_Store": True,
                "**/dist": True,
                "**/build": True
            }
        }

        vscode_dir = workspace_path / ".vscode"
        vscode_dir.mkdir(exist_ok=True)
        settings_path = vscode_dir / "settings.json"

        try:
            with open(settings_path, 'w', encoding='utf-8') as f:
                json.dump(vscode_settings, f, indent=2)
            self.created_files.append(str(settings_path))
            return True
        except Exception as e:
            logger.error(f"Failed to create VS Code settings for {workspace_path}: {e}")
            return False

    def deploy_code_quality_standards(self) -> bool:
        """Deploy code quality standards across all workspaces"""
        logger.info("🎯 Starting TerraFusion Code Quality & Standards Deployment...")

        # Load workspace analysis
        analysis = self.load_workspace_analysis()
        workspace_details = analysis.get('workspace_details', {})

        # Get workspace categories
        categories = self.get_workspace_categories(workspace_details)

        total_workspaces = 0
        successful_deployments = 0

        for category, workspaces in categories.items():
            if not workspaces:
                continue

            logger.info(f"🔧 Deploying code quality standards for {category.upper()} workspaces...")

            for workspace_name in workspaces:
                total_workspaces += 1
                workspace_details_item = workspace_details.get(workspace_name, {})

                logger.info(f"  📋 Setting up quality standards for {workspace_name}...")

                # Determine workspace path
                package_json_folders = workspace_details_item.get('package_json_folders', [])
                if package_json_folders:
                    # Use the first package.json folder
                    relative_path = package_json_folders[0].lstrip("../")
                    workspace_path = self.root_path / relative_path
                else:
                    # For non-Node.js workspaces, use tests directory
                    workspace_path = self.root_path / "tests" / category / workspace_name

                success = True

                # Create code quality configuration files
                success &= self.create_eslint_config(workspace_path, category)
                success &= self.create_eslint_ignore(workspace_path)
                success &= self.create_prettier_config(workspace_path)
                success &= self.create_prettier_ignore(workspace_path)
                success &= self.create_editorconfig(workspace_path)
                success &= self.create_vscode_settings(workspace_path)

                # Update package.json for Node.js workspaces
                if category in ['frontend', 'marketplace'] or package_json_folders:
                    success &= self.update_package_json_for_quality(workspace_path, category)

                if success:
                    successful_deployments += 1
                    self.updated_workspaces.append(workspace_name)
                    logger.info(f"    ✅ Successfully configured quality standards for {workspace_name}")
                else:
                    logger.error(f"    ❌ Failed to configure quality standards for {workspace_name}")

        logger.info(f"🎊 Code quality standards deployment complete!")
        logger.info(f"📊 Successfully configured: {successful_deployments}/{total_workspaces} workspaces")

        return successful_deployments > 0

    def generate_deployment_report(self) -> str:
        """Generate deployment report"""
        report = []
        report.append("🌍 TERRAFUSION CODE QUALITY & STANDARDS DEPLOYMENT REPORT")
        report.append("=" * 70)
        report.append(f"📊 Total Files Created: {len(self.created_files)}")
        report.append(f"🏗️  Workspaces Updated: {len(self.updated_workspaces)}")
        report.append("")

        if self.updated_workspaces:
            report.append("✅ SUCCESSFULLY CONFIGURED WORKSPACES:")
            for workspace in sorted(self.updated_workspaces):
                report.append(f"  ✅ {workspace}")
            report.append("")

        report.append("🎯 CODE QUALITY STANDARDS DEPLOYED:")
        report.append("  📋 ESLint configuration with government security rules")
        report.append("  🎨 Prettier formatting with consistent standards")
        report.append("  🔒 Security linting (detect vulnerabilities)")
        report.append("  ♿ WCAG 2.2 AA accessibility rules (jsx-a11y)")
        report.append("  📚 Import organization and sorting")
        report.append("  ⚡ TypeScript strict mode enforcement")
        report.append("  🔧 VS Code workspace settings")
        report.append("  📝 EditorConfig for cross-editor consistency")
        report.append("  🏛️ Government compliance checking scripts")

        return "\\n".join(report)

def main():
    import sys

    if len(sys.argv) > 1:
        root_path = sys.argv[1]
    else:
        root_path = r"C:\\Users\\bsval\\terrafusion_os_1.0"

    deployer = TerraFusionCodeQualityDeployer(root_path)

    success = deployer.deploy_code_quality_standards()

    # Generate and display report
    report = deployer.generate_deployment_report()
    print(report)

    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
