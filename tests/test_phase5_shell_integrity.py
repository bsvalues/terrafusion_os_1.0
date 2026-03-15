"""
Phase 5: Shell Integrity Recovery Tests
Validates window sizing contracts, module registry hygiene, and shell correctness.
"""
import json
import os
import re
import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHELL_SRC = os.path.join(REPO_ROOT, "frontend", "apps", "os-shell", "src")


def read_utf8(path):
    """Read a file as UTF-8, handling Windows encoding issues."""
    with open(path, encoding="utf-8") as f:
        return f.read()


# ============================================================================
# Phase 5A: Truth Freeze
# ============================================================================

class TestPhase5ATruthFreeze:
    def test_shell_truth_packet_exists(self):
        path = os.path.join(REPO_ROOT, "docs", "architecture", "SHELL_TRUTH_PACKET.md")
        assert os.path.isfile(path), "SHELL_TRUTH_PACKET.md must exist"

    def test_shell_defect_ledger_exists(self):
        path = os.path.join(REPO_ROOT, "shell-defect-ledger.json")
        assert os.path.isfile(path), "shell-defect-ledger.json must exist"

    def test_defect_ledger_valid_json(self):
        path = os.path.join(REPO_ROOT, "shell-defect-ledger.json")
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        assert data["phase"] == "5A"
        assert len(data["defects"]) >= 3
        assert len(data["verified_correct"]) >= 5

    def test_defect_ledger_has_critical_bug(self):
        path = os.path.join(REPO_ROOT, "shell-defect-ledger.json")
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        critical = [d for d in data["defects"] if d["severity"] == "critical"]
        assert len(critical) >= 1, "Must document at least one critical defect"
        assert "maximized" in critical[0]["title"].lower()


# ============================================================================
# Phase 5B: Window Sizing Contract
# ============================================================================

class TestPhase5BWindowSizing:
    @pytest.fixture(scope="class")
    def desktop_store_src(self):
        path = os.path.join(SHELL_SRC, "stores", "desktopStore.ts")
        return read_utf8(path)

    @pytest.fixture(scope="class")
    def window_src(self):
        path = os.path.join(SHELL_SRC, "shell", "desktop", "Window.tsx")
        return read_utf8(path)

    def test_tier0_returns_maximized_true(self, desktop_store_src):
        """getModuleWindowSize must return maximized: true for tier0-workbench."""
        # Find the tier0-workbench block and verify maximized: true
        pattern = r"objectType\s*===\s*'tier0-workbench'[\s\S]*?maximized:\s*true"
        assert re.search(pattern, desktop_store_src), \
            "tier0-workbench must return maximized: true"

    def test_tier0_does_not_return_maximized_false(self, desktop_store_src):
        """Verify the old bug (maximized: false for tier0) is fixed."""
        # The tier0-workbench block should NOT have maximized: false
        lines = desktop_store_src.split('\n')
        in_tier0_block = False
        for line in lines:
            if "tier0-workbench" in line and "objectType" in line:
                in_tier0_block = True
            if in_tier0_block and "maximized: false" in line:
                pytest.fail("tier0-workbench still has maximized: false (SD-001 not fixed)")
            if in_tier0_block and "}" in line and "return" not in line:
                in_tier0_block = False

    def test_tier0_uses_taskbar_height(self, desktop_store_src):
        """tier0-workbench size should use TASKBAR_HEIGHT, not arbitrary padding."""
        pattern = r"tier0-workbench.*?height:\s*vh\s*-\s*TASKBAR_HEIGHT"
        assert re.search(pattern, desktop_store_src, re.DOTALL), \
            "tier0-workbench height should use vh - TASKBAR_HEIGHT"

    def test_suites_return_maximized_false(self, desktop_store_src):
        """Suite workspaces must return maximized: false (near-full-stage, not maximized)."""
        pattern = r"suite-workspace.*?maximized:\s*false"
        assert re.search(pattern, desktop_store_src, re.DOTALL), \
            "suite-workspace must return maximized: false"

    def test_window_imports_object_classification(self, window_src):
        """Window.tsx must import getObjectClassification for tier-0 detection."""
        assert "getObjectClassification" in window_src, \
            "Window.tsx must import getObjectClassification"

    def test_window_has_tier0_detection(self, window_src):
        """Window.tsx must detect tier-0 windows."""
        assert "isTier0" in window_src, \
            "Window.tsx must have isTier0 variable for tier-0 detection"

    def test_window_blocks_tier0_restore(self, window_src):
        """Window.tsx handleMaximize must block restore for tier-0 windows."""
        assert "if (isTier0) return" in window_src, \
            "handleMaximize must return early for tier-0 windows"

    def test_window_disables_maximize_button_for_tier0(self, window_src):
        """Maximize button should be disabled for tier-0 windows."""
        assert "disabled={isTier0}" in window_src, \
            "Maximize button must be disabled for tier-0 windows"

    def test_no_redundant_property_workbench_fallback(self, desktop_store_src):
        """The redundant property-workbench prefix fallback should be removed."""
        assert "moduleId === 'property-workbench'" not in desktop_store_src, \
            "Redundant property-workbench fallback should be removed (SD-004)"


