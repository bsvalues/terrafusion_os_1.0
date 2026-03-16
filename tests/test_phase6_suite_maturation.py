"""
Phase 6: Suite Standalone Home Maturation Tests
Validates ADR-backed module implementations, suite home completeness,
module grid contracts, registry wiring, and Phase 5 regression gate.
"""
import json
import os
import re
import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHELL_SRC = os.path.join(REPO_ROOT, "frontend", "apps", "os-shell", "src")

CONSTITUTIONAL_SUITES = {
    "forge": {"file": "ForgeSuiteHome.tsx", "testid": "suite-forge-root", "title": "TerraForge"},
    "atlas": {"file": "AtlasSuiteHome.tsx", "testid": "suite-atlas-root", "title": "TerraAtlas"},
    "dais": {"file": "DaisSuiteHome.tsx", "testid": "suite-dais-root", "title": "TerraDais"},
    "dossier": {"file": "DossierSuiteHome.tsx", "testid": "suite-dossier-root", "title": "TerraDossier"},
    "gpt": {"file": "GptSuiteHome.tsx", "testid": "suite-gpt-root", "title": "TerraGPT"},
}


def read_utf8(path):
    """Read a file as UTF-8, handling Windows encoding issues."""
    with open(path, encoding="utf-8") as f:
        return f.read()


# ============================================================================
# Phase 6A: Statistics Studio (ADR-001)
# ============================================================================

class TestStatisticsStudio:
    @pytest.fixture(scope="class")
    def studio_src(self):
        path = os.path.join(SHELL_SRC, "pages", "forge", "statistics", "StatisticsStudio.tsx")
        return read_utf8(path)

    @pytest.fixture(scope="class")
    def module_components_src(self):
        path = os.path.join(SHELL_SRC, "config", "moduleComponents.tsx")
        return read_utf8(path)

    def test_statistics_studio_file_exists(self):
        path = os.path.join(SHELL_SRC, "pages", "forge", "statistics", "StatisticsStudio.tsx")
        assert os.path.isfile(path), "StatisticsStudio.tsx must exist"

    def test_statistics_studio_imports_ratio_panel(self, studio_src):
        assert "RatioStudyPanel" in studio_src

    def test_statistics_studio_imports_cod_chart(self, studio_src):
        assert "CODTrendChart" in studio_src

    def test_statistics_studio_imports_prd_chart(self, studio_src):
        assert "PRDTrendChart" in studio_src

    def test_statistics_studio_imports_vei_dashboard(self, studio_src):
        assert "VEIDashboard" in studio_src

    def test_statistics_studio_has_sample_ratio_data(self, studio_src):
        assert "medianRatio" in studio_src
        assert "cod" in studio_src
        assert "prd" in studio_src
        assert "prb" in studio_src

    def test_statistics_studio_has_tabs(self, studio_src):
        assert "ratio-study" in studio_src or "Ratio Study" in studio_src
        assert "trends" in studio_src or "Trends" in studio_src
        assert "equity" in studio_src or "Equity" in studio_src

    def test_statistics_studio_wired_in_module_components(self, module_components_src):
        """statistics-studio case must use StatisticsStudio, not PlaceholderModule."""
        # Find the case block for statistics-studio
        pattern = r"case 'statistics-studio':[\s\S]*?(?=case '|default:)"
        match = re.search(pattern, module_components_src)
        assert match, "statistics-studio case must exist"
        block = match.group(0)
        assert "StatisticsStudio" in block, "statistics-studio must render StatisticsStudio component"
        assert "PlaceholderModule" not in block, "statistics-studio must NOT use PlaceholderModule"

    def test_statistics_studio_lazy_imported(self, module_components_src):
        assert "StatisticsStudio" in module_components_src
        assert "import('../pages/forge/statistics/StatisticsStudio')" in module_components_src

    def test_statistics_studio_exported(self, studio_src):
        assert "export" in studio_src


# ============================================================================
# Phase 6B: Management Dashboard (ADR-003)
# ============================================================================

