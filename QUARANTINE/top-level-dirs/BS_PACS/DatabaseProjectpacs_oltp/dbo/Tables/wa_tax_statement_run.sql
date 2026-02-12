CREATE TABLE [dbo].[wa_tax_statement_run] (
    [group_id]                                                     INT           NOT NULL,
    [year]                                                         NUMERIC (4)   NOT NULL,
    [run_id]                                                       INT           NOT NULL,
    [include_real_property]                                        BIT           NOT NULL,
    [include_personal_property]                                    BIT           NOT NULL,
    [include_mobile_home_property]                                 BIT           NOT NULL,
    [first_half_payment]                                           BIT           NOT NULL,
    [effective_date]                                               DATETIME      NOT NULL,
    [statement_date]                                               DATETIME      NOT NULL,
    [statement_count]                                              INT           NOT NULL,
    [include_supplement_reason]                                    BIT           NOT NULL,
    [print_by]                                                     INT           NOT NULL,
    [created_by]                                                   INT           NOT NULL,
    [created_date]                                                 DATETIME      CONSTRAINT [CDF_wa_tax_statement_run_created_date] DEFAULT (getdate()) NOT NULL,
    [type]                                                         CHAR (1)      NULL,
    [begin_date]                                                   DATETIME      NULL,
    [end_date]                                                     DATETIME      NULL,
    [last_print_date]                                              DATETIME      NULL,
    [sup_group_id]                                                 INT           NULL,
    [print_on_back_option]                                         INT           DEFAULT ((2)) NULL,
    [statement_option]                                             INT           DEFAULT ((0)) NULL,
    [message]                                                      VARCHAR (525) NULL,
    [prop_or_geo_id]                                               BIT           DEFAULT ((0)) NULL,
    [letter_template_id]                                           INT           CONSTRAINT [CDF_wa_tax_statement_run_letter_template_id] DEFAULT ((0)) NULL,
    [use_delinquent_date]                                          BIT           CONSTRAINT [CDF_wa_tax_statement_run_use_delinquent_date] DEFAULT ((0)) NULL,
    [effective_due_dt]                                             DATETIME      NULL,
    [property_type_selected]                                       BIT           CONSTRAINT [CDF_wa_tax_statement_run_property_type_selected] DEFAULT ((0)) NULL,
    [exempt_included]                                              BIT           CONSTRAINT [CDF_wa_tax_statement_run_exempt_included] DEFAULT ((0)) NULL,
    [exempt_types]                                                 VARCHAR (500) NULL,
    [property_selection]                                           INT           CONSTRAINT [CDF_wa_tax_statement_run_property_selection] DEFAULT ((0)) NULL,
    [tax_areas]                                                    VARCHAR (500) NULL,
    [agency_codes]                                                 VARCHAR (500) NULL,
    [exclude_bill_codes]                                           VARCHAR (500) NULL,
    [include_bill_codes]                                           VARCHAR (500) NULL,
    [tax_district_codes]                                           VARCHAR (500) NULL,
    [generate_event]                                               BIT           NULL,
    [prop_options]                                                 VARCHAR (MAX) NULL,
    [corrected_run_include_zero_tax_due]                           BIT           NULL,
    [corrected_run_include_ownership_changes]                      BIT           CONSTRAINT [CDF_wa_tax_statement_run_corrected_run_include_ownership_changes] DEFAULT ((1)) NOT NULL,
    [corrected_run_include_address_changes]                        BIT           CONSTRAINT [CDF_wa_tax_statement_run_corrected_run_include_address_changes] DEFAULT ((1)) NOT NULL,
    [corrected_run_generate_event]                                 BIT           CONSTRAINT [CDF_wa_tax_statement_run_corrected_run_generate_event] DEFAULT ((1)) NOT NULL,
    [include_ioll_property]                                        BIT           CONSTRAINT [CDF_wa_tax_statement_run_include_ioll_property] DEFAULT ((0)) NOT NULL,
    [ocr_include_delq_when_needed]                                 BIT           CONSTRAINT [CDF_wa_tax_statement_run_ocr_include_delq_when_needed] DEFAULT ((1)) NOT NULL,
    [ocr_always_include_delq]                                      BIT           CONSTRAINT [CDF_wa_tax_statement_run_ocr_always_include_delq] DEFAULT ((0)) NOT NULL,
    [barcode_statement_or_property]                                BIT           CONSTRAINT [CDF_wa_tax_statement_run_barcode_statement_or_property] DEFAULT ((0)) NOT NULL,
    [corrected_run_include_ownership_changes_in_current_year_only] BIT           CONSTRAINT [CDF_wa_tax_statement_run_corrected_run_include_ownership_changes_in_current_year_only] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_wa_tax_statement_run] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [run_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_wa_tax_statement_run_created_by] FOREIGN KEY ([created_by]) REFERENCES [dbo].[pacs_user] ([pacs_user_id]),
    CONSTRAINT [CFK_wa_tax_statement_run_group_id_year] FOREIGN KEY ([group_id], [year]) REFERENCES [dbo].[wa_tax_statement_group] ([group_id], [year])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The agency codes used in the query.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'agency_codes';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Barcode information: 0 = Statement/Year, 1 = Property ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'barcode_statement_or_property';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag to indicate that we are using te delinquent date in the query.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'use_delinquent_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates whether the list of properties for corrected tax statements should include properties with zero taxes due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'corrected_run_include_zero_tax_due';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The effective due date for the payment.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'effective_due_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include Ownership Changes for Corrected Runs', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'corrected_run_include_ownership_changes';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates that the property type is included in the query.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'property_type_selected';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include Address Changes for Corrected Runs', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'corrected_run_include_address_changes';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The bill codes to exclude used in the query.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'exclude_bill_codes';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The statement print on back option', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'print_on_back_option';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates that exemptions are included in the query.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'exempt_included';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Generate Event for Corrected Runs', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'corrected_run_generate_event';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The bill codes to include used in the query.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'include_bill_codes';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The statement option type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'statement_option';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include Improvements on Leased Land Property Indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'include_ioll_property';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The statement message', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'message';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The tax district codes to include used in the query.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'tax_district_codes';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'print prop or geo id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'prop_or_geo_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The generate event parameter used to generate the report.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'generate_event';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The exemption types that are included with the query.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'exempt_types';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The property options used to generate the report.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'prop_options';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The property selection for the query.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'property_selection';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'True if the OCR Scanline should include fields for delinquent values on statements which have delinquent values', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'ocr_include_delq_when_needed';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The tax areas used in the query.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'tax_areas';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'True if the OCR Scanline should always include fields for delinquent values', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'ocr_always_include_delq';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'letter template id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_run', @level2type = N'COLUMN', @level2name = N'letter_template_id';


GO

