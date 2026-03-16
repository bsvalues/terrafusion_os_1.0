"""
Phase 6: Suite Standalone Home Maturation Tests
Validates ADR-backed module implementations and registry wiring.
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
