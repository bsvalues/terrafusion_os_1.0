CREATE TABLE [dbo].[pacs_system] (
    [id]                                         INT             NOT NULL,
    [tax_yr]                                     NUMERIC (4)     NOT NULL,
    [appr_yr]                                    NUMERIC (4)     NULL,
    [system_type]                                CHAR (1)        NULL,
    [rounding_factor]                            NUMERIC (4)     NULL,
    [rounding_income_factor]                     NUMERIC (4)     NULL,
    [receipt_copies]                             INT             NULL,
    [first_yr_to_supp]                           NUMERIC (4)     NULL,
    [validator_line_one]                         VARCHAR (50)    NULL,
    [validator_line_two]                         VARCHAR (50)    NULL,
    [validator_line_three]                       VARCHAR (50)    NULL,
    [validator_line_four]                        VARCHAR (50)    NULL,
    [validator_line_seven]                       VARCHAR (50)    NULL,
    [validator_line_eight]                       VARCHAR (50)    NULL,
    [validator_line_nine]                        VARCHAR (50)    NULL,
    [geo_id_display_option]                      CHAR (1)        NULL,
    [phone_num]                                  VARCHAR (20)    NULL,
    [fax_num]                                    VARCHAR (20)    NULL,
    [version]                                    VARCHAR (20)    NULL,
    [oil_well_adj_acres]                         NUMERIC (14, 4) NULL,
    [apply_land_mass_factor]                     CHAR (1)        NULL,
    [apply_imprv_mass_factor]                    CHAR (1)        NULL,
    [distribution_path]                          VARCHAR (100)   NULL,
    [pacsappr_version]                           VARCHAR (100)   NULL,
    [pacscol_version]                            VARCHAR (100)   NULL,
    [confidential_file_as_name]                  VARCHAR (70)    NULL,
    [confidential_first_name]                    VARCHAR (30)    NULL,
    [confidential_last_name]                     VARCHAR (30)    NULL,
    [begin_close_dt]                             DATETIME        NULL,
    [starting_check_num]                         INT             NULL,
    [gis_viewer]                                 CHAR (1)        NULL,
    [gis_viewer_display_labels]                  CHAR (1)        NULL,
    [appr_card_type]                             VARCHAR (15)    NULL,
    [letter_path]                                VARCHAR (255)   NULL,
    [label_printer_name]                         VARCHAR (255)   NULL,
    [face_map_path]                              VARCHAR (255)   NULL,
    [face_map_field]                             VARCHAR (50)    CONSTRAINT [CDF_pacs_system_face_map_field] DEFAULT ('ref_id1') NOT NULL,
    [cold_location]                              VARCHAR (255)   NULL,
    [sl_type]                                    CHAR (5)        NULL,
    [sl_ratio_type]                              CHAR (5)        NULL,
    [sl_finance_type]                            CHAR (5)        NULL,
    [sl_conf_source]                             VARCHAR (30)    NULL,
    [lease_flag]                                 BIT             NOT NULL,
    [factor_flag]                                CHAR (1)        NULL,
    [client_name]                                VARCHAR (20)    NULL,
    [inq_print_letter_id]                        INT             NULL,
    [heat_ac_code_attribute_id]                  INT             CONSTRAINT [CDF_pacs_system_heat_ac_code_attribute_id] DEFAULT (9) NOT NULL,
    [penpad_password]                            VARCHAR (32)    NULL,
    [export_path]                                VARCHAR (255)   NULL,
    [future_yr]                                  NUMERIC (4)     NULL,
    [shared_cad_valuation]                       CHAR (1)        NULL,
    [street_default]                             CHAR (1)        CONSTRAINT [CDF_pacs_system_street_default] DEFAULT (0) NULL,
    [pp_waive_penalty_percent]                   NUMERIC (5, 2)  NULL,
    [pp_waive_amount_threshold]                  NUMERIC (14, 2) NULL,
    [so_type]                                    CHAR (10)       NULL,
    [so_method]                                  CHAR (5)        NULL,
    [so_class]                                   CHAR (10)       NULL,
    [sales_ratio_report_ui_mode]                 INT             NULL,
    [pro_notice_hearing_letter_single]           INT             NULL,
    [pro_notice_hearing_letter_multi]            INT             NULL,
    [pro_arb_certified_mailer_agent]             INT             NULL,
    [pro_arb_certified_mailer_owner]             INT             NULL,
    [pro_warn_more_protests_opened]              CHAR (1)        CONSTRAINT [CDF_pacs_system_pro_warn_more_protests_opened] DEFAULT ('F') NULL,
    [arb_mass_prop_entry_def_search]             INT             CONSTRAINT [CDF_pacs_system_arb_mass_prop_entry_def_search] DEFAULT (0) NULL,
    [sketch_default_font]                        INT             NULL,
    [sketch_separator_type]                      CHAR (1)        NULL,
    [sketch_center_label]                        CHAR (1)        NULL,
    [sketch_show_area]                           CHAR (1)        NULL,
    [duplicate_col_warn]                         VARCHAR (100)   NULL,
    [print_appr_card_barcode]                    CHAR (1)        NULL,
    [print_appr_card_sketch]                     CHAR (1)        NULL,
    [sketch_font_name]                           VARCHAR (50)    NULL,
    [sketch_auto_pointer]                        CHAR (1)        NULL,
    [set_actual_taxes]                           CHAR (5)        NULL,
    [pp_rendition_penalty_cad_fee_pct]           NUMERIC (5, 2)  NOT NULL,
    [pp_rendition_penalty_letter]                VARCHAR (100)   NULL,
    [use_app_role]                               BIT             NULL,
    [show_pc_good_field]                         CHAR (1)        NULL,
    [cert_roll_rpt_print_refId2]                 CHAR (1)        NULL,
    [bpp_default_segment]                        CHAR (2)        NULL,
    [display_location_id]                        CHAR (2)        NULL,
    [hswiz_set_homesite]                         BIT             NULL,
    [hswiz_sup_cd]                               VARCHAR (10)    NULL,
    [hswiz_sup_desc]                             VARCHAR (500)   NULL,
    [use_penpad_sketch]                          CHAR (1)        NULL,
    [pp_rendition_wizard_delete_prev_yr]         CHAR (1)        NULL,
    [pp_rend_format]                             CHAR (1)        NULL,
    [store_adj_detail_area]                      BIT             NULL,
    [hswiz_update_app_name_enabled]              VARCHAR (1)     NULL,
    [hswiz_update_app_name_setting]              VARCHAR (1)     NULL,
    [bpp_assetmgr_sort]                          VARCHAR (1)     NULL,
    [warn_arb_prot_save]                         CHAR (1)        NULL,
    [display_agent_warning]                      CHAR (1)        NULL,
    [print_inactive_building_permits]            CHAR (1)        NULL,
    [use_timber_78_values]                       BIT             NULL,
    [arb_warn_more_open_protests_on_open]        CHAR (1)        NULL,
    [default_appr_notice_form]                   VARCHAR (25)    NULL,
    [heat_only_code_attribute_id]                INT             NULL,
    [cool_only_code_attribute_id]                INT             NULL,
    [ptd_sale_submission_export_map_number_as]   VARCHAR (25)    NULL,
    [num_bathrooms_code_attribute_id]            INT             NULL,
    [num_bedrooms_code_attribute_id]             INT             NULL,
    [mineral_import_format_file_path]            VARCHAR (255)   NULL,
    [default_tax_statement_form]                 VARCHAR (15)    NULL,
    [default_inquiry_create_year]                NUMERIC (4)     NULL,
    [default_inquiry_search_year]                NUMERIC (4)     NULL,
    [default_protest_create_year]                NUMERIC (4)     NULL,
    [default_protest_search_year]                NUMERIC (4)     NULL,
    [default_arb_system_override]                BIT             CONSTRAINT [CDF_pacs_system_default_arb_system_override] DEFAULT (0) NOT NULL,
    [override_ownership_wiz_reset_exemption]     BIT             NULL,
    [auto_add_ov65]                              CHAR (1)        NULL,
    [auto_add_ov65_ignore_reset_exemptions]      BIT             NULL,
    [default_arb_system_inquiry_override]        BIT             CONSTRAINT [CDF_pacs_system_default_arb_system_inquiry_override] DEFAULT (0) NOT NULL,
    [default_arb_system_protest_override]        BIT             CONSTRAINT [CDF_pacs_system_default_arb_system_protest_override] DEFAULT (0) NOT NULL,
    [nbhd_cost_calibration_default_target_ratio] NUMERIC (14, 4) CONSTRAINT [CDF_pacs_system_nbhd_cost_calibration_default_target_ratio] DEFAULT (100.00) NOT NULL,
    [pp_rendition_print_column_format]           BIT             CONSTRAINT [CDF_pacs_system_pp_rendition_print_column_format] DEFAULT (0) NOT NULL,
    [owner_transfer_do_reset_exemptions_logic]   BIT             CONSTRAINT [CDF_pacs_system_owner_transfer_do_reset_exemptions_logic] DEFAULT (0) NOT NULL,
    [owner_transfer_set_inactivate_agent]        BIT             CONSTRAINT [CDF_pacs_system_owner_transfer_set_inactivate_agent] DEFAULT (0) NOT NULL,
    [supplement_reason_required]                 BIT             CONSTRAINT [CDF_pacs_system_supplement_reason_required] DEFAULT ((0)) NOT NULL,
    [postpone_duedate]                           BIT             CONSTRAINT [CDF_pacs_system_postpone_duedate] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_pacs_system] PRIMARY KEY CLUSTERED ([id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_pacs_system_appr_card_type] FOREIGN KEY ([appr_card_type]) REFERENCES [dbo].[appr_card_type] ([appr_card_type]),
    CONSTRAINT [CFK_pacs_system_attribute_cool_only_code_attribute_id] FOREIGN KEY ([cool_only_code_attribute_id]) REFERENCES [dbo].[attribute] ([imprv_attr_id]),
    CONSTRAINT [CFK_pacs_system_attribute_heat_ac_code_attribute_id] FOREIGN KEY ([heat_ac_code_attribute_id]) REFERENCES [dbo].[attribute] ([imprv_attr_id]),
    CONSTRAINT [CFK_pacs_system_attribute_heat_only_code_attribute_id] FOREIGN KEY ([heat_only_code_attribute_id]) REFERENCES [dbo].[attribute] ([imprv_attr_id]),
    CONSTRAINT [CFK_pacs_system_attribute_num_bathrooms_code_attribute_id] FOREIGN KEY ([num_bathrooms_code_attribute_id]) REFERENCES [dbo].[attribute] ([imprv_attr_id]),
    CONSTRAINT [CFK_pacs_system_attribute_num_bedrooms_code_attribute_id] FOREIGN KEY ([num_bedrooms_code_attribute_id]) REFERENCES [dbo].[attribute] ([imprv_attr_id]),
    CONSTRAINT [CFK_pacs_system_imprv_det_class] FOREIGN KEY ([so_class]) REFERENCES [dbo].[imprv_det_class] ([imprv_det_class_cd]),
    CONSTRAINT [CFK_pacs_system_imprv_det_meth] FOREIGN KEY ([so_method]) REFERENCES [dbo].[imprv_det_meth] ([imprv_det_meth_cd]),
    CONSTRAINT [CFK_pacs_system_imprv_det_type] FOREIGN KEY ([so_type]) REFERENCES [dbo].[imprv_det_type] ([imprv_det_type_cd]),
    CONSTRAINT [CFK_pacs_system_sale_ratio_type] FOREIGN KEY ([sl_ratio_type]) REFERENCES [dbo].[sale_ratio_type] ([sl_ratio_type_cd]),
    CONSTRAINT [CFK_pacs_system_sale_type] FOREIGN KEY ([sl_type]) REFERENCES [dbo].[sale_type] ([sl_type_cd]),
    CONSTRAINT [CFK_pacs_system_sl_financing] FOREIGN KEY ([sl_finance_type]) REFERENCES [dbo].[sl_financing] ([sl_financing_cd])
);