class TestManagementDashboard:
    @pytest.fixture(scope="class")
    def dashboard_src(self):
        path = os.path.join(SHELL_SRC, "pages", "dais", "ManagementDashboard.tsx")
        return read_utf8(path)

    @pytest.fixture(scope="class")
    def module_components_src(self):
        path = os.path.join(SHELL_SRC, "config", "moduleComponents.tsx")
        return read_utf8(path)

    @pytest.fixture(scope="class")
    def dais_home_src(self):
        path = os.path.join(SHELL_SRC, "pages", "suites", "DaisSuiteHome.tsx")
        return read_utf8(path)

    def test_management_dashboard_file_exists(self):
        path = os.path.join(SHELL_SRC, "pages", "dais", "ManagementDashboard.tsx")
        assert os.path.isfile(path), "ManagementDashboard.tsx must exist"

    def test_management_dashboard_has_overview_tab(self, dashboard_src):
        assert "overview" in dashboard_src.lower()

    def test_management_dashboard_has_certification_tab(self, dashboard_src):
        assert "certification" in dashboard_src.lower()

    def test_management_dashboard_has_appeals_tab(self, dashboard_src):
        assert "appeals" in dashboard_src.lower()

    def test_management_dashboard_has_workload_tab(self, dashboard_src):
        assert "workload" in dashboard_src.lower()

    def test_management_dashboard_has_parcel_count(self, dashboard_src):
        assert "89,247" in dashboard_src or "89247" in dashboard_src

    def test_management_dashboard_has_benton_areas(self, dashboard_src):
        for area in ["Richland", "Kennewick", "Pasco"]:
            assert area in dashboard_src, f"Must include {area}"

    def test_management_dashboard_registered_in_module_registry(self, module_components_src):
        assert "'management-dashboard'" in module_components_src

    def test_management_dashboard_wired_in_module_components(self, module_components_src):
        pattern = r"case 'management-dashboard':[\s\S]*?(?=case '|default:)"
        match = re.search(pattern, module_components_src)
        assert match, "management-dashboard case must exist"
        block = match.group(0)
        assert "ManagementDashboard" in block
        assert "PlaceholderModule" not in block

    def test_management_dashboard_lazy_imported(self, module_components_src):
        assert "import('../pages/dais/ManagementDashboard')" in module_components_src

    def test_management_dashboard_in_dais_suite_home(self, dais_home_src):
        assert "management-dashboard" in dais_home_src

    def test_management_dashboard_has_alias(self, module_components_src):
        assert "management: 'management-dashboard'" in module_components_src

    def test_management_dashboard_exported(self, dashboard_src):
        assert "export" in dashboard_src


# ============================================================================
# Phase 6C: Regression Studio Verification (ADR-002)
# ============================================================================

class TestRegressionStudioVerification:
    def test_regression_studio_file_exists(self):
        path = os.path.join(SHELL_SRC, "pages", "forge", "regression", "RegressionStudio.tsx")
        assert os.path.isfile(path), "RegressionStudio.tsx must exist"

    def test_regression_studio_is_real_implementation(self):
        path = os.path.join(SHELL_SRC, "pages", "forge", "regression", "RegressionStudio.tsx")
        src = read_utf8(path)
        assert len(src) > 500, "RegressionStudio must have substantial implementation"
        assert "PlaceholderModule" not in src
        assert "savedModels" in src or "SavedModel" in src
        assert "RegressionControlPanel" in src

    def test_regression_studio_registered(self):
        path = os.path.join(SHELL_SRC, "config", "moduleComponents.tsx")
        src = read_utf8(path)
        assert "'regression-studio'" in src


# ============================================================================
# Phase 6D: Build Integrity
# ============================================================================

