# Flask Route Inventory (BCBSLevy prod snapshot)
Generated: 2026-04-18


## routes_admin.py (5.9 KB, 2 routes)

- $m / → `dashboard`
- $m /status → `system_status`

## routes_advanced_mcp.py (33.2 KB, 7 routes)

- $m /advanced-insights → `@login_required`
- $m /api/advanced-mcp/query → `@login_required`
- $m /api/advanced-mcp/multi-step-analysis → `@login_required`
- $m /api/advanced-mcp/recommendations → `@login_required`
- $m /api/advanced-mcp/conversation-history → `@login_required`
- $m /api/advanced-mcp/conversation-history → `@login_required`
- $m /api/advanced-mcp/cross-dataset → `@login_required`

## routes_auth.py (3.6 KB, 5 routes)

- $m /login → `login`
- $m /logout → `logout`
- $m /register → `register`
- $m /profile → `profile`
- $m /change-password → `change_password`

## routes_budget_impact.py (28.1 KB, 5 routes)

- $m / → `index`
- $m /api/simulation → `api_budget_simulation`
- $m /api/districts/<int:year> → `api_districts_by_year`
- $m /api/district-budget/<int:district_id> → `api_district_budget`
- $m /api/ai-simulation → `api_ai_budget_simulation`

## routes_dashboard.py (6.8 KB, 3 routes)

- $m / → `@login_required`
- $m /metrics → `@login_required`
- $m /stats → `@login_required`

## routes_data_management.py (30.7 KB, 16 routes)

- $m / → `data_management_index`
- $m /import → `import_form`
- $m /import/data → `import_data`
- $m /export → `export_form`
- $m /export → `export_data`
- $m /tax-districts → `list_tax_districts`
- $m /tax-districts/<int:district_id> → `view_tax_district`
- $m /tax-codes → `list_tax_codes`
- $m /tax-codes/<int:tax_code_id> → `view_tax_code`
- $m /import/benton-county/<int:log_id> → `import_benton_county`
- $m /import/district → `import_district`
- $m /properties → `list_properties`
- $m /properties/<int:property_id> → `view_property`
- $m /import-history → `import_history`
- $m /export-history → `export_history`
- $m /api/preview-district-import → `preview_district_import`

## routes_data_quality.py (43.7 KB, 12 routes)

- $m / → `dashboard`
- $m /rules → `validation_rules`
- $m /rules/create → `create_rule`
- $m /errors → `error_patterns`
- $m /analyze → `analyze_data_quality`
- $m /activities → `quality_activities`
- $m /ai-recommendations → `ai_recommendations`
- $m /monitoring-status → `get_monitoring_status`
- $m /monitoring/toggle → `toggle_monitoring`
- $m /realtime-metrics → `get_realtime_metrics`
- $m /trends → `analyze_levy_trends`
- $m /audit → `audit_data_quality`

## routes_db_fix.py (6.9 KB, 4 routes)

- $m / → `index`
- $m /fix-import-log-enums → `fix_import_log_enums`
- $m /fix-export-log-enums → `fix_export_log_enums`
- $m /api/fix-import-log-enums → `api_fix_import_log_enums`

## routes_examples.py (0.9 KB, 4 routes)

- $m / → `index`
- $m /forms → `forms_demo`
- $m /cards → `cards_demo`
- $m /loading-animations → `loading_animations_demo`

## routes_forecasting.py (24.8 KB, 10 routes)

- $m / → `index`
- $m /analyze/<int:tax_code_id> → `analyze`
- $m /forecast → `forecast`
- $m /ai → `ai_dashboard`
- $m /ai/generate → `generate_ai_forecast`
- $m /ai/explain → `generate_ai_explanation`
- $m /ai/enhanced → `ai_enhanced`
- $m /ai/analyze → `execute_ai_comprehensive_analysis`
- $m /district/<int:district_id>/analysis → `district_analysis`
- $m /api/tax_codes → `api_get_tax_codes`

## routes_glossary.py (3.2 KB, 1 routes)

- $m / → `glossary`

## routes_historical_analysis.py (18.8 KB, 8 routes)

- $m / → `advanced_historical_analysis`
- $m /api/statistics → `api_historical_statistics`
- $m /api/forecast → `api_historical_forecast`
- $m /api/anomalies → `api_historical_anomalies`
- $m /api/district → `api_historical_district`
- $m /api/comparison → `api_historical_comparison`
- $m /historical-rates → `historical_analysis`
- $m /compliance → `compliance`

## routes_home.py (2.9 KB, 6 routes)

- $m / → `index`
- $m /dashboard → `dashboard`
- $m /about → `about`
- $m /settings → `settings`
- $m /help → `help_page`
- $m /demo-dashboard → `demo_dashboard`

## routes_levy_audit.py (23.6 KB, 10 routes)

- $m / → `@login_required`
- $m /compliance-audit → `@login_required`
- $m /levy-assistant → `@login_required`
- $m /verify-calculation → `@login_required`
- $m /levy-recommendations → `@login_required`
- $m /explain-levy-law → `@login_required`
- $m /api/ask-lev → `@login_required`
- $m /api/audit-compliance → `@login_required`
- $m /wa-dor-forms → `@login_required`
- $m /district-data/<int:district_id>/<int:year> → `@login_required`

## routes_levy_calculator.py (34.5 KB, 10 routes)

- $m / → `calculator`
- $m /impact-calculator → `impact_calculator`
- $m /api/calculate → `api_calculate`
- $m /district/<int:district_id> → `get_district_details`
- $m /scenarios → `get_scenarios`
- $m /scenario/<int:scenario_id> → `get_scenario`
- $m /delete-scenario/<int:scenario_id> → `delete_scenario`
- $m /save-scenario → `save_scenario`
- $m /calculate → `calculate`
- $m /api/calculate-rate → `api_calculate_rate`