GO

 
create trigger tr_pacs_system_update_ChangeLog
on pacs_system
for update
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
declare @tvar_key_year int
select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
 
declare @tvar_key_prop_id int
 
declare @old_id int
declare @new_id int
declare @old_tax_yr numeric(4,0)
declare @new_tax_yr numeric(4,0)
declare @old_appr_yr numeric(4,0)
declare @new_appr_yr numeric(4,0)
declare @old_system_type char(1)
declare @new_system_type char(1)
declare @old_rounding_factor numeric(4,0)
declare @new_rounding_factor numeric(4,0)
declare @old_rounding_income_factor numeric(4,0)
declare @new_rounding_income_factor numeric(4,0)
declare @old_receipt_copies int
declare @new_receipt_copies int
declare @old_first_yr_to_supp numeric(4,0)
declare @new_first_yr_to_supp numeric(4,0)
declare @old_validator_line_one varchar(50)
declare @new_validator_line_one varchar(50)
declare @old_validator_line_two varchar(50)
declare @new_validator_line_two varchar(50)
declare @old_validator_line_three varchar(50)
declare @new_validator_line_three varchar(50)
declare @old_validator_line_four varchar(50)
declare @new_validator_line_four varchar(50)
declare @old_validator_line_seven varchar(50)
declare @new_validator_line_seven varchar(50)
declare @old_validator_line_eight varchar(50)
declare @new_validator_line_eight varchar(50)
declare @old_validator_line_nine varchar(50)
declare @new_validator_line_nine varchar(50)
declare @old_geo_id_display_option char(1)
declare @new_geo_id_display_option char(1)
declare @old_phone_num varchar(20)
declare @new_phone_num varchar(20)
declare @old_fax_num varchar(20)
declare @new_fax_num varchar(20)
declare @old_version varchar(20)
declare @new_version varchar(20)
declare @old_oil_well_adj_acres numeric(14,4)
declare @new_oil_well_adj_acres numeric(14,4)
declare @old_apply_land_mass_factor char(1)
declare @new_apply_land_mass_factor char(1)
declare @old_apply_imprv_mass_factor char(1)
declare @new_apply_imprv_mass_factor char(1)
declare @old_distribution_path varchar(100)
declare @new_distribution_path varchar(100)
declare @old_pacsappr_version varchar(100)
declare @new_pacsappr_version varchar(100)
declare @old_pacscol_version varchar(100)
declare @new_pacscol_version varchar(100)
declare @old_confidential_file_as_name varchar(70)
declare @new_confidential_file_as_name varchar(70)
declare @old_confidential_first_name varchar(30)
declare @new_confidential_first_name varchar(30)
declare @old_confidential_last_name varchar(30)
declare @new_confidential_last_name varchar(30)
declare @old_begin_close_dt datetime
declare @new_begin_close_dt datetime
declare @old_starting_check_num int
declare @new_starting_check_num int
declare @old_gis_viewer char(1)
declare @new_gis_viewer char(1)
declare @old_gis_viewer_display_labels char(1)
declare @new_gis_viewer_display_labels char(1)
declare @old_appr_card_type varchar(15)
declare @new_appr_card_type varchar(15)
declare @old_letter_path varchar(255)
declare @new_letter_path varchar(255)
declare @old_label_printer_name varchar(255)
declare @new_label_printer_name varchar(255)
declare @old_face_map_path varchar(255)
declare @new_face_map_path varchar(255)
declare @old_face_map_field varchar(50)
declare @new_face_map_field varchar(50)
declare @old_cold_location varchar(255)
declare @new_cold_location varchar(255)
declare @old_sl_type char(5)
declare @new_sl_type char(5)
declare @old_sl_ratio_type char(5)
declare @new_sl_ratio_type char(5)
declare @old_sl_finance_type char(5)
declare @new_sl_finance_type char(5)
declare @old_sl_conf_source varchar(30)
declare @new_sl_conf_source varchar(30)
declare @old_lease_flag bit
declare @new_lease_flag bit
declare @old_factor_flag char(1)
declare @new_factor_flag char(1)
declare @old_client_name varchar(20)
declare @new_client_name varchar(20)
declare @old_inq_print_letter_id int
declare @new_inq_print_letter_id int
declare @old_heat_ac_code_attribute_id int
declare @new_heat_ac_code_attribute_id int
declare @old_penpad_password varchar(32)
declare @new_penpad_password varchar(32)
declare @old_export_path varchar(255)
declare @new_export_path varchar(255)
declare @old_future_yr numeric(4,0)
declare @new_future_yr numeric(4,0)
declare @old_shared_cad_valuation char(1)
declare @new_shared_cad_valuation char(1)
declare @old_street_default char(1)
declare @new_street_default char(1)
declare @old_pp_waive_penalty_percent numeric(5,2)
declare @new_pp_waive_penalty_percent numeric(5,2)
declare @old_pp_waive_amount_threshold numeric(14,2)
declare @new_pp_waive_amount_threshold numeric(14,2)
declare @old_so_type char(10)
declare @new_so_type char(10)
declare @old_so_method char(5)
declare @new_so_method char(5)
declare @old_so_class char(10)
declare @new_so_class char(10)
declare @old_sales_ratio_report_ui_mode int
declare @new_sales_ratio_report_ui_mode int
declare @old_pro_notice_hearing_letter_single int
declare @new_pro_notice_hearing_letter_single int
declare @old_pro_notice_hearing_letter_multi int
declare @new_pro_notice_hearing_letter_multi int
declare @old_pro_arb_certified_mailer_agent int
declare @new_pro_arb_certified_mailer_agent int
declare @old_pro_arb_certified_mailer_owner int
declare @new_pro_arb_certified_mailer_owner int
declare @old_pro_warn_more_protests_opened char(1)
declare @new_pro_warn_more_protests_opened char(1)
declare @old_arb_mass_prop_entry_def_search int
declare @new_arb_mass_prop_entry_def_search int
declare @old_sketch_default_font int
declare @new_sketch_default_font int
declare @old_sketch_separator_type char(1)
declare @new_sketch_separator_type char(1)
declare @old_sketch_center_label char(1)
declare @new_sketch_center_label char(1)
declare @old_sketch_show_area char(1)
declare @new_sketch_show_area char(1)
declare @old_duplicate_col_warn varchar(100)
declare @new_duplicate_col_warn varchar(100)
declare @old_print_appr_card_barcode char(1)
declare @new_print_appr_card_barcode char(1)
declare @old_print_appr_card_sketch char(1)
declare @new_print_appr_card_sketch char(1)
declare @old_sketch_font_name varchar(50)
declare @new_sketch_font_name varchar(50)
declare @old_sketch_auto_pointer char(1)
declare @new_sketch_auto_pointer char(1)
declare @old_set_actual_taxes char(5)
declare @new_set_actual_taxes char(5)
declare @old_pp_rendition_penalty_cad_fee_pct numeric(5,2)
declare @new_pp_rendition_penalty_cad_fee_pct numeric(5,2)
declare @old_pp_rendition_penalty_letter varchar(100)
declare @new_pp_rendition_penalty_letter varchar(100)
declare @old_use_app_role bit
declare @new_use_app_role bit
declare @old_show_pc_good_field char(1)
declare @new_show_pc_good_field char(1)
declare @old_cert_roll_rpt_print_refId2 char(1)
declare @new_cert_roll_rpt_print_refId2 char(1)
declare @old_bpp_default_segment char(2)
declare @new_bpp_default_segment char(2)
declare @old_display_location_id char(2)
declare @new_display_location_id char(2)
declare @old_hswiz_set_homesite bit
declare @new_hswiz_set_homesite bit
declare @old_hswiz_sup_cd varchar(10)
declare @new_hswiz_sup_cd varchar(10)
declare @old_hswiz_sup_desc varchar(500)
declare @new_hswiz_sup_desc varchar(500)
declare @old_use_penpad_sketch char(1)
declare @new_use_penpad_sketch char(1)
declare @old_pp_rendition_wizard_delete_prev_yr char(1)
declare @new_pp_rendition_wizard_delete_prev_yr char(1)
declare @old_pp_rend_format char(1)
declare @new_pp_rend_format char(1)
declare @old_store_adj_detail_area bit
declare @new_store_adj_detail_area bit
declare @old_hswiz_update_app_name_enabled varchar(1)
declare @new_hswiz_update_app_name_enabled varchar(1)
declare @old_hswiz_update_app_name_setting varchar(1)
declare @new_hswiz_update_app_name_setting varchar(1)
declare @old_bpp_assetmgr_sort varchar(1)
declare @new_bpp_assetmgr_sort varchar(1)
declare @old_warn_arb_prot_save char(1)
declare @new_warn_arb_prot_save char(1)
declare @old_display_agent_warning char(1)
declare @new_display_agent_warning char(1)
declare @old_print_inactive_building_permits char(1)
declare @new_print_inactive_building_permits char(1)
declare @old_use_timber_78_values bit
declare @new_use_timber_78_values bit
declare @old_arb_warn_more_open_protests_on_open char(1)
declare @new_arb_warn_more_open_protests_on_open char(1)
declare @old_default_appr_notice_form varchar(25)
declare @new_default_appr_notice_form varchar(25)
declare @old_heat_only_code_attribute_id int
declare @new_heat_only_code_attribute_id int
declare @old_cool_only_code_attribute_id int
declare @new_cool_only_code_attribute_id int
declare @old_ptd_sale_submission_export_map_number_as varchar(25)
declare @new_ptd_sale_submission_export_map_number_as varchar(25)
declare @old_num_bathrooms_code_attribute_id int
declare @new_num_bathrooms_code_attribute_id int
declare @old_num_bedrooms_code_attribute_id int
declare @new_num_bedrooms_code_attribute_id int
declare @old_mineral_import_format_file_path varchar(255)
declare @new_mineral_import_format_file_path varchar(255)
declare @old_default_tax_statement_form varchar(15)
declare @new_default_tax_statement_form varchar(15)
declare @old_default_inquiry_create_year numeric(4,0)
declare @new_default_inquiry_create_year numeric(4,0)
declare @old_default_inquiry_search_year numeric(4,0)
declare @new_default_inquiry_search_year numeric(4,0)
declare @old_default_protest_create_year numeric(4,0)
declare @new_default_protest_create_year numeric(4,0)
declare @old_default_protest_search_year numeric(4,0)
declare @new_default_protest_search_year numeric(4,0)
declare @old_default_arb_system_override bit
declare @new_default_arb_system_override bit
declare @old_override_ownership_wiz_reset_exemption bit
declare @new_override_ownership_wiz_reset_exemption bit
declare @old_auto_add_ov65 char(1)
declare @new_auto_add_ov65 char(1)
declare @old_auto_add_ov65_ignore_reset_exemptions bit
declare @new_auto_add_ov65_ignore_reset_exemptions bit
declare @old_default_arb_system_inquiry_override bit
declare @new_default_arb_system_inquiry_override bit
declare @old_default_arb_system_protest_override bit
declare @new_default_arb_system_protest_override bit
declare @old_nbhd_cost_calibration_default_target_ratio numeric(14,4)
declare @new_nbhd_cost_calibration_default_target_ratio numeric(14,4)
declare @old_pp_rendition_print_column_format bit
declare @new_pp_rendition_print_column_format bit
declare @old_owner_transfer_do_reset_exemptions_logic bit
declare @new_owner_transfer_do_reset_exemptions_logic bit
declare @old_owner_transfer_set_inactivate_agent bit
declare @new_owner_transfer_set_inactivate_agent bit
declare @old_supplement_reason_required bit
declare @new_supplement_reason_required bit
 