class TestBuildIntegrity:
    def test_module_registry_has_all_adr_modules(self):
        path = os.path.join(SHELL_SRC, "config", "moduleComponents.tsx")
        src = read_utf8(path)
        for mod in ["statistics-studio", "regression-studio", "management-dashboard"]:
            assert f"'{mod}'" in src, f"{mod} must be in MODULE_REGISTRY"

    def test_no_placeholder_for_adr_modules(self):
        """ADR-backed modules must not use PlaceholderModule."""
        path = os.path.join(SHELL_SRC, "config", "moduleComponents.tsx")
        src = read_utf8(path)
        for mod in ["statistics-studio", "management-dashboard"]:
            pattern = rf"case '{mod}':[\s\S]*?(?=case '|default:)"
            match = re.search(pattern, src)
            assert match, f"{mod} case must exist"
            assert "PlaceholderModule" not in match.group(0), \
                f"{mod} must use real component, not PlaceholderModule"

    def test_existing_modules_still_work(self):
        """Verify we didn't break existing module registrations."""
        path = os.path.join(SHELL_SRC, "config", "moduleComponents.tsx")
        src = read_utf8(path)
        for mod in ["costforge", "terra-gaia", "terra-levy", "suite-forge", "suite-dais"]:
            assert f"'{mod}'" in src, f"Existing module {mod} must still be registered"


# ============================================================================
# Phase 6E: Suite Home Completeness
# ============================================================================

class TestSuiteHomeCompleteness:
    """All 5 constitutional suite homes must be real implementations."""

    @pytest.mark.parametrize("suite_id,meta", list(CONSTITUTIONAL_SUITES.items()))
    def test_suite_home_file_exists(self, suite_id, meta):
        path = os.path.join(SHELL_SRC, "pages", "suites", meta["file"])
        assert os.path.isfile(path), f"{meta['file']} must exist"

    @pytest.mark.parametrize("suite_id,meta", list(CONSTITUTIONAL_SUITES.items()))
    def test_suite_home_is_not_placeholder(self, suite_id, meta):
        """Suite homes must have substantial implementation (>50 lines)."""
        path = os.path.join(SHELL_SRC, "pages", "suites", meta["file"])
        src = read_utf8(path)
        lines = src.strip().split("\n")
        assert len(lines) >= 50, f"{meta['file']} must have >= 50 lines (got {len(lines)})"
        assert "Coming soon" not in src, f"{meta['file']} must not have placeholder text"

    @pytest.mark.parametrize("suite_id,meta", list(CONSTITUTIONAL_SUITES.items()))
    def test_suite_home_has_data_testid(self, suite_id, meta):
        path = os.path.join(SHELL_SRC, "pages", "suites", meta["file"])
        src = read_utf8(path)
        assert meta["testid"] in src, f"{meta['file']} must have data-testid={meta['testid']}"

    @pytest.mark.parametrize("suite_id,meta", list(CONSTITUTIONAL_SUITES.items()))
    def test_suite_home_uses_suite_module_grid(self, suite_id, meta):
        path = os.path.join(SHELL_SRC, "pages", "suites", meta["file"])
        src = read_utf8(path)
        assert "SuiteModuleGrid" in src, f"{meta['file']} must use SuiteModuleGrid"

    @pytest.mark.parametrize("suite_id,meta", list(CONSTITUTIONAL_SUITES.items()))
    def test_suite_home_uses_operational_queue(self, suite_id, meta):
        path = os.path.join(SHELL_SRC, "pages", "suites", meta["file"])
        src = read_utf8(path)
        assert "OperationalQueue" in src, f"{meta['file']} must use OperationalQueue"

    @pytest.mark.parametrize("suite_id,meta", list(CONSTITUTIONAL_SUITES.items()))
    def test_suite_home_uses_county_stats(self, suite_id, meta):
        path = os.path.join(SHELL_SRC, "pages", "suites", meta["file"])
        src = read_utf8(path)
        assert "useCountyStats" in src, f"{meta['file']} must use useCountyStats"

    @pytest.mark.parametrize("suite_id,meta", list(CONSTITUTIONAL_SUITES.items()))
    def test_suite_home_has_parcel_context(self, suite_id, meta):
        path = os.path.join(SHELL_SRC, "pages", "suites", meta["file"])
        src = read_utf8(path)
        assert "ParcelContextBanner" in src, f"{meta['file']} must use ParcelContextBanner"

    @pytest.mark.parametrize("suite_id,meta", list(CONSTITUTIONAL_SUITES.items()))
    def test_suite_home_has_title(self, suite_id, meta):
        path = os.path.join(SHELL_SRC, "pages", "suites", meta["file"])
        src = read_utf8(path)
        assert meta["title"] in src, f"{meta['file']} must display title {meta['title']}"