## routes_levy_exports.py (39.3 KB, 11 routes)

- $m / → `index`
- $m /upload → `upload`
- $m /process → `process`
- $m /view/<int:year> → `view_year`
- $m /compare → `compare`
- $m /parse-direct → `parse_direct`
- $m /download-parsed/<session_id> → `download_parsed`
- $m /convert-format → `convert_format`
- $m /export → `export_data`
- $m /template → `create_template`
- $m /templates → `template_manager`

## routes_mcp_army.py (18.3 KB, 16 routes)

- $m /direct-dashboard → `mcp_army_dashboard_direct`
- $m /dashboard → `dashboard`
- $m /api/command-structure → `get_command_structure`
- $m /api/agents → `list_agents`
- $m /api/agents/<agent_id> → `get_agent_status`
- $m /api/agents/<agent_id>/capabilities/<capability> → `execute_capability`
- $m /api/agents/<agent_id>/assistance/<target_agent> → `request_assistance`
- $m /api/experiences/stats → `get_experience_stats`
- $m /api/agents/<agent_id>/experiences → `get_agent_experiences`
- $m /api/training/start → `start_training`
- $m /api/initialize → `initialize_mcp_army`
- $m /api/master-prompt → `get_master_prompt`
- $m /api/master-prompt/directives/<directive_name> → `get_master_prompt_directive`
- $m /api/master-prompt → `update_master_prompt`
- $m /api/master-prompt/broadcast → `broadcast_master_prompt`
- $m /api/workflows/collaborative → `execute_collaborative_workflow`

## routes_mcp_ui.py (1.1 KB, 3 routes)

- $m /agent-registry → `agent_registry`
- $m /workflow-designer → `workflow_designer`
- $m /agent-playground → `agent_playground`

## routes_mcp.py (64.6 KB, 11 routes)

- $m /check-api-key → `check_api_key`
- $m /api/status → `api_status_check`
- $m /configure-api-key → `configure_api_key`
- $m /api-status → `api_status`
- $m /api-analytics → `api_analytics`
- $m /api/service-breakdown → `api_service_breakdown`
- $m /api/timeseries → `api_timeseries`
- $m /api/response-time-distribution → `api_response_time_distribution`
- $m /api/historical-calls → `api_historical_calls`
- $m /insights → `insights`
- $m /api/statistics → `api_statistics`

## routes_property_assessment.py (16 KB, 9 routes)

- $m / → `assessment_dashboard`
- $m /data-validation → `data_validation`
- $m /valuation → `property_valuation`
- $m /compliance → `compliance_verification`
- $m /workflow → `assessment_workflow`
- $m /api/validate-property → `api_validate_property`
- $m /api/calculate-value → `api_calculate_value`
- $m /api/verify-compliance → `api_verify_compliance`
- $m /api/execute-workflow → `api_execute_workflow`

## routes_public.py (18.6 KB, 9 routes)

- $m / → `index`
- $m /search → `search`
- $m /property/<string:property_id> → `property_detail`
- $m /compare → `compare_properties`
- $m /districts → `district_list`
- $m /district/<int:district_id> → `district_detail`
- $m /glossary → `glossary`
- $m /api/districts → `api_districts`
- $m /api/district/<int:district_id> → `api_district_detail`

## routes_reports_new.py (21.7 KB, 11 routes)

- $m /dashboard → `reports_dashboard`
- $m /templates → `report_templates`
- $m /templates/new → `new_report_template`
- $m /templates/new → `create_report_template`
- $m /templates/<template_id> → `edit_report_template`
- $m /templates/<template_id> → `update_report_template`
- $m /templates/<template_id>/delete → `delete_report_template`
- $m /generate → `report_generator`
- $m /generate → `generate_report`
- $m /schedule → `schedule_report_form`
- $m /schedule → `schedule_report`

## routes_reports.py (22.4 KB, 11 routes)

- $m /dashboard → `reports_dashboard`
- $m /templates → `report_templates`
- $m /reports/templates/new → `new_report_template`
- $m /reports/templates/new → `create_report_template`
- $m /reports/templates/<template_id> → `edit_report_template`
- $m /reports/templates/<template_id> → `update_report_template`
- $m /reports/templates/<template_id>/delete → `delete_report_template`
- $m /reports/generate → `report_generator`
- $m /reports/generate → `generate_report`
- $m /reports/schedule → `schedule_report_form`
- $m /reports/schedule → `schedule_report_submit`

## routes_search.py (6.8 KB, 3 routes)

- $m / → `@login_required`
- $m /api/search → `@login_required`
- $m /api/autocomplete → `@login_required`

## routes_tax_strategy.py (13.3 KB, 4 routes)

- $m / → `@login_required`
- $m /api/tree → `@login_required`
- $m /analysis → `@login_required`
- $m /recommendation → `@login_required`

## routes_user_audit.py (15 KB, 7 routes)

- $m / → `@login_required`
- $m /activity → `@login_required`
- $m /levy-overrides → `@login_required`
- $m /levy-override/<int:override_id>/approve → `@login_required`
- $m /levy-override/<int:override_id>/reject → `@login_required`
- $m /analytics → `@login_required`
- $m /user/<int:user_id> → `@login_required`

## routes.py (8.4 KB, 10 routes)

- $m /index → `@main_bp.route('/dashboard')`
- $m /dashboard → `@login_required`
- $m /login → `login`
- $m /logout → `@login_required`
- $m /profile → `@login_required`
- $m /profile/update → `@login_required`
- $m /profile/change-password → `@login_required`
- $m /register → `register`
- $m /about → `about`
- $m /help → `help_page`

## routes2.py (0.4 KB, 0 routes)


## Summary
- Total files: 28