declare curRows cursor
for
     select d.id, d.tax_yr, d.appr_yr, d.system_type, d.rounding_factor, d.rounding_income_factor, d.receipt_copies, d.first_yr_to_supp, d.validator_line_one, d.validator_line_two, d.validator_line_three, d.validator_line_four, d.validator_line_seven, d.validator_line_eight, d.validator_line_nine, d.geo_id_display_option, d.phone_num, d.fax_num, d.version, d.oil_well_adj_acres, d.apply_land_mass_factor, d.apply_imprv_mass_factor, d.distribution_path, d.pacsappr_version, d.pacscol_version, d.confidential_file_as_name, d.confidential_first_name, d.confidential_last_name, d.begin_close_dt, d.starting_check_num, d.gis_viewer, d.gis_viewer_display_labels, d.appr_card_type, d.letter_path, d.label_printer_name, d.face_map_path, d.face_map_field, d.cold_location, d.sl_type, d.sl_ratio_type, d.sl_finance_type, d.sl_conf_source, d.lease_flag, d.factor_flag, d.client_name, d.inq_print_letter_id, d.heat_ac_code_attribute_id, d.penpad_password, d.export_path, d.future_yr, d.shared_cad_valuation, d.street_default, d.pp_waive_penalty_percent, d.pp_waive_amount_threshold, d.so_type, d.so_method, d.so_class, d.sales_ratio_report_ui_mode, d.pro_notice_hearing_letter_single, d.pro_notice_hearing_letter_multi, d.pro_arb_certified_mailer_agent, d.pro_arb_certified_mailer_owner, d.pro_warn_more_protests_opened, d.arb_mass_prop_entry_def_search, d.sketch_default_font, d.sketch_separator_type, d.sketch_center_label, d.sketch_show_area, d.duplicate_col_warn, d.print_appr_card_barcode, d.print_appr_card_sketch, d.sketch_font_name, d.sketch_auto_pointer, d.set_actual_taxes, d.pp_rendition_penalty_cad_fee_pct, d.pp_rendition_penalty_letter, d.use_app_role, d.show_pc_good_field, d.cert_roll_rpt_print_refId2, d.bpp_default_segment, d.display_location_id, d.hswiz_set_homesite, d.hswiz_sup_cd, d.hswiz_sup_desc, d.use_penpad_sketch, d.pp_rendition_wizard_delete_prev_yr, d.pp_rend_format, d.store_adj_detail_area, d.hswiz_update_app_name_enabled, d.hswiz_update_app_name_setting, d.bpp_assetmgr_sort, d.warn_arb_prot_save, d.display_agent_warning, d.print_inactive_building_permits, d.use_timber_78_values, d.arb_warn_more_open_protests_on_open, d.default_appr_notice_form, d.heat_only_code_attribute_id, d.cool_only_code_attribute_id, d.ptd_sale_submission_export_map_number_as, d.num_bathrooms_code_attribute_id, d.num_bedrooms_code_attribute_id, d.mineral_import_format_file_path, d.default_tax_statement_form, d.default_inquiry_create_year, d.default_inquiry_search_year, d.default_protest_create_year, d.default_protest_search_year, d.default_arb_system_override, d.override_ownership_wiz_reset_exemption, d.auto_add_ov65, d.auto_add_ov65_ignore_reset_exemptions, d.default_arb_system_inquiry_override, d.default_arb_system_protest_override, d.nbhd_cost_calibration_default_target_ratio, d.pp_rendition_print_column_format, d.owner_transfer_do_reset_exemptions_logic, d.owner_transfer_set_inactivate_agent, d.supplement_reason_required, 
            i.id, i.tax_yr, i.appr_yr, i.system_type, i.rounding_factor, i.rounding_income_factor, i.receipt_copies, i.first_yr_to_supp, i.validator_line_one, i.validator_line_two, i.validator_line_three, i.validator_line_four, i.validator_line_seven, i.validator_line_eight, i.validator_line_nine, i.geo_id_display_option, i.phone_num, i.fax_num, i.version, i.oil_well_adj_acres, i.apply_land_mass_factor, i.apply_imprv_mass_factor, i.distribution_path, i.pacsappr_version, i.pacscol_version, i.confidential_file_as_name, i.confidential_first_name, i.confidential_last_name, i.begin_close_dt, i.starting_check_num, i.gis_viewer, i.gis_viewer_display_labels, i.appr_card_type, i.letter_path, i.label_printer_name, i.face_map_path, i.face_map_field, i.cold_location, i.sl_type, i.sl_ratio_type, i.sl_finance_type, i.sl_conf_source, i.lease_flag, i.factor_flag, i.client_name, i.inq_print_letter_id, i.heat_ac_code_attribute_id, i.penpad_password, i.export_path, i.future_yr, i.shared_cad_valuation, i.street_default, i.pp_waive_penalty_percent, i.pp_waive_amount_threshold, i.so_type, i.so_method, i.so_class, i.sales_ratio_report_ui_mode, i.pro_notice_hearing_letter_single, i.pro_notice_hearing_letter_multi, i.pro_arb_certified_mailer_agent, i.pro_arb_certified_mailer_owner, i.pro_warn_more_protests_opened, i.arb_mass_prop_entry_def_search, i.sketch_default_font, i.sketch_separator_type, i.sketch_center_label, i.sketch_show_area, i.duplicate_col_warn, i.print_appr_card_barcode, i.print_appr_card_sketch, i.sketch_font_name, i.sketch_auto_pointer, i.set_actual_taxes, i.pp_rendition_penalty_cad_fee_pct, i.pp_rendition_penalty_letter, i.use_app_role, i.show_pc_good_field, i.cert_roll_rpt_print_refId2, i.bpp_default_segment, i.display_location_id, i.hswiz_set_homesite, i.hswiz_sup_cd, i.hswiz_sup_desc, i.use_penpad_sketch, i.pp_rendition_wizard_delete_prev_yr, i.pp_rend_format, i.store_adj_detail_area, i.hswiz_update_app_name_enabled, i.hswiz_update_app_name_setting, i.bpp_assetmgr_sort, i.warn_arb_prot_save, i.display_agent_warning, i.print_inactive_building_permits, i.use_timber_78_values, i.arb_warn_more_open_protests_on_open, i.default_appr_notice_form, i.heat_only_code_attribute_id, i.cool_only_code_attribute_id, i.ptd_sale_submission_export_map_number_as, i.num_bathrooms_code_attribute_id, i.num_bedrooms_code_attribute_id, i.mineral_import_format_file_path, i.default_tax_statement_form, i.default_inquiry_create_year, i.default_inquiry_search_year, i.default_protest_create_year, i.default_protest_search_year, i.default_arb_system_override, i.override_ownership_wiz_reset_exemption, i.auto_add_ov65, i.auto_add_ov65_ignore_reset_exemptions, i.default_arb_system_inquiry_override, i.default_arb_system_protest_override, i.nbhd_cost_calibration_default_target_ratio, i.pp_rendition_print_column_format, i.owner_transfer_do_reset_exemptions_logic, i.owner_transfer_set_inactivate_agent, i.supplement_reason_required
from deleted as d
join inserted as i on 
     d.id = i.id
for read only
 