# ============================================================================
# Phase 5C-5F: Shell Contract Verification
# ============================================================================

class TestPhase5CtoF:
    @pytest.fixture(scope="class")
    def codex_src(self):
        path = os.path.join(SHELL_SRC, "contracts", "objectPlacement.ts")
        return read_utf8(path)

    def test_five_suites_classified(self, codex_src):
        """All 5 constitutional suites must be in MODULE_OBJECT_TYPES."""
        suites = ["suite-forge", "suite-atlas", "suite-dais", "suite-dossier", "suite-gpt"]
        for suite in suites:
            assert f"'{suite}'" in codex_src, f"{suite} must be in MODULE_OBJECT_TYPES"

    def test_suites_are_suite_workspace_type(self, codex_src):
        """Each suite must be classified as suite-workspace."""
        for suite in ["suite-forge", "suite-atlas", "suite-dais", "suite-dossier", "suite-gpt"]:
            pattern = rf"'{suite}':\s*\{{[^}}]*objectType:\s*'suite-workspace'"
            assert re.search(pattern, codex_src), f"{suite} must be objectType: 'suite-workspace'"

    def test_three_os_features_classified(self, codex_src):
        """All 3 OS features must be in MODULE_OBJECT_TYPES."""
        features = ["os-pilot", "os-trace", "os-canon"]
        for feature in features:
            assert f"'{feature}'" in codex_src, f"{feature} must be in MODULE_OBJECT_TYPES"

    def test_os_features_are_os_feature_window_type(self, codex_src):
        """Each OS feature must be classified as os-feature-window."""
        for feature in ["os-pilot", "os-trace", "os-canon"]:
            pattern = rf"'{feature}':\s*\{{[^}}]*objectType:\s*'os-feature-window'"
            assert re.search(pattern, codex_src), f"{feature} must be objectType: 'os-feature-window'"

    def test_workbench_classified_as_tier0(self, codex_src):
        """property-workbench must be classified as tier0-workbench."""
        pattern = r"'property-workbench':\s*\{[^}]*objectType:\s*'tier0-workbench'"
        assert re.search(pattern, codex_src), "property-workbench must be tier0-workbench"

    def test_nine_workbench_tabs_classified(self, codex_src):
        """All 9 workbench tabs must be classified as parcel-scoped-app."""
        tabs = ["summary", "forge", "atlas", "dais", "clerk", "treasury", "audit", "dossier", "pilot"]
        for tab in tabs:
            pattern = rf"'{tab}':\s*\{{[^}}]*objectType:\s*'parcel-scoped-app'"
            assert re.search(pattern, codex_src), f"Tab '{tab}' must be parcel-scoped-app"

    def test_workbench_tabs_hosted_in_tier0(self, codex_src):
        """All workbench tabs must declare tier0-workbench as host surface."""
        tabs = ["summary", "forge", "atlas", "dais", "clerk", "treasury", "audit", "dossier", "pilot"]
        for tab in tabs:
            pattern = rf"'{tab}':\s*\{{[^}}]*hostSurface:\s*'tier0-workbench'"
            assert re.search(pattern, codex_src), f"Tab '{tab}' must have hostSurface: tier0-workbench"