# ============================================================================
# Phase 6F: Module Grid Contract
# ============================================================================

class TestModuleGridContract:
    """All suite modules must declare launchMode."""

    @pytest.mark.parametrize("suite_id,meta", list(CONSTITUTIONAL_SUITES.items()))
    def test_all_modules_have_launch_mode(self, suite_id, meta):
        """Every module definition must include launchMode: 'workbench' or 'standalone'."""
        path = os.path.join(SHELL_SRC, "pages", "suites", meta["file"])
        src = read_utf8(path)
        # Find the module array
        module_pattern = r"const \w+_MODULES:\s*SuiteModuleDef\[\]\s*=\s*\[([\s\S]*?)\];"
        match = re.search(module_pattern, src)
        assert match, f"{meta['file']} must define a MODULES array"
        modules_block = match.group(1)
        # Count module entries (each { ... } block)
        module_entries = re.findall(r"\{[^}]+\}", modules_block)
        assert len(module_entries) >= 3, f"{meta['file']} must have >= 3 modules"
        for entry in module_entries:
            assert "launchMode" in entry, \
                f"Module in {meta['file']} missing launchMode: {entry[:60]}..."

    @pytest.mark.parametrize("suite_id,meta", list(CONSTITUTIONAL_SUITES.items()))
    def test_workbench_modules_have_tab(self, suite_id, meta):
        """Workbench-mode modules must declare workbenchTab."""
        path = os.path.join(SHELL_SRC, "pages", "suites", meta["file"])
        src = read_utf8(path)
        module_pattern = r"const \w+_MODULES:\s*SuiteModuleDef\[\]\s*=\s*\[([\s\S]*?)\];"
        match = re.search(module_pattern, src)
        if not match:
            return
        modules_block = match.group(1)
        entries = re.findall(r"\{[^}]+\}", modules_block)
        for entry in entries:
            if "launchMode: 'workbench'" in entry:
                assert "workbenchTab" in entry, \
                    f"Workbench module missing workbenchTab: {entry[:60]}..."

    @pytest.mark.parametrize("suite_id,meta", list(CONSTITUTIONAL_SUITES.items()))
    def test_standalone_modules_have_module_id(self, suite_id, meta):
        """Standalone-mode modules must declare moduleId."""
        path = os.path.join(SHELL_SRC, "pages", "suites", meta["file"])
        src = read_utf8(path)
        module_pattern = r"const \w+_MODULES:\s*SuiteModuleDef\[\]\s*=\s*\[([\s\S]*?)\];"
        match = re.search(module_pattern, src)
        if not match:
            return
        modules_block = match.group(1)
        entries = re.findall(r"\{[^}]+\}", modules_block)
        for entry in entries:
            if "launchMode: 'standalone'" in entry:
                assert "moduleId" in entry, \
                    f"Standalone module missing moduleId: {entry[:60]}..."


# ============================================================================
# Phase 6G: Suite Home Registry Wiring
# ============================================================================

