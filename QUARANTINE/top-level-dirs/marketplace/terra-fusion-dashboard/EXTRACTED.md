# ⚡ Extracted to New Repository

## 🎯 **MIGRATION STATUS: COMPLETE**

This code has been **extracted** from the TerraFusion OS monorepo and migrated to a dedicated polyrepo as part of **Phase 3C Domain Extraction** (October 2025).

---

## 📦 **New Repository Location**

**Repository:** [terrafusion-ui-components](https://github.com/bsvalues/terrafusion-ui-components)  
**URL:** `https://github.com/bsvalues/terrafusion-ui-components`

### **What This Means**

- ✅ **Active Development**: All new UI component development happens in the new repository
- ✅ **Full History Preserved**: Complete git history transferred to new repo
- ✅ **Independent CI/CD**: Dedicated build and deployment pipelines
- ✅ **Domain Ownership**: UI/UX team owns this bounded context

---

## 🚀 **Getting Started**

### **Clone the New Repository**

```bash
# Clone the UI components repository
git clone https://github.com/bsvalues/terrafusion-ui-components.git
cd terrafusion-ui-components

# Install dependencies
npm install

# Run Storybook (if available)
npm run storybook
```

### **Key Features in This Repository**

- 🎨 **Design System**: Complete design system with tokens, typography, colors
- 🧩 **React Components**: Reusable React components for TerraFusion applications
- 📱 **Dashboard UI**: Terra Fusion Dashboard components and layouts
- 🎯 **Government Branding**: Benton County and government-specific styling
- ♿ **Accessibility**: Section 508 compliant components
- 🎭 **Theme System**: Customizable theming for different clients
- 📊 **Data Visualizations**: Charts, graphs, and data display components

---

## 📚 **Documentation**

- **Component Library**: See Storybook at `http://localhost:6006` after running `npm run storybook`
- **Design System**: Available in `docs/design-system/` directory
- **Migration Guide**: [POLYREPO_MIGRATION_GUIDE.md](../../POLYREPO_MIGRATION_GUIDE.md)
- **Dependencies**: [REPOSITORY_DEPENDENCIES.md](../../REPOSITORY_DEPENDENCIES.md)

---

## 🔗 **Related Repositories**

This repository depends on:

- [terrafusion-shared](https://github.com/bsvalues/terrafusion-shared) - Shared utilities and types

This repository is used by:

- [terrafusion-government-platform](https://github.com/bsvalues/terrafusion-government-platform) - Government operations UI
- [terrafusion-commercial-platform](https://github.com/bsvalues/terrafusion-commercial-platform) - Commercial platform UI
- All TerraFusion applications with user interfaces

---

## ⚠️ **Important Notes**

- **This directory is now READ-ONLY** in the monorepo
- **All UI component changes should be made** in the new repository
- **This content will be removed** in a future cleanup phase
- **Monorepo remains** as central coordination and deployment hub

---

**Migration Date:** October 8, 2025  
**Migration Method:** TERRAFUSION MODE - 800x Efficiency  
**Status:** ✅ COMPLETE

For questions, see [POLYREPO_MIGRATION_COMPLETE_TERRAFUSION_MODE.md](../../ops/launch/POLYREPO_MIGRATION_COMPLETE_TERRAFUSION_MODE.md)