# ============================================================================
# Phase 5G: Legacy Module Cleanup
# ============================================================================

class TestPhase5GModuleCleanup:
    @pytest.fixture(scope="class")
    def module_components_src(self):
        path = os.path.join(SHELL_SRC, "config", "moduleComponents.tsx")
        return read_utf8(path)

    def test_income_valuation_removed_from_registry(self, module_components_src):
        """income-valuation must be removed from MODULE_REGISTRY (archived Phase 3)."""
        # Check it's not in the Set constructor
        pattern = r"MODULE_REGISTRY\s*=\s*new\s+Set.*?'income-valuation'"
        assert not re.search(pattern, module_components_src, re.DOTALL), \
            "income-valuation should be removed from MODULE_REGISTRY"

    def test_comparable_sales_removed_from_registry(self, module_components_src):
        """comparable-sales must be removed from MODULE_REGISTRY (archived Phase 3)."""
        pattern = r"MODULE_REGISTRY\s*=\s*new\s+Set.*?'comparable-sales'"
        assert not re.search(pattern, module_components_src, re.DOTALL), \
            "comparable-sales should be removed from MODULE_REGISTRY"

    def test_no_archived_case_branches(self, module_components_src):
        """ModuleRenderer should not have case branches for archived modules."""
        assert "case 'income-valuation':" not in module_components_src, \
            "Archived income-valuation case branch should be removed"
        assert "case 'comparable-sales':" not in module_components_src, \
            "Archived comparable-sales case branch should be removed"

    def test_no_archived_aliases(self, module_components_src):
        """Aliases pointing to archived modules should be removed."""
        assert "income: 'income-valuation'" not in module_components_src
        assert "comps: 'comparable-sales'" not in module_components_src
        assert "comparables: 'comparable-sales'" not in module_components_src

    def test_live_modules_still_registered(self, module_components_src):
        """Core live modules must still be in MODULE_REGISTRY."""
        live_modules = [
            "federation-dashboard", "costforge", "terra-gaia",
            "property-workbench", "suite-forge", "suite-atlas",
            "suite-dais", "suite-dossier", "suite-gpt",
            "os-pilot", "os-trace", "os-canon",
        ]
        for mod in live_modules:
            assert f"'{mod}'" in module_components_src, \
                f"Live module {mod} must still be registered"


# ============================================================================
# Phase 5H: Z-Index Authority
# ============================================================================

class TestPhase5HZIndex:
    @pytest.fixture(scope="class")
    def zindex_src(self):
        path = os.path.join(SHELL_SRC, "shell", "desktop", "zIndex.ts")
        return read_utf8(path)

    def test_z_index_file_exists(self, zindex_src):
        assert len(zindex_src) > 100

    def test_desktop_below_windows(self, zindex_src):
        """Desktop z-index must be below window z-index."""
        desktop = int(re.search(r"desktop:\s*(\d+)", zindex_src).group(1))
        window = int(re.search(r"window:\s*(\d+)", zindex_src).group(1))
        assert desktop < window

    def test_windows_below_dock(self, zindex_src):
        """Window z-index must be below dock z-index."""
        window_active = int(re.search(r"windowActive:\s*(\d+)", zindex_src).group(1))
        dock = int(re.search(r"dock:\s*(\d+)", zindex_src).group(1))
        assert window_active < dock

    def test_dock_below_overlays(self, zindex_src):
        """Dock z-index must be below overlay z-index."""
        dock = int(re.search(r"dock:\s*(\d+)", zindex_src).group(1))
        overlay = int(re.search(r"overlay:\s*(\d+)", zindex_src).group(1))
        assert dock < overlay

    def test_layer_ordering_monotonic(self, zindex_src):
        """Key z-index values must be monotonically increasing."""
        keys = ["desktop", "topbar", "window", "windowActive", "dock", "startMenu", "overlay"]
        values = []
        for key in keys:
            m = re.search(rf"{key}:\s*(\d+)", zindex_src)
            assert m, f"z-index key '{key}' must exist"
            values.append(int(m.group(1)))
        for i in range(1, len(values)):
            assert values[i] > values[i-1], \
                f"z-index {keys[i]}({values[i]}) must be > {keys[i-1]}({values[i-1]})"