open curRows
fetch next from curRows into @old_id, @old_tax_yr, @old_appr_yr, @old_system_type, @old_rounding_factor, @old_rounding_income_factor, @old_receipt_copies, @old_first_yr_to_supp, @old_validator_line_one, @old_validator_line_two, @old_validator_line_three, @old_validator_line_four, @old_validator_line_seven, @old_validator_line_eight, @old_validator_line_nine, @old_geo_id_display_option, @old_phone_num, @old_fax_num, @old_version, @old_oil_well_adj_acres, @old_apply_land_mass_factor, @old_apply_imprv_mass_factor, @old_distribution_path, @old_pacsappr_version, @old_pacscol_version, @old_confidential_file_as_name, @old_confidential_first_name, @old_confidential_last_name, @old_begin_close_dt, @old_starting_check_num, @old_gis_viewer, @old_gis_viewer_display_labels, @old_appr_card_type, @old_letter_path, @old_label_printer_name, @old_face_map_path, @old_face_map_field, @old_cold_location, @old_sl_type, @old_sl_ratio_type, @old_sl_finance_type, @old_sl_conf_source, @old_lease_flag, @old_factor_flag, @old_client_name, @old_inq_print_letter_id, @old_heat_ac_code_attribute_id, @old_penpad_password, @old_export_path, @old_future_yr, @old_shared_cad_valuation, @old_street_default, @old_pp_waive_penalty_percent, @old_pp_waive_amount_threshold, @old_so_type, @old_so_method, @old_so_class, @old_sales_ratio_report_ui_mode, @old_pro_notice_hearing_letter_single, @old_pro_notice_hearing_letter_multi, @old_pro_arb_certified_mailer_agent, @old_pro_arb_certified_mailer_owner, @old_pro_warn_more_protests_opened, @old_arb_mass_prop_entry_def_search, @old_sketch_default_font, @old_sketch_separator_type, @old_sketch_center_label, @old_sketch_show_area, @old_duplicate_col_warn, @old_print_appr_card_barcode, @old_print_appr_card_sketch, @old_sketch_font_name, @old_sketch_auto_pointer, @old_set_actual_taxes, @old_pp_rendition_penalty_cad_fee_pct, @old_pp_rendition_penalty_letter, @old_use_app_role, @old_show_pc_good_field, @old_cert_roll_rpt_print_refId2, @old_bpp_default_segment, @old_display_location_id, @old_hswiz_set_homesite, @old_hswiz_sup_cd, @old_hswiz_sup_desc, @old_use_penpad_sketch, @old_pp_rendition_wizard_delete_prev_yr, @old_pp_rend_format, @old_store_adj_detail_area, @old_hswiz_update_app_name_enabled, @old_hswiz_update_app_name_setting, @old_bpp_assetmgr_sort, @old_warn_arb_prot_save, @old_display_agent_warning, @old_print_inactive_building_permits, @old_use_timber_78_values, @old_arb_warn_more_open_protests_on_open, @old_default_appr_notice_form, @old_heat_only_code_attribute_id, @old_cool_only_code_attribute_id, @old_ptd_sale_submission_export_map_number_as, @old_num_bathrooms_code_attribute_id, @old_num_bedrooms_code_attribute_id, @old_mineral_import_format_file_path, @old_default_tax_statement_form, @old_default_inquiry_create_year, @old_default_inquiry_search_year, @old_default_protest_create_year, @old_default_protest_search_year, @old_default_arb_system_override, @old_override_ownership_wiz_reset_exemption, @old_auto_add_ov65, @old_auto_add_ov65_ignore_reset_exemptions, @old_default_arb_system_inquiry_override, @old_default_arb_system_protest_override, @old_nbhd_cost_calibration_default_target_ratio, @old_pp_rendition_print_column_format, @old_owner_transfer_do_reset_exemptions_logic, @old_owner_transfer_set_inactivate_agent, @old_supplement_reason_required, 
                             @new_id, @new_tax_yr, @new_appr_yr, @new_system_type, @new_rounding_factor, @new_rounding_income_factor, @new_receipt_copies, @new_first_yr_to_supp, @new_validator_line_one, @new_validator_line_two, @new_validator_line_three, @new_validator_line_four, @new_validator_line_seven, @new_validator_line_eight, @new_validator_line_nine, @new_geo_id_display_option, @new_phone_num, @new_fax_num, @new_version, @new_oil_well_adj_acres, @new_apply_land_mass_factor, @new_apply_imprv_mass_factor, @new_distribution_path, @new_pacsappr_version, @new_pacscol_version, @new_confidential_file_as_name, @new_confidential_first_name, @new_confidential_last_name, @new_begin_close_dt, @new_starting_check_num, @new_gis_viewer, @new_gis_viewer_display_labels, @new_appr_card_type, @new_letter_path, @new_label_printer_name, @new_face_map_path, @new_face_map_field, @new_cold_location, @new_sl_type, @new_sl_ratio_type, @new_sl_finance_type, @new_sl_conf_source, @new_lease_flag, @new_factor_flag, @new_client_name, @new_inq_print_letter_id, @new_heat_ac_code_attribute_id, @new_penpad_password, @new_export_path, @new_future_yr, @new_shared_cad_valuation, @new_street_default, @new_pp_waive_penalty_percent, @new_pp_waive_amount_threshold, @new_so_type, @new_so_method, @new_so_class, @new_sales_ratio_report_ui_mode, @new_pro_notice_hearing_letter_single, @new_pro_notice_hearing_letter_multi, @new_pro_arb_certified_mailer_agent, @new_pro_arb_certified_mailer_owner, @new_pro_warn_more_protests_opened, @new_arb_mass_prop_entry_def_search, @new_sketch_default_font, @new_sketch_separator_type, @new_sketch_center_label, @new_sketch_show_area, @new_duplicate_col_warn, @new_print_appr_card_barcode, @new_print_appr_card_sketch, @new_sketch_font_name, @new_sketch_auto_pointer, @new_set_actual_taxes, @new_pp_rendition_penalty_cad_fee_pct, @new_pp_rendition_penalty_letter, @new_use_app_role, @new_show_pc_good_field, @new_cert_roll_rpt_print_refId2, @new_bpp_default_segment, @new_display_location_id, @new_hswiz_set_homesite, @new_hswiz_sup_cd, @new_hswiz_sup_desc, @new_use_penpad_sketch, @new_pp_rendition_wizard_delete_prev_yr, @new_pp_rend_format, @new_store_adj_detail_area, @new_hswiz_update_app_name_enabled, @new_hswiz_update_app_name_setting, @new_bpp_assetmgr_sort, @new_warn_arb_prot_save, @new_display_agent_warning, @new_print_inactive_building_permits, @new_use_timber_78_values, @new_arb_warn_more_open_protests_on_open, @new_default_appr_notice_form, @new_heat_only_code_attribute_id, @new_cool_only_code_attribute_id, @new_ptd_sale_submission_export_map_number_as, @new_num_bathrooms_code_attribute_id, @new_num_bedrooms_code_attribute_id, @new_mineral_import_format_file_path, @new_default_tax_statement_form, @new_default_inquiry_create_year, @new_default_inquiry_search_year, @new_default_protest_create_year, @new_default_protest_search_year, @new_default_arb_system_override, @new_override_ownership_wiz_reset_exemption, @new_auto_add_ov65, @new_auto_add_ov65_ignore_reset_exemptions, @new_default_arb_system_inquiry_override, @new_default_arb_system_protest_override, @new_nbhd_cost_calibration_default_target_ratio, @new_pp_rendition_print_column_format, @new_owner_transfer_do_reset_exemptions_logic, @new_owner_transfer_set_inactivate_agent, @new_supplement_reason_required
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_id <> @new_id
          or
          ( @old_id is null and @new_id is not null ) 
          or
          ( @old_id is not null and @new_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 2140, convert(varchar(255), @old_id), convert(varchar(255), @new_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_tax_yr <> @new_tax_yr
          or
          ( @old_tax_yr is null and @new_tax_yr is not null ) 
          or
          ( @old_tax_yr is not null and @new_tax_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5136, convert(varchar(255), @old_tax_yr), convert(varchar(255), @new_tax_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_appr_yr <> @new_appr_yr
          or
          ( @old_appr_yr is null and @new_appr_yr is not null ) 
          or
          ( @old_appr_yr is not null and @new_appr_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'appr_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 240, convert(varchar(255), @old_appr_yr), convert(varchar(255), @new_appr_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_system_type <> @new_system_type
          or
          ( @old_system_type is null and @new_system_type is not null ) 
          or
          ( @old_system_type is not null and @new_system_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'system_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5029, convert(varchar(255), @old_system_type), convert(varchar(255), @new_system_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_rounding_factor <> @new_rounding_factor
          or
          ( @old_rounding_factor is null and @new_rounding_factor is not null ) 
          or
          ( @old_rounding_factor is not null and @new_rounding_factor is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'rounding_factor' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 4432, convert(varchar(255), @old_rounding_factor), convert(varchar(255), @new_rounding_factor), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_rounding_income_factor <> @new_rounding_income_factor
          or
          ( @old_rounding_income_factor is null and @new_rounding_income_factor is not null ) 
          or
          ( @old_rounding_income_factor is not null and @new_rounding_income_factor is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'rounding_income_factor' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 4433, convert(varchar(255), @old_rounding_income_factor), convert(varchar(255), @new_rounding_income_factor), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_receipt_copies <> @new_receipt_copies
          or
          ( @old_receipt_copies is null and @new_receipt_copies is not null ) 
          or
          ( @old_receipt_copies is not null and @new_receipt_copies is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'receipt_copies' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 4317, convert(varchar(255), @old_receipt_copies), convert(varchar(255), @new_receipt_copies), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_first_yr_to_supp <> @new_first_yr_to_supp
          or
          ( @old_first_yr_to_supp is null and @new_first_yr_to_supp is not null ) 
          or
          ( @old_first_yr_to_supp is not null and @new_first_yr_to_supp is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'first_yr_to_supp' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 1921, convert(varchar(255), @old_first_yr_to_supp), convert(varchar(255), @new_first_yr_to_supp), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_validator_line_one <> @new_validator_line_one
          or
          ( @old_validator_line_one is null and @new_validator_line_one is not null ) 
          or
          ( @old_validator_line_one is not null and @new_validator_line_one is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'validator_line_one' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5477, convert(varchar(255), @old_validator_line_one), convert(varchar(255), @new_validator_line_one), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_validator_line_two <> @new_validator_line_two
          or
          ( @old_validator_line_two is null and @new_validator_line_two is not null ) 
          or
          ( @old_validator_line_two is not null and @new_validator_line_two is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'validator_line_two' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5480, convert(varchar(255), @old_validator_line_two), convert(varchar(255), @new_validator_line_two), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_validator_line_three <> @new_validator_line_three
          or
          ( @old_validator_line_three is null and @new_validator_line_three is not null ) 
          or
          ( @old_validator_line_three is not null and @new_validator_line_three is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'validator_line_three' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5479, convert(varchar(255), @old_validator_line_three), convert(varchar(255), @new_validator_line_three), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_validator_line_four <> @new_validator_line_four
          or
          ( @old_validator_line_four is null and @new_validator_line_four is not null ) 
          or
          ( @old_validator_line_four is not null and @new_validator_line_four is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'validator_line_four' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5475, convert(varchar(255), @old_validator_line_four), convert(varchar(255), @new_validator_line_four), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_validator_line_seven <> @new_validator_line_seven
          or
          ( @old_validator_line_seven is null and @new_validator_line_seven is not null ) 
          or
          ( @old_validator_line_seven is not null and @new_validator_line_seven is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'validator_line_seven' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5478, convert(varchar(255), @old_validator_line_seven), convert(varchar(255), @new_validator_line_seven), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_validator_line_eight <> @new_validator_line_eight
          or
          ( @old_validator_line_eight is null and @new_validator_line_eight is not null ) 
          or
          ( @old_validator_line_eight is not null and @new_validator_line_eight is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'validator_line_eight' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5474, convert(varchar(255), @old_validator_line_eight), convert(varchar(255), @new_validator_line_eight), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_validator_line_nine <> @new_validator_line_nine
          or
          ( @old_validator_line_nine is null and @new_validator_line_nine is not null ) 
          or
          ( @old_validator_line_nine is not null and @new_validator_line_nine is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'validator_line_nine' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5476, convert(varchar(255), @old_validator_line_nine), convert(varchar(255), @new_validator_line_nine), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_geo_id_display_option <> @new_geo_id_display_option
          or
          ( @old_geo_id_display_option is null and @new_geo_id_display_option is not null ) 
          or
          ( @old_geo_id_display_option is not null and @new_geo_id_display_option is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'geo_id_display_option' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 2007, convert(varchar(255), @old_geo_id_display_option), convert(varchar(255), @new_geo_id_display_option), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_phone_num <> @new_phone_num
          or
          ( @old_phone_num is null and @new_phone_num is not null ) 
          or
          ( @old_phone_num is not null and @new_phone_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'phone_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 3734, convert(varchar(255), @old_phone_num), convert(varchar(255), @new_phone_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_fax_num <> @new_fax_num
          or
          ( @old_fax_num is null and @new_fax_num is not null ) 
          or
          ( @old_fax_num is not null and @new_fax_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'fax_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 1861, convert(varchar(255), @old_fax_num), convert(varchar(255), @new_fax_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_version <> @new_version
          or
          ( @old_version is null and @new_version is not null ) 
          or
          ( @old_version is not null and @new_version is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'version' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5505, convert(varchar(255), @old_version), convert(varchar(255), @new_version), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_oil_well_adj_acres <> @new_oil_well_adj_acres
          or
          ( @old_oil_well_adj_acres is null and @new_oil_well_adj_acres is not null ) 
          or
          ( @old_oil_well_adj_acres is not null and @new_oil_well_adj_acres is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'oil_well_adj_acres' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 3401, convert(varchar(255), @old_oil_well_adj_acres), convert(varchar(255), @new_oil_well_adj_acres), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_apply_land_mass_factor <> @new_apply_land_mass_factor
          or
          ( @old_apply_land_mass_factor is null and @new_apply_land_mass_factor is not null ) 
          or
          ( @old_apply_land_mass_factor is not null and @new_apply_land_mass_factor is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'apply_land_mass_factor' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 222, convert(varchar(255), @old_apply_land_mass_factor), convert(varchar(255), @new_apply_land_mass_factor), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_apply_imprv_mass_factor <> @new_apply_imprv_mass_factor
          or
          ( @old_apply_imprv_mass_factor is null and @new_apply_imprv_mass_factor is not null ) 
          or
          ( @old_apply_imprv_mass_factor is not null and @new_apply_imprv_mass_factor is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'apply_imprv_mass_factor' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 221, convert(varchar(255), @old_apply_imprv_mass_factor), convert(varchar(255), @new_apply_imprv_mass_factor), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_distribution_path <> @new_distribution_path
          or
          ( @old_distribution_path is null and @new_distribution_path is not null ) 
          or
          ( @old_distribution_path is not null and @new_distribution_path is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'distribution_path' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 1362, convert(varchar(255), @old_distribution_path), convert(varchar(255), @new_distribution_path), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pacsappr_version <> @new_pacsappr_version
          or
          ( @old_pacsappr_version is null and @new_pacsappr_version is not null ) 
          or
          ( @old_pacsappr_version is not null and @new_pacsappr_version is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pacsappr_version' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 3530, convert(varchar(255), @old_pacsappr_version), convert(varchar(255), @new_pacsappr_version), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pacscol_version <> @new_pacscol_version
          or
          ( @old_pacscol_version is null and @new_pacscol_version is not null ) 
          or
          ( @old_pacscol_version is not null and @new_pacscol_version is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pacscol_version' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 3531, convert(varchar(255), @old_pacscol_version), convert(varchar(255), @new_pacscol_version), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_confidential_file_as_name <> @new_confidential_file_as_name
          or
          ( @old_confidential_file_as_name is null and @new_confidential_file_as_name is not null ) 
          or
          ( @old_confidential_file_as_name is not null and @new_confidential_file_as_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'confidential_file_as_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 847, convert(varchar(255), @old_confidential_file_as_name), convert(varchar(255), @new_confidential_file_as_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_confidential_first_name <> @new_confidential_first_name
          or
          ( @old_confidential_first_name is null and @new_confidential_first_name is not null ) 
          or
          ( @old_confidential_first_name is not null and @new_confidential_first_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'confidential_first_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 848, convert(varchar(255), @old_confidential_first_name), convert(varchar(255), @new_confidential_first_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_confidential_last_name <> @new_confidential_last_name
          or
          ( @old_confidential_last_name is null and @new_confidential_last_name is not null ) 
          or
          ( @old_confidential_last_name is not null and @new_confidential_last_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'confidential_last_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 850, convert(varchar(255), @old_confidential_last_name), convert(varchar(255), @new_confidential_last_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_begin_close_dt <> @new_begin_close_dt
          or
          ( @old_begin_close_dt is null and @new_begin_close_dt is not null ) 
          or
          ( @old_begin_close_dt is not null and @new_begin_close_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'begin_close_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 473, convert(varchar(255), @old_begin_close_dt), convert(varchar(255), @new_begin_close_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_starting_check_num <> @new_starting_check_num
          or
          ( @old_starting_check_num is null and @new_starting_check_num is not null ) 
          or
          ( @old_starting_check_num is not null and @new_starting_check_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'starting_check_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 4924, convert(varchar(255), @old_starting_check_num), convert(varchar(255), @new_starting_check_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_gis_viewer <> @new_gis_viewer
          or
          ( @old_gis_viewer is null and @new_gis_viewer is not null ) 
          or
          ( @old_gis_viewer is not null and @new_gis_viewer is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'gis_viewer' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 2009, convert(varchar(255), @old_gis_viewer), convert(varchar(255), @new_gis_viewer), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_gis_viewer_display_labels <> @new_gis_viewer_display_labels
          or
          ( @old_gis_viewer_display_labels is null and @new_gis_viewer_display_labels is not null ) 
          or
          ( @old_gis_viewer_display_labels is not null and @new_gis_viewer_display_labels is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'gis_viewer_display_labels' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 2010, convert(varchar(255), @old_gis_viewer_display_labels), convert(varchar(255), @new_gis_viewer_display_labels), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_appr_card_type <> @new_appr_card_type
          or
          ( @old_appr_card_type is null and @new_appr_card_type is not null ) 
          or
          ( @old_appr_card_type is not null and @new_appr_card_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'appr_card_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 228, convert(varchar(255), @old_appr_card_type), convert(varchar(255), @new_appr_card_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_letter_path <> @new_letter_path
          or
          ( @old_letter_path is null and @new_letter_path is not null ) 
          or
          ( @old_letter_path is not null and @new_letter_path is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'letter_path' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 2799, convert(varchar(255), @old_letter_path), convert(varchar(255), @new_letter_path), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_label_printer_name <> @new_label_printer_name
          or
          ( @old_label_printer_name is null and @new_label_printer_name is not null ) 
          or
          ( @old_label_printer_name is not null and @new_label_printer_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'label_printer_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 2511, convert(varchar(255), @old_label_printer_name), convert(varchar(255), @new_label_printer_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_face_map_path <> @new_face_map_path
          or
          ( @old_face_map_path is null and @new_face_map_path is not null ) 
          or
          ( @old_face_map_path is not null and @new_face_map_path is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'face_map_path' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 1857, convert(varchar(255), @old_face_map_path), convert(varchar(255), @new_face_map_path), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_face_map_field <> @new_face_map_field
          or
          ( @old_face_map_field is null and @new_face_map_field is not null ) 
          or
          ( @old_face_map_field is not null and @new_face_map_field is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'face_map_field' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 1856, convert(varchar(255), @old_face_map_field), convert(varchar(255), @new_face_map_field), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_cold_location <> @new_cold_location
          or
          ( @old_cold_location is null and @new_cold_location is not null ) 
          or
          ( @old_cold_location is not null and @new_cold_location is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'cold_location' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 799, convert(varchar(255), @old_cold_location), convert(varchar(255), @new_cold_location), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_sl_type <> @new_sl_type
          or
          ( @old_sl_type is null and @new_sl_type is not null ) 
          or
          ( @old_sl_type is not null and @new_sl_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'sl_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 4795, convert(varchar(255), @old_sl_type), convert(varchar(255), @new_sl_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_sl_ratio_type <> @new_sl_ratio_type
          or
          ( @old_sl_ratio_type is null and @new_sl_ratio_type is not null ) 
          or
          ( @old_sl_ratio_type is not null and @new_sl_ratio_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'sl_ratio_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 4790, convert(varchar(255), @old_sl_ratio_type), convert(varchar(255), @new_sl_ratio_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_sl_finance_type <> @new_sl_finance_type
          or
          ( @old_sl_finance_type is null and @new_sl_finance_type is not null ) 
          or
          ( @old_sl_finance_type is not null and @new_sl_finance_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'sl_finance_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 4773, convert(varchar(255), @old_sl_finance_type), convert(varchar(255), @new_sl_finance_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_sl_conf_source <> @new_sl_conf_source
          or
          ( @old_sl_conf_source is null and @new_sl_conf_source is not null ) 
          or
          ( @old_sl_conf_source is not null and @new_sl_conf_source is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'sl_conf_source' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 4768, convert(varchar(255), @old_sl_conf_source), convert(varchar(255), @new_sl_conf_source), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_lease_flag <> @new_lease_flag
          or
          ( @old_lease_flag is null and @new_lease_flag is not null ) 
          or
          ( @old_lease_flag is not null and @new_lease_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'lease_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 2760, convert(varchar(255), @old_lease_flag), convert(varchar(255), @new_lease_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_factor_flag <> @new_factor_flag
          or
          ( @old_factor_flag is null and @new_factor_flag is not null ) 
          or
          ( @old_factor_flag is not null and @new_factor_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'factor_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 1858, convert(varchar(255), @old_factor_flag), convert(varchar(255), @new_factor_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_client_name <> @new_client_name
          or
          ( @old_client_name is null and @new_client_name is not null ) 
          or
          ( @old_client_name is not null and @new_client_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'client_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 764, convert(varchar(255), @old_client_name), convert(varchar(255), @new_client_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_inq_print_letter_id <> @new_inq_print_letter_id
          or
          ( @old_inq_print_letter_id is null and @new_inq_print_letter_id is not null ) 
          or
          ( @old_inq_print_letter_id is not null and @new_inq_print_letter_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'inq_print_letter_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 2393, convert(varchar(255), @old_inq_print_letter_id), convert(varchar(255), @new_inq_print_letter_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_heat_ac_code_attribute_id <> @new_heat_ac_code_attribute_id
          or
          ( @old_heat_ac_code_attribute_id is null and @new_heat_ac_code_attribute_id is not null ) 
          or
          ( @old_heat_ac_code_attribute_id is not null and @new_heat_ac_code_attribute_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'heat_ac_code_attribute_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 2056, convert(varchar(255), @old_heat_ac_code_attribute_id), convert(varchar(255), @new_heat_ac_code_attribute_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_penpad_password <> @new_penpad_password
          or
          ( @old_penpad_password is null and @new_penpad_password is not null ) 
          or
          ( @old_penpad_password is not null and @new_penpad_password is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'penpad_password' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 3631, convert(varchar(255), @old_penpad_password), convert(varchar(255), @new_penpad_password), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_export_path <> @new_export_path
          or
          ( @old_export_path is null and @new_export_path is not null ) 
          or
          ( @old_export_path is not null and @new_export_path is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'export_path' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5936, convert(varchar(255), @old_export_path), convert(varchar(255), @new_export_path), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_future_yr <> @new_future_yr
          or
          ( @old_future_yr is null and @new_future_yr is not null ) 
          or
          ( @old_future_yr is not null and @new_future_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'future_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5937, convert(varchar(255), @old_future_yr), convert(varchar(255), @new_future_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_shared_cad_valuation <> @new_shared_cad_valuation
          or
          ( @old_shared_cad_valuation is null and @new_shared_cad_valuation is not null ) 
          or
          ( @old_shared_cad_valuation is not null and @new_shared_cad_valuation is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'shared_cad_valuation' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5938, convert(varchar(255), @old_shared_cad_valuation), convert(varchar(255), @new_shared_cad_valuation), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_street_default <> @new_street_default
          or
          ( @old_street_default is null and @new_street_default is not null ) 
          or
          ( @old_street_default is not null and @new_street_default is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'street_default' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8743, convert(varchar(255), @old_street_default), convert(varchar(255), @new_street_default), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pp_waive_penalty_percent <> @new_pp_waive_penalty_percent
          or
          ( @old_pp_waive_penalty_percent is null and @new_pp_waive_penalty_percent is not null ) 
          or
          ( @old_pp_waive_penalty_percent is not null and @new_pp_waive_penalty_percent is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pp_waive_penalty_percent' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5934, convert(varchar(255), @old_pp_waive_penalty_percent), convert(varchar(255), @new_pp_waive_penalty_percent), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pp_waive_amount_threshold <> @new_pp_waive_amount_threshold
          or
          ( @old_pp_waive_amount_threshold is null and @new_pp_waive_amount_threshold is not null ) 
          or
          ( @old_pp_waive_amount_threshold is not null and @new_pp_waive_amount_threshold is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pp_waive_amount_threshold' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 5935, convert(varchar(255), @old_pp_waive_amount_threshold), convert(varchar(255), @new_pp_waive_amount_threshold), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_so_type <> @new_so_type
          or
          ( @old_so_type is null and @new_so_type is not null ) 
          or
          ( @old_so_type is not null and @new_so_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'so_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8739, convert(varchar(255), @old_so_type), convert(varchar(255), @new_so_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_so_method <> @new_so_method
          or
          ( @old_so_method is null and @new_so_method is not null ) 
          or
          ( @old_so_method is not null and @new_so_method is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'so_method' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8738, convert(varchar(255), @old_so_method), convert(varchar(255), @new_so_method), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_so_class <> @new_so_class
          or
          ( @old_so_class is null and @new_so_class is not null ) 
          or
          ( @old_so_class is not null and @new_so_class is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'so_class' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8737, convert(varchar(255), @old_so_class), convert(varchar(255), @new_so_class), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_sales_ratio_report_ui_mode <> @new_sales_ratio_report_ui_mode
          or
          ( @old_sales_ratio_report_ui_mode is null and @new_sales_ratio_report_ui_mode is not null ) 
          or
          ( @old_sales_ratio_report_ui_mode is not null and @new_sales_ratio_report_ui_mode is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'sales_ratio_report_ui_mode' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8730, convert(varchar(255), @old_sales_ratio_report_ui_mode), convert(varchar(255), @new_sales_ratio_report_ui_mode), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pro_notice_hearing_letter_single <> @new_pro_notice_hearing_letter_single
          or
          ( @old_pro_notice_hearing_letter_single is null and @new_pro_notice_hearing_letter_single is not null ) 
          or
          ( @old_pro_notice_hearing_letter_single is not null and @new_pro_notice_hearing_letter_single is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pro_notice_hearing_letter_single' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8717, convert(varchar(255), @old_pro_notice_hearing_letter_single), convert(varchar(255), @new_pro_notice_hearing_letter_single), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pro_notice_hearing_letter_multi <> @new_pro_notice_hearing_letter_multi
          or
          ( @old_pro_notice_hearing_letter_multi is null and @new_pro_notice_hearing_letter_multi is not null ) 
          or
          ( @old_pro_notice_hearing_letter_multi is not null and @new_pro_notice_hearing_letter_multi is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pro_notice_hearing_letter_multi' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8716, convert(varchar(255), @old_pro_notice_hearing_letter_multi), convert(varchar(255), @new_pro_notice_hearing_letter_multi), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pro_arb_certified_mailer_agent <> @new_pro_arb_certified_mailer_agent
          or
          ( @old_pro_arb_certified_mailer_agent is null and @new_pro_arb_certified_mailer_agent is not null ) 
          or
          ( @old_pro_arb_certified_mailer_agent is not null and @new_pro_arb_certified_mailer_agent is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pro_arb_certified_mailer_agent' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8714, convert(varchar(255), @old_pro_arb_certified_mailer_agent), convert(varchar(255), @new_pro_arb_certified_mailer_agent), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pro_arb_certified_mailer_owner <> @new_pro_arb_certified_mailer_owner
          or
          ( @old_pro_arb_certified_mailer_owner is null and @new_pro_arb_certified_mailer_owner is not null ) 
          or
          ( @old_pro_arb_certified_mailer_owner is not null and @new_pro_arb_certified_mailer_owner is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pro_arb_certified_mailer_owner' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8715, convert(varchar(255), @old_pro_arb_certified_mailer_owner), convert(varchar(255), @new_pro_arb_certified_mailer_owner), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pro_warn_more_protests_opened <> @new_pro_warn_more_protests_opened
          or
          ( @old_pro_warn_more_protests_opened is null and @new_pro_warn_more_protests_opened is not null ) 
          or
          ( @old_pro_warn_more_protests_opened is not null and @new_pro_warn_more_protests_opened is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pro_warn_more_protests_opened' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8718, convert(varchar(255), @old_pro_warn_more_protests_opened), convert(varchar(255), @new_pro_warn_more_protests_opened), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_arb_mass_prop_entry_def_search <> @new_arb_mass_prop_entry_def_search
          or
          ( @old_arb_mass_prop_entry_def_search is null and @new_arb_mass_prop_entry_def_search is not null ) 
          or
          ( @old_arb_mass_prop_entry_def_search is not null and @new_arb_mass_prop_entry_def_search is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'arb_mass_prop_entry_def_search' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8475, convert(varchar(255), @old_arb_mass_prop_entry_def_search), convert(varchar(255), @new_arb_mass_prop_entry_def_search), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_sketch_default_font <> @new_sketch_default_font
          or
          ( @old_sketch_default_font is null and @new_sketch_default_font is not null ) 
          or
          ( @old_sketch_default_font is not null and @new_sketch_default_font is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'sketch_default_font' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8734, convert(varchar(255), @old_sketch_default_font), convert(varchar(255), @new_sketch_default_font), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_sketch_separator_type <> @new_sketch_separator_type
          or
          ( @old_sketch_separator_type is null and @new_sketch_separator_type is not null ) 
          or
          ( @old_sketch_separator_type is not null and @new_sketch_separator_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'sketch_separator_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8735, convert(varchar(255), @old_sketch_separator_type), convert(varchar(255), @new_sketch_separator_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_sketch_center_label <> @new_sketch_center_label
          or
          ( @old_sketch_center_label is null and @new_sketch_center_label is not null ) 
          or
          ( @old_sketch_center_label is not null and @new_sketch_center_label is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'sketch_center_label' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8733, convert(varchar(255), @old_sketch_center_label), convert(varchar(255), @new_sketch_center_label), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_sketch_show_area <> @new_sketch_show_area
          or
          ( @old_sketch_show_area is null and @new_sketch_show_area is not null ) 
          or
          ( @old_sketch_show_area is not null and @new_sketch_show_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'sketch_show_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8736, convert(varchar(255), @old_sketch_show_area), convert(varchar(255), @new_sketch_show_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_duplicate_col_warn <> @new_duplicate_col_warn
          or
          ( @old_duplicate_col_warn is null and @new_duplicate_col_warn is not null ) 
          or
          ( @old_duplicate_col_warn is not null and @new_duplicate_col_warn is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'duplicate_col_warn' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 8591, convert(varchar(255), @old_duplicate_col_warn), convert(varchar(255), @new_duplicate_col_warn), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_print_appr_card_barcode <> @new_print_appr_card_barcode
          or
          ( @old_print_appr_card_barcode is null and @new_print_appr_card_barcode is not null ) 
          or
          ( @old_print_appr_card_barcode is not null and @new_print_appr_card_barcode is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'print_appr_card_barcode' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9209, convert(varchar(255), @old_print_appr_card_barcode), convert(varchar(255), @new_print_appr_card_barcode), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_print_appr_card_sketch <> @new_print_appr_card_sketch
          or
          ( @old_print_appr_card_sketch is null and @new_print_appr_card_sketch is not null ) 
          or
          ( @old_print_appr_card_sketch is not null and @new_print_appr_card_sketch is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'print_appr_card_sketch' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9210, convert(varchar(255), @old_print_appr_card_sketch), convert(varchar(255), @new_print_appr_card_sketch), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_sketch_font_name <> @new_sketch_font_name
          or
          ( @old_sketch_font_name is null and @new_sketch_font_name is not null ) 
          or
          ( @old_sketch_font_name is not null and @new_sketch_font_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'sketch_font_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9225, convert(varchar(255), @old_sketch_font_name), convert(varchar(255), @new_sketch_font_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_sketch_auto_pointer <> @new_sketch_auto_pointer
          or
          ( @old_sketch_auto_pointer is null and @new_sketch_auto_pointer is not null ) 
          or
          ( @old_sketch_auto_pointer is not null and @new_sketch_auto_pointer is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'sketch_auto_pointer' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9224, convert(varchar(255), @old_sketch_auto_pointer), convert(varchar(255), @new_sketch_auto_pointer), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_set_actual_taxes <> @new_set_actual_taxes
          or
          ( @old_set_actual_taxes is null and @new_set_actual_taxes is not null ) 
          or
          ( @old_set_actual_taxes is not null and @new_set_actual_taxes is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'set_actual_taxes' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9219, convert(varchar(255), @old_set_actual_taxes), convert(varchar(255), @new_set_actual_taxes), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pp_rendition_penalty_cad_fee_pct <> @new_pp_rendition_penalty_cad_fee_pct
          or
          ( @old_pp_rendition_penalty_cad_fee_pct is null and @new_pp_rendition_penalty_cad_fee_pct is not null ) 
          or
          ( @old_pp_rendition_penalty_cad_fee_pct is not null and @new_pp_rendition_penalty_cad_fee_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pp_rendition_penalty_cad_fee_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9201, convert(varchar(255), @old_pp_rendition_penalty_cad_fee_pct), convert(varchar(255), @new_pp_rendition_penalty_cad_fee_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pp_rendition_penalty_letter <> @new_pp_rendition_penalty_letter
          or
          ( @old_pp_rendition_penalty_letter is null and @new_pp_rendition_penalty_letter is not null ) 
          or
          ( @old_pp_rendition_penalty_letter is not null and @new_pp_rendition_penalty_letter is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pp_rendition_penalty_letter' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9202, convert(varchar(255), @old_pp_rendition_penalty_letter), convert(varchar(255), @new_pp_rendition_penalty_letter), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_use_app_role <> @new_use_app_role
          or
          ( @old_use_app_role is null and @new_use_app_role is not null ) 
          or
          ( @old_use_app_role is not null and @new_use_app_role is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'use_app_role' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9235, convert(varchar(255), @old_use_app_role), convert(varchar(255), @new_use_app_role), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_show_pc_good_field <> @new_show_pc_good_field
          or
          ( @old_show_pc_good_field is null and @new_show_pc_good_field is not null ) 
          or
          ( @old_show_pc_good_field is not null and @new_show_pc_good_field is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'show_pc_good_field' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9222, convert(varchar(255), @old_show_pc_good_field), convert(varchar(255), @new_show_pc_good_field), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_cert_roll_rpt_print_refId2 <> @new_cert_roll_rpt_print_refId2
          or
          ( @old_cert_roll_rpt_print_refId2 is null and @new_cert_roll_rpt_print_refId2 is not null ) 
          or
          ( @old_cert_roll_rpt_print_refId2 is not null and @new_cert_roll_rpt_print_refId2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'cert_roll_rpt_print_refId2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9054, convert(varchar(255), @old_cert_roll_rpt_print_refId2), convert(varchar(255), @new_cert_roll_rpt_print_refId2), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_bpp_default_segment <> @new_bpp_default_segment
          or
          ( @old_bpp_default_segment is null and @new_bpp_default_segment is not null ) 
          or
          ( @old_bpp_default_segment is not null and @new_bpp_default_segment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'bpp_default_segment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9039, convert(varchar(255), @old_bpp_default_segment), convert(varchar(255), @new_bpp_default_segment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_display_location_id <> @new_display_location_id
          or
          ( @old_display_location_id is null and @new_display_location_id is not null ) 
          or
          ( @old_display_location_id is not null and @new_display_location_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'display_location_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9069, convert(varchar(255), @old_display_location_id), convert(varchar(255), @new_display_location_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_hswiz_set_homesite <> @new_hswiz_set_homesite
          or
          ( @old_hswiz_set_homesite is null and @new_hswiz_set_homesite is not null ) 
          or
          ( @old_hswiz_set_homesite is not null and @new_hswiz_set_homesite is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'hswiz_set_homesite' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9151, convert(varchar(255), @old_hswiz_set_homesite), convert(varchar(255), @new_hswiz_set_homesite), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_hswiz_sup_cd <> @new_hswiz_sup_cd
          or
          ( @old_hswiz_sup_cd is null and @new_hswiz_sup_cd is not null ) 
          or
          ( @old_hswiz_sup_cd is not null and @new_hswiz_sup_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'hswiz_sup_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9152, convert(varchar(255), @old_hswiz_sup_cd), convert(varchar(255), @new_hswiz_sup_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_hswiz_sup_desc <> @new_hswiz_sup_desc
          or
          ( @old_hswiz_sup_desc is null and @new_hswiz_sup_desc is not null ) 
          or
          ( @old_hswiz_sup_desc is not null and @new_hswiz_sup_desc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'hswiz_sup_desc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9153, convert(varchar(255), @old_hswiz_sup_desc), convert(varchar(255), @new_hswiz_sup_desc), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_use_penpad_sketch <> @new_use_penpad_sketch
          or
          ( @old_use_penpad_sketch is null and @new_use_penpad_sketch is not null ) 
          or
          ( @old_use_penpad_sketch is not null and @new_use_penpad_sketch is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'use_penpad_sketch' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9236, convert(varchar(255), @old_use_penpad_sketch), convert(varchar(255), @new_use_penpad_sketch), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pp_rendition_wizard_delete_prev_yr <> @new_pp_rendition_wizard_delete_prev_yr
          or
          ( @old_pp_rendition_wizard_delete_prev_yr is null and @new_pp_rendition_wizard_delete_prev_yr is not null ) 
          or
          ( @old_pp_rendition_wizard_delete_prev_yr is not null and @new_pp_rendition_wizard_delete_prev_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pp_rendition_wizard_delete_prev_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9203, convert(varchar(255), @old_pp_rendition_wizard_delete_prev_yr), convert(varchar(255), @new_pp_rendition_wizard_delete_prev_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pp_rend_format <> @new_pp_rend_format
          or
          ( @old_pp_rend_format is null and @new_pp_rend_format is not null ) 
          or
          ( @old_pp_rend_format is not null and @new_pp_rend_format is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pp_rend_format' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9261, convert(varchar(255), @old_pp_rend_format), convert(varchar(255), @new_pp_rend_format), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_store_adj_detail_area <> @new_store_adj_detail_area
          or
          ( @old_store_adj_detail_area is null and @new_store_adj_detail_area is not null ) 
          or
          ( @old_store_adj_detail_area is not null and @new_store_adj_detail_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'store_adj_detail_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9229, convert(varchar(255), @old_store_adj_detail_area), convert(varchar(255), @new_store_adj_detail_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_hswiz_update_app_name_enabled <> @new_hswiz_update_app_name_enabled
          or
          ( @old_hswiz_update_app_name_enabled is null and @new_hswiz_update_app_name_enabled is not null ) 
          or
          ( @old_hswiz_update_app_name_enabled is not null and @new_hswiz_update_app_name_enabled is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'hswiz_update_app_name_enabled' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9154, convert(varchar(255), @old_hswiz_update_app_name_enabled), convert(varchar(255), @new_hswiz_update_app_name_enabled), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_hswiz_update_app_name_setting <> @new_hswiz_update_app_name_setting
          or
          ( @old_hswiz_update_app_name_setting is null and @new_hswiz_update_app_name_setting is not null ) 
          or
          ( @old_hswiz_update_app_name_setting is not null and @new_hswiz_update_app_name_setting is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'hswiz_update_app_name_setting' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9155, convert(varchar(255), @old_hswiz_update_app_name_setting), convert(varchar(255), @new_hswiz_update_app_name_setting), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_bpp_assetmgr_sort <> @new_bpp_assetmgr_sort
          or
          ( @old_bpp_assetmgr_sort is null and @new_bpp_assetmgr_sort is not null ) 
          or
          ( @old_bpp_assetmgr_sort is not null and @new_bpp_assetmgr_sort is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'bpp_assetmgr_sort' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9038, convert(varchar(255), @old_bpp_assetmgr_sort), convert(varchar(255), @new_bpp_assetmgr_sort), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_warn_arb_prot_save <> @new_warn_arb_prot_save
          or
          ( @old_warn_arb_prot_save is null and @new_warn_arb_prot_save is not null ) 
          or
          ( @old_warn_arb_prot_save is not null and @new_warn_arb_prot_save is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'warn_arb_prot_save' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9240, convert(varchar(255), @old_warn_arb_prot_save), convert(varchar(255), @new_warn_arb_prot_save), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_display_agent_warning <> @new_display_agent_warning
          or
          ( @old_display_agent_warning is null and @new_display_agent_warning is not null ) 
          or
          ( @old_display_agent_warning is not null and @new_display_agent_warning is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'display_agent_warning' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9068, convert(varchar(255), @old_display_agent_warning), convert(varchar(255), @new_display_agent_warning), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_print_inactive_building_permits <> @new_print_inactive_building_permits
          or
          ( @old_print_inactive_building_permits is null and @new_print_inactive_building_permits is not null ) 
          or
          ( @old_print_inactive_building_permits is not null and @new_print_inactive_building_permits is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'print_inactive_building_permits' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9215, convert(varchar(255), @old_print_inactive_building_permits), convert(varchar(255), @new_print_inactive_building_permits), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_use_timber_78_values <> @new_use_timber_78_values
          or
          ( @old_use_timber_78_values is null and @new_use_timber_78_values is not null ) 
          or
          ( @old_use_timber_78_values is not null and @new_use_timber_78_values is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'use_timber_78_values' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9238, convert(varchar(255), @old_use_timber_78_values), convert(varchar(255), @new_use_timber_78_values), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_arb_warn_more_open_protests_on_open <> @new_arb_warn_more_open_protests_on_open
          or
          ( @old_arb_warn_more_open_protests_on_open is null and @new_arb_warn_more_open_protests_on_open is not null ) 
          or
          ( @old_arb_warn_more_open_protests_on_open is not null and @new_arb_warn_more_open_protests_on_open is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'arb_warn_more_open_protests_on_open' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9020, convert(varchar(255), @old_arb_warn_more_open_protests_on_open), convert(varchar(255), @new_arb_warn_more_open_protests_on_open), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_default_appr_notice_form <> @new_default_appr_notice_form
          or
          ( @old_default_appr_notice_form is null and @new_default_appr_notice_form is not null ) 
          or
          ( @old_default_appr_notice_form is not null and @new_default_appr_notice_form is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'default_appr_notice_form' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9063, convert(varchar(255), @old_default_appr_notice_form), convert(varchar(255), @new_default_appr_notice_form), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_heat_only_code_attribute_id <> @new_heat_only_code_attribute_id
          or
          ( @old_heat_only_code_attribute_id is null and @new_heat_only_code_attribute_id is not null ) 
          or
          ( @old_heat_only_code_attribute_id is not null and @new_heat_only_code_attribute_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'heat_only_code_attribute_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9255, convert(varchar(255), @old_heat_only_code_attribute_id), convert(varchar(255), @new_heat_only_code_attribute_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_cool_only_code_attribute_id <> @new_cool_only_code_attribute_id
          or
          ( @old_cool_only_code_attribute_id is null and @new_cool_only_code_attribute_id is not null ) 
          or
          ( @old_cool_only_code_attribute_id is not null and @new_cool_only_code_attribute_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'cool_only_code_attribute_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9265, convert(varchar(255), @old_cool_only_code_attribute_id), convert(varchar(255), @new_cool_only_code_attribute_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_ptd_sale_submission_export_map_number_as <> @new_ptd_sale_submission_export_map_number_as
          or
          ( @old_ptd_sale_submission_export_map_number_as is null and @new_ptd_sale_submission_export_map_number_as is not null ) 
          or
          ( @old_ptd_sale_submission_export_map_number_as is not null and @new_ptd_sale_submission_export_map_number_as is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'ptd_sale_submission_export_map_number_as' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9263, convert(varchar(255), @old_ptd_sale_submission_export_map_number_as), convert(varchar(255), @new_ptd_sale_submission_export_map_number_as), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_num_bathrooms_code_attribute_id <> @new_num_bathrooms_code_attribute_id
          or
          ( @old_num_bathrooms_code_attribute_id is null and @new_num_bathrooms_code_attribute_id is not null ) 
          or
          ( @old_num_bathrooms_code_attribute_id is not null and @new_num_bathrooms_code_attribute_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'num_bathrooms_code_attribute_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9258, convert(varchar(255), @old_num_bathrooms_code_attribute_id), convert(varchar(255), @new_num_bathrooms_code_attribute_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_num_bedrooms_code_attribute_id <> @new_num_bedrooms_code_attribute_id
          or
          ( @old_num_bedrooms_code_attribute_id is null and @new_num_bedrooms_code_attribute_id is not null ) 
          or
          ( @old_num_bedrooms_code_attribute_id is not null and @new_num_bedrooms_code_attribute_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'num_bedrooms_code_attribute_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9259, convert(varchar(255), @old_num_bedrooms_code_attribute_id), convert(varchar(255), @new_num_bedrooms_code_attribute_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_mineral_import_format_file_path <> @new_mineral_import_format_file_path
          or
          ( @old_mineral_import_format_file_path is null and @new_mineral_import_format_file_path is not null ) 
          or
          ( @old_mineral_import_format_file_path is not null and @new_mineral_import_format_file_path is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'mineral_import_format_file_path' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9257, convert(varchar(255), @old_mineral_import_format_file_path), convert(varchar(255), @new_mineral_import_format_file_path), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_default_tax_statement_form <> @new_default_tax_statement_form
          or
          ( @old_default_tax_statement_form is null and @new_default_tax_statement_form is not null ) 
          or
          ( @old_default_tax_statement_form is not null and @new_default_tax_statement_form is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'default_tax_statement_form' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9253, convert(varchar(255), @old_default_tax_statement_form), convert(varchar(255), @new_default_tax_statement_form), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_default_inquiry_create_year <> @new_default_inquiry_create_year
          or
          ( @old_default_inquiry_create_year is null and @new_default_inquiry_create_year is not null ) 
          or
          ( @old_default_inquiry_create_year is not null and @new_default_inquiry_create_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'default_inquiry_create_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9267, convert(varchar(255), @old_default_inquiry_create_year), convert(varchar(255), @new_default_inquiry_create_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_default_inquiry_search_year <> @new_default_inquiry_search_year
          or
          ( @old_default_inquiry_search_year is null and @new_default_inquiry_search_year is not null ) 
          or
          ( @old_default_inquiry_search_year is not null and @new_default_inquiry_search_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'default_inquiry_search_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9268, convert(varchar(255), @old_default_inquiry_search_year), convert(varchar(255), @new_default_inquiry_search_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_default_protest_create_year <> @new_default_protest_create_year
          or
          ( @old_default_protest_create_year is null and @new_default_protest_create_year is not null ) 
          or
          ( @old_default_protest_create_year is not null and @new_default_protest_create_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'default_protest_create_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9269, convert(varchar(255), @old_default_protest_create_year), convert(varchar(255), @new_default_protest_create_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_default_protest_search_year <> @new_default_protest_search_year
          or
          ( @old_default_protest_search_year is null and @new_default_protest_search_year is not null ) 
          or
          ( @old_default_protest_search_year is not null and @new_default_protest_search_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'default_protest_search_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9252, convert(varchar(255), @old_default_protest_search_year), convert(varchar(255), @new_default_protest_search_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_default_arb_system_override <> @new_default_arb_system_override
          or
          ( @old_default_arb_system_override is null and @new_default_arb_system_override is not null ) 
          or
          ( @old_default_arb_system_override is not null and @new_default_arb_system_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'default_arb_system_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9266, convert(varchar(255), @old_default_arb_system_override), convert(varchar(255), @new_default_arb_system_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_override_ownership_wiz_reset_exemption <> @new_override_ownership_wiz_reset_exemption
          or
          ( @old_override_ownership_wiz_reset_exemption is null and @new_override_ownership_wiz_reset_exemption is not null ) 
          or
          ( @old_override_ownership_wiz_reset_exemption is not null and @new_override_ownership_wiz_reset_exemption is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'override_ownership_wiz_reset_exemption' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9260, convert(varchar(255), @old_override_ownership_wiz_reset_exemption), convert(varchar(255), @new_override_ownership_wiz_reset_exemption), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_auto_add_ov65 <> @new_auto_add_ov65
          or
          ( @old_auto_add_ov65 is null and @new_auto_add_ov65 is not null ) 
          or
          ( @old_auto_add_ov65 is not null and @new_auto_add_ov65 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'auto_add_ov65' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9270, convert(varchar(255), @old_auto_add_ov65), convert(varchar(255), @new_auto_add_ov65), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_auto_add_ov65_ignore_reset_exemptions <> @new_auto_add_ov65_ignore_reset_exemptions
          or
          ( @old_auto_add_ov65_ignore_reset_exemptions is null and @new_auto_add_ov65_ignore_reset_exemptions is not null ) 
          or
          ( @old_auto_add_ov65_ignore_reset_exemptions is not null and @new_auto_add_ov65_ignore_reset_exemptions is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'auto_add_ov65_ignore_reset_exemptions' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9271, convert(varchar(255), @old_auto_add_ov65_ignore_reset_exemptions), convert(varchar(255), @new_auto_add_ov65_ignore_reset_exemptions), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_default_arb_system_inquiry_override <> @new_default_arb_system_inquiry_override
          or
          ( @old_default_arb_system_inquiry_override is null and @new_default_arb_system_inquiry_override is not null ) 
          or
          ( @old_default_arb_system_inquiry_override is not null and @new_default_arb_system_inquiry_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'default_arb_system_inquiry_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9272, convert(varchar(255), @old_default_arb_system_inquiry_override), convert(varchar(255), @new_default_arb_system_inquiry_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_default_arb_system_protest_override <> @new_default_arb_system_protest_override
          or
          ( @old_default_arb_system_protest_override is null and @new_default_arb_system_protest_override is not null ) 
          or
          ( @old_default_arb_system_protest_override is not null and @new_default_arb_system_protest_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'default_arb_system_protest_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9273, convert(varchar(255), @old_default_arb_system_protest_override), convert(varchar(255), @new_default_arb_system_protest_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_nbhd_cost_calibration_default_target_ratio <> @new_nbhd_cost_calibration_default_target_ratio
          or
          ( @old_nbhd_cost_calibration_default_target_ratio is null and @new_nbhd_cost_calibration_default_target_ratio is not null ) 
          or
          ( @old_nbhd_cost_calibration_default_target_ratio is not null and @new_nbhd_cost_calibration_default_target_ratio is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'nbhd_cost_calibration_default_target_ratio' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9348, convert(varchar(255), @old_nbhd_cost_calibration_default_target_ratio), convert(varchar(255), @new_nbhd_cost_calibration_default_target_ratio), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_pp_rendition_print_column_format <> @new_pp_rendition_print_column_format
          or
          ( @old_pp_rendition_print_column_format is null and @new_pp_rendition_print_column_format is not null ) 
          or
          ( @old_pp_rendition_print_column_format is not null and @new_pp_rendition_print_column_format is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'pp_rendition_print_column_format' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9262, convert(varchar(255), @old_pp_rendition_print_column_format), convert(varchar(255), @new_pp_rendition_print_column_format), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_owner_transfer_do_reset_exemptions_logic <> @new_owner_transfer_do_reset_exemptions_logic
          or
          ( @old_owner_transfer_do_reset_exemptions_logic is null and @new_owner_transfer_do_reset_exemptions_logic is not null ) 
          or
          ( @old_owner_transfer_do_reset_exemptions_logic is not null and @new_owner_transfer_do_reset_exemptions_logic is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'owner_transfer_do_reset_exemptions_logic' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9349, convert(varchar(255), @old_owner_transfer_do_reset_exemptions_logic), convert(varchar(255), @new_owner_transfer_do_reset_exemptions_logic), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_owner_transfer_set_inactivate_agent <> @new_owner_transfer_set_inactivate_agent
          or
          ( @old_owner_transfer_set_inactivate_agent is null and @new_owner_transfer_set_inactivate_agent is not null ) 
          or
          ( @old_owner_transfer_set_inactivate_agent is not null and @new_owner_transfer_set_inactivate_agent is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'owner_transfer_set_inactivate_agent' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9350, convert(varchar(255), @old_owner_transfer_set_inactivate_agent), convert(varchar(255), @new_owner_transfer_set_inactivate_agent), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     if (
          @old_supplement_reason_required <> @new_supplement_reason_required
          or
          ( @old_supplement_reason_required is null and @new_supplement_reason_required is not null ) 
          or
          ( @old_supplement_reason_required is not null and @new_supplement_reason_required is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_system' and
                    chg_log_columns = 'supplement_reason_required' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 557, 9655, convert(varchar(255), @old_supplement_reason_required), convert(varchar(255), @new_supplement_reason_required), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2140, convert(varchar(24), @new_id), @new_id)
          end
     end
 
     fetch next from curRows into @old_id, @old_tax_yr, @old_appr_yr, @old_system_type, @old_rounding_factor, @old_rounding_income_factor, @old_receipt_copies, @old_first_yr_to_supp, @old_validator_line_one, @old_validator_line_two, @old_validator_line_three, @old_validator_line_four, @old_validator_line_seven, @old_validator_line_eight, @old_validator_line_nine, @old_geo_id_display_option, @old_phone_num, @old_fax_num, @old_version, @old_oil_well_adj_acres, @old_apply_land_mass_factor, @old_apply_imprv_mass_factor, @old_distribution_path, @old_pacsappr_version, @old_pacscol_version, @old_confidential_file_as_name, @old_confidential_first_name, @old_confidential_last_name, @old_begin_close_dt, @old_starting_check_num, @old_gis_viewer, @old_gis_viewer_display_labels, @old_appr_card_type, @old_letter_path, @old_label_printer_name, @old_face_map_path, @old_face_map_field, @old_cold_location, @old_sl_type, @old_sl_ratio_type, @old_sl_finance_type, @old_sl_conf_source, @old_lease_flag, @old_factor_flag, @old_client_name, @old_inq_print_letter_id, @old_heat_ac_code_attribute_id, @old_penpad_password, @old_export_path, @old_future_yr, @old_shared_cad_valuation, @old_street_default, @old_pp_waive_penalty_percent, @old_pp_waive_amount_threshold, @old_so_type, @old_so_method, @old_so_class, @old_sales_ratio_report_ui_mode, @old_pro_notice_hearing_letter_single, @old_pro_notice_hearing_letter_multi, @old_pro_arb_certified_mailer_agent, @old_pro_arb_certified_mailer_owner, @old_pro_warn_more_protests_opened, @old_arb_mass_prop_entry_def_search, @old_sketch_default_font, @old_sketch_separator_type, @old_sketch_center_label, @old_sketch_show_area, @old_duplicate_col_warn, @old_print_appr_card_barcode, @old_print_appr_card_sketch, @old_sketch_font_name, @old_sketch_auto_pointer, @old_set_actual_taxes, @old_pp_rendition_penalty_cad_fee_pct, @old_pp_rendition_penalty_letter, @old_use_app_role, @old_show_pc_good_field, @old_cert_roll_rpt_print_refId2, @old_bpp_default_segment, @old_display_location_id, @old_hswiz_set_homesite, @old_hswiz_sup_cd, @old_hswiz_sup_desc, @old_use_penpad_sketch, @old_pp_rendition_wizard_delete_prev_yr, @old_pp_rend_format, @old_store_adj_detail_area, @old_hswiz_update_app_name_enabled, @old_hswiz_update_app_name_setting, @old_bpp_assetmgr_sort, @old_warn_arb_prot_save, @old_display_agent_warning, @old_print_inactive_building_permits, @old_use_timber_78_values, @old_arb_warn_more_open_protests_on_open, @old_default_appr_notice_form, @old_heat_only_code_attribute_id, @old_cool_only_code_attribute_id, @old_ptd_sale_submission_export_map_number_as, @old_num_bathrooms_code_attribute_id, @old_num_bedrooms_code_attribute_id, @old_mineral_import_format_file_path, @old_default_tax_statement_form, @old_default_inquiry_create_year, @old_default_inquiry_search_year, @old_default_protest_create_year, @old_default_protest_search_year, @old_default_arb_system_override, @old_override_ownership_wiz_reset_exemption, @old_auto_add_ov65, @old_auto_add_ov65_ignore_reset_exemptions, @old_default_arb_system_inquiry_override, @old_default_arb_system_protest_override, @old_nbhd_cost_calibration_default_target_ratio, @old_pp_rendition_print_column_format, @old_owner_transfer_do_reset_exemptions_logic, @old_owner_transfer_set_inactivate_agent, @old_supplement_reason_required, 
                                  @new_id, @new_tax_yr, @new_appr_yr, @new_system_type, @new_rounding_factor, @new_rounding_income_factor, @new_receipt_copies, @new_first_yr_to_supp, @new_validator_line_one, @new_validator_line_two, @new_validator_line_three, @new_validator_line_four, @new_validator_line_seven, @new_validator_line_eight, @new_validator_line_nine, @new_geo_id_display_option, @new_phone_num, @new_fax_num, @new_version, @new_oil_well_adj_acres, @new_apply_land_mass_factor, @new_apply_imprv_mass_factor, @new_distribution_path, @new_pacsappr_version, @new_pacscol_version, @new_confidential_file_as_name, @new_confidential_first_name, @new_confidential_last_name, @new_begin_close_dt, @new_starting_check_num, @new_gis_viewer, @new_gis_viewer_display_labels, @new_appr_card_type, @new_letter_path, @new_label_printer_name, @new_face_map_path, @new_face_map_field, @new_cold_location, @new_sl_type, @new_sl_ratio_type, @new_sl_finance_type, @new_sl_conf_source, @new_lease_flag, @new_factor_flag, @new_client_name, @new_inq_print_letter_id, @new_heat_ac_code_attribute_id, @new_penpad_password, @new_export_path, @new_future_yr, @new_shared_cad_valuation, @new_street_default, @new_pp_waive_penalty_percent, @new_pp_waive_amount_threshold, @new_so_type, @new_so_method, @new_so_class, @new_sales_ratio_report_ui_mode, @new_pro_notice_hearing_letter_single, @new_pro_notice_hearing_letter_multi, @new_pro_arb_certified_mailer_agent, @new_pro_arb_certified_mailer_owner, @new_pro_warn_more_protests_opened, @new_arb_mass_prop_entry_def_search, @new_sketch_default_font, @new_sketch_separator_type, @new_sketch_center_label, @new_sketch_show_area, @new_duplicate_col_warn, @new_print_appr_card_barcode, @new_print_appr_card_sketch, @new_sketch_font_name, @new_sketch_auto_pointer, @new_set_actual_taxes, @new_pp_rendition_penalty_cad_fee_pct, @new_pp_rendition_penalty_letter, @new_use_app_role, @new_show_pc_good_field, @new_cert_roll_rpt_print_refId2, @new_bpp_default_segment, @new_display_location_id, @new_hswiz_set_homesite, @new_hswiz_sup_cd, @new_hswiz_sup_desc, @new_use_penpad_sketch, @new_pp_rendition_wizard_delete_prev_yr, @new_pp_rend_format, @new_store_adj_detail_area, @new_hswiz_update_app_name_enabled, @new_hswiz_update_app_name_setting, @new_bpp_assetmgr_sort, @new_warn_arb_prot_save, @new_display_agent_warning, @new_print_inactive_building_permits, @new_use_timber_78_values, @new_arb_warn_more_open_protests_on_open, @new_default_appr_notice_form, @new_heat_only_code_attribute_id, @new_cool_only_code_attribute_id, @new_ptd_sale_submission_export_map_number_as, @new_num_bathrooms_code_attribute_id, @new_num_bedrooms_code_attribute_id, @new_mineral_import_format_file_path, @new_default_tax_statement_form, @new_default_inquiry_create_year, @new_default_inquiry_search_year, @new_default_protest_create_year, @new_default_protest_search_year, @new_default_arb_system_override, @new_override_ownership_wiz_reset_exemption, @new_auto_add_ov65, @new_auto_add_ov65_ignore_reset_exemptions, @new_default_arb_system_inquiry_override, @new_default_arb_system_protest_override, @new_nbhd_cost_calibration_default_target_ratio, @new_pp_rendition_print_column_format, @new_owner_transfer_do_reset_exemptions_logic, @new_owner_transfer_set_inactivate_agent, @new_supplement_reason_required
end
 
close curRows
deallocate curRows

GO



create trigger tr_pacs_system_delete_insert_update_MemTable
on pacs_system
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'pacs_system'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Postpone due date when amount due decreases', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_system', @level2type = N'COLUMN', @level2name = N'postpone_duedate';


GO