class TestSuiteHomeRegistryWiring:
    """All 5 suite homes must be wired in moduleComponents.tsx with real components."""

    @pytest.fixture(scope="class")
    def module_components_src(self):
        path = os.path.join(SHELL_SRC, "config", "moduleComponents.tsx")
        return read_utf8(path)

    def test_all_five_suites_in_module_entries(self, module_components_src):
        for suite in ["suite-forge", "suite-atlas", "suite-dais", "suite-dossier", "suite-gpt"]:
            assert f"'{suite}'" in module_components_src, \
                f"{suite} must be in MODULE_ENTRIES"

    def test_suite_homes_use_real_components(self, module_components_src):
        """Suite home entries must not use PlaceholderModule."""
        for suite in ["suite-forge", "suite-atlas", "suite-dais", "suite-dossier", "suite-gpt"]:
            # Find the entry for this suite
            pattern = rf"'{suite}':\s*\{{[^}}]*\}}"
            match = re.search(pattern, module_components_src)
            if match:
                assert "PlaceholderModule" not in match.group(0), \
                    f"{suite} must use a real component, not PlaceholderModule"

    def test_suite_aliases_exist(self, module_components_src):
        """Short aliases must map to full suite IDs."""
        aliases = {
            "forge": "suite-forge",
            "atlas": "suite-atlas",
            "dais": "suite-dais",
            "dossier": "suite-dossier",
            "gpt": "suite-gpt",
        }
        for alias, target in aliases.items():
            # Alias key may or may not be quoted
            pattern = rf"(?:'{alias}'|{alias}):\s*'{target}'"
            assert re.search(pattern, module_components_src), \
                f"Alias '{alias}' -> '{target}' must exist"


# ============================================================================
# Phase 6H: Phase 5 Regression Gate
# ============================================================================

class TestPhase5RegressionGate:
    """Phase 5 shell invariants must still hold after Phase 6 changes."""

    @pytest.fixture(scope="class")
    def codex_src(self):
        path = os.path.join(SHELL_SRC, "contracts", "objectPlacement.ts")
        return read_utf8(path)

    @pytest.fixture(scope="class")
    def desktop_store_src(self):
        path = os.path.join(SHELL_SRC, "stores", "desktopStore.ts")
        return read_utf8(path)

    @pytest.fixture(scope="class")
    def zindex_src(self):
        path = os.path.join(SHELL_SRC, "shell", "desktop", "zIndex.ts")
        return read_utf8(path)

    def test_suites_still_suite_workspace(self, codex_src):
        """All 5 suites must remain objectType: 'suite-workspace'."""
        for suite in ["suite-forge", "suite-atlas", "suite-dais", "suite-dossier", "suite-gpt"]:
            pattern = rf"'{suite}':\s*\{{[^}}]*objectType:\s*'suite-workspace'"
            assert re.search(pattern, codex_src), \
                f"{suite} must remain suite-workspace"

    def test_os_features_still_os_feature_window(self, codex_src):
        """All 3 OS features must remain objectType: 'os-feature-window'."""
        for feature in ["os-pilot", "os-trace", "os-canon"]:
            pattern = rf"'{feature}':\s*\{{[^}}]*objectType:\s*'os-feature-window'"
            assert re.search(pattern, codex_src), \
                f"{feature} must remain os-feature-window"

    def test_workbench_still_tier0(self, codex_src):
        """property-workbench must remain tier0-workbench."""
        pattern = r"'property-workbench':\s*\{[^}]*objectType:\s*'tier0-workbench'"
        assert re.search(pattern, codex_src), "Workbench must remain tier0-workbench"

    def test_tier0_still_maximized(self, desktop_store_src):
        """tier0-workbench must still return maximized: true."""
        pattern = r"objectType\s*===\s*'tier0-workbench'[\s\S]*?maximized:\s*true"
        assert re.search(pattern, desktop_store_src), \
            "tier0-workbench must return maximized: true"

    def test_zindex_still_monotonic(self, zindex_src):
        """Z-index hierarchy must remain monotonically increasing."""
        keys = ["desktop", "topbar", "window", "windowActive", "dock", "startMenu", "overlay"]
        values = []
        for key in keys:
            m = re.search(rf"{key}:\s*(\d+)", zindex_src)
            assert m, f"z-index key '{key}' must exist"
            values.append(int(m.group(1)))
        for i in range(1, len(values)):
            assert values[i] > values[i - 1], \
                f"z-index {keys[i]}({values[i]}) must be > {keys[i-1]}({values[i-1]})"
