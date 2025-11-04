CREATE TABLE [dbo].[change_of_value_report] (
    [dataset_id]                         INT             NOT NULL,
    [prop_id]                            INT             NOT NULL,
    [report_heading]                     VARCHAR (36)    NULL,
    [mail_date]                          DATETIME        NULL,
    [curr_sup_num]                       INT             NOT NULL,
    [legal_desc]                         VARCHAR (150)   NULL,
    [assessment_yr]                      NUMERIC (4)     NOT NULL,
    [tax_yr]                             NUMERIC (4)     NULL,
    [situs]                              VARCHAR (173)   NULL,
    [file_as_name]                       VARCHAR (300)   NULL,
    [owner_address]                      VARCHAR (300)   NULL,
    [sup_comment]                        VARCHAR (500)   NULL,
    [prev_tax_area]                      VARCHAR (23)    NULL,
    [curr_tax_area]                      VARCHAR (23)    NULL,
    [prev_legal_acreage]                 NUMERIC (14, 2) NULL,
    [curr_legal_acreage]                 NUMERIC (14, 2) NULL,
    [prev_value_land]                    NUMERIC (14)    NULL,
    [curr_value_land]                    NUMERIC (14)    NULL,
    [prev_value_structure]               NUMERIC (14)    NULL,
    [curr_value_structure]               NUMERIC (14)    NULL,
    [prev_value_total_market]            NUMERIC (14)    NULL,
    [curr_value_total_market]            NUMERIC (14)    NULL,
    [prev_in_program_land_value]         NUMERIC (14)    NULL,
    [prev_non_program_land_value]        NUMERIC (14)    NULL,
    [curr_in_program_land_value]         NUMERIC (14)    NULL,
    [curr_non_program_land_value]        NUMERIC (14)    NULL,
    [prev_sr_freeze_value]               NUMERIC (14)    NULL,
    [prev_sr_non_exempt_value]           NUMERIC (14)    NULL,
    [curr_sr_freeze_value]               NUMERIC (14)    NULL,
    [curr_sr_non_exempt_value]           NUMERIC (14)    NULL,
    [prev_sr_exmpt_qualify_cd]           VARCHAR (10)    NULL,
    [prev_sr_reduction_frozen_value]     NUMERIC (14)    NULL,
    [curr_sr_exmpt_qualify_cd]           VARCHAR (10)    NULL,
    [curr_sr_reduction_frozen_value]     NUMERIC (14)    NULL,
    [prev_frozen_taxable]                NUMERIC (14)    NULL,
    [curr_frozen_taxable]                NUMERIC (14)    NULL,
    [prev_total_real_property_tax_value] NUMERIC (14)    NULL,
    [curr_total_real_property_tax_value] NUMERIC (14)    NULL,
    [prev_personal_property_value]       NUMERIC (14)    NULL,
    [curr_personal_property_value]       NUMERIC (14)    NULL,
    [prev_personal_property_late_fee]    NUMERIC (14)    NULL,
    [curr_personal_property_late_fee]    NUMERIC (14)    NULL,
    [cancel_supplement_val]              NUMERIC (14)    NULL,
    [deleted]                            BIT             NULL,
    [current_use]                        BIT             NULL,
    [senior]                             BIT             NULL,
    [zip]                                VARCHAR (5)     NULL,
    [sup_cd]                             CHAR (10)       NULL,
    [geo_id]                             VARCHAR (50)    NULL,
    [prorate_on_date]                    DATETIME        NULL,
    [prorate_off_date]                   DATETIME        NULL,
    [footer_text]                        VARCHAR (511)   NULL,
    [is_leased_land_property]            BIT             NULL,
    [prev_non_taxed_mkt_val]             NUMERIC (14)    NULL,
    [non_taxed_mkt_val]                  NUMERIC (14)    NULL,
    [prepared_by]                        VARCHAR (50)    NULL,
    [show_change_reason]                 BIT             CONSTRAINT [CDF_change_of_value_report_show_change_reason] DEFAULT ((1)) NOT NULL,
    [show_prepared_by]                   BIT             CONSTRAINT [CDF_change_of_value_report_show_prepared_by] DEFAULT ((1)) NOT NULL,
    CONSTRAINT [CPK_change_of_value_report] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [prop_id] ASC, [assessment_yr] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Show Prepared By Field', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'change_of_value_report', @level2type = N'COLUMN', @level2name = N'show_prepared_by';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Report data for Change of Value reports', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'change_of_value_report';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Show Change Reason Field', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'change_of_value_report', @level2type = N'COLUMN', @level2name = N'show_change_reason';


GO

