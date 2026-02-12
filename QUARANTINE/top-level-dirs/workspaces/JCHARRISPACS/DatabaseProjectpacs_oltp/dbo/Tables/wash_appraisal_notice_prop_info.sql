CREATE TABLE [dbo].[wash_appraisal_notice_prop_info] (
    [notice_year]                    NUMERIC (4)     NOT NULL,
    [notice_run_id]                  INT             NOT NULL,
    [prop_id]                        INT             NOT NULL,
    [owner_id]                       INT             NOT NULL,
    [sup_yr]                         NUMERIC (4)     NOT NULL,
    [sup_num]                        INT             NOT NULL,
    [notice_acct_id]                 INT             NOT NULL,
    [agent_copy]                     BIT             NULL,
    [tax_area_id]                    INT             NULL,
    [tax_area_number]                VARCHAR (23)    NULL,
    [legal_desc]                     VARCHAR (255)   NULL,
    [situs_display]                  VARCHAR (200)   NULL,
    [notice_acct_name]               VARCHAR (70)    NULL,
    [addr_line1]                     VARCHAR (60)    NULL,
    [addr_line2]                     VARCHAR (60)    NULL,
    [addr_line3]                     VARCHAR (60)    NULL,
    [addr_city]                      VARCHAR (50)    NULL,
    [addr_state]                     VARCHAR (50)    NULL,
    [addr_zip]                       VARCHAR (14)    NULL,
    [addr_country]                   VARCHAR (50)    NULL,
    [addr_mail_undeliverable]        BIT             NULL,
    [is_international]               BIT             NULL,
    [hood_cd]                        CHAR (10)       NULL,
    [hood_appraiser]                 VARCHAR (40)    NULL,
    [prev_land]                      NUMERIC (14)    NULL,
    [curr_land]                      NUMERIC (14)    NULL,
    [prev_structures]                NUMERIC (14)    NULL,
    [curr_structures]                NUMERIC (14)    NULL,
    [prev_land_in_program]           NUMERIC (14)    NULL,
    [curr_land_in_program]           NUMERIC (14)    NULL,
    [prev_land_non_program]          NUMERIC (14)    NULL,
    [curr_land_non_program]          NUMERIC (14)    NULL,
    [prev_frozen]                    NUMERIC (14)    NULL,
    [curr_frozen]                    NUMERIC (14)    NULL,
    [prev_non_exempt]                NUMERIC (14)    NULL,
    [curr_non_exempt]                NUMERIC (14)    NULL,
    [prev_snrdsbl_pct]               NUMERIC (5, 2)  NULL,
    [curr_snrdsbl_pct]               NUMERIC (5, 2)  NULL,
    [prev_snr_reduction_frozen]      NUMERIC (14)    NULL,
    [curr_snr_reduction_frozen]      NUMERIC (14)    NULL,
    [prev_frozen_taxable]            NUMERIC (14)    NULL,
    [curr_frozen_taxable]            NUMERIC (14)    NULL,
    [prev_total_base]                NUMERIC (14)    NULL,
    [curr_total_base]                NUMERIC (14)    NULL,
    [sys_addr_line1]                 VARCHAR (50)    NULL,
    [sys_addr_line2]                 VARCHAR (50)    NULL,
    [sys_addr_line3]                 VARCHAR (50)    NULL,
    [sys_addr_city]                  VARCHAR (50)    NULL,
    [sys_addr_state]                 CHAR (2)        NULL,
    [sys_addr_zip]                   VARCHAR (10)    NULL,
    [sys_addr_url]                   VARCHAR (50)    NULL,
    [last_appraiser]                 VARCHAR (40)    NULL,
    [exemptions]                     VARCHAR (100)   NULL,
    [owner_name]                     VARCHAR (70)    NULL,
    [geo_id]                         VARCHAR (50)    NULL,
    [ref_id1]                        VARCHAR (50)    NULL,
    [ref_id2]                        VARCHAR (50)    NULL,
    [prop_type_cd]                   CHAR (5)        NULL,
    [zip_4_2]                        VARCHAR (14)    NULL,
    [route]                          VARCHAR (2)     NULL,
    [cass]                           VARCHAR (4)     NULL,
    [zip]                            VARCHAR (5)     NULL,
    [prev_legal_acreage]             NUMERIC (14, 4) NULL,
    [curr_legal_acreage]             NUMERIC (14, 4) NULL,
    [split_merge_indicator]          BIT             CONSTRAINT [CDF_wash_appraisal_notice_prop_info_split_merge_indicator] DEFAULT ((0)) NOT NULL,
    [dba_name]                       VARCHAR (70)    NULL,
    [total_value]                    NUMERIC (14)    NULL,
    [value_exempt_from_taxation]     NUMERIC (14)    NULL,
    [total_assessed_value]           NUMERIC (14)    NULL,
    [state_farm_exempt_assets_value] NUMERIC (14)    NULL,
    [num_segment_lines]              INT             CONSTRAINT [CDF_wash_appraisal_notice_prop_info_num_segment_lines] DEFAULT ((0)) NOT NULL,
    [total_segment_orig_cost]        NUMERIC (14)    NULL,
    [total_segment_assessed_value]   NUMERIC (14)    NULL,
    [prev_total_value]               NUMERIC (14)    CONSTRAINT [CDF_wash_appraisal_notice_prop_info_prev_total_value] DEFAULT ((0)) NOT NULL,
    [prev_total_assessed_value]      NUMERIC (14)    CONSTRAINT [CDF_wash_appraisal_notice_prop_info_prev_total_assessed_value] DEFAULT ((0)) NOT NULL,
    [prev_market_value_cudfl_land]   NUMERIC (14)    CONSTRAINT [CDF_wash_appraisal_notice_prop_info_prev_market_value_cudfl_land] DEFAULT ((0)) NOT NULL,
    [curr_market_value_cudfl_land]   NUMERIC (14)    CONSTRAINT [CDF_wash_appraisal_notice_prop_info_curr_market_value_cudfl_land] DEFAULT ((0)) NOT NULL,
    [prev_market_value]              NUMERIC (14)    CONSTRAINT [CDF_wash_appraisal_notice_prop_info_prev_market_value] DEFAULT ((0)) NOT NULL,
    [curr_market_value]              NUMERIC (14)    CONSTRAINT [CDF_wash_appraisal_notice_prop_info_curr_market_value] DEFAULT ((0)) NOT NULL,
    [prev_appraised_value]           NUMERIC (14)    CONSTRAINT [CDF_wash_appraisal_notice_prop_info_prev_appraised_value] DEFAULT ((0)) NOT NULL,
    [curr_appraised_value]           NUMERIC (14)    CONSTRAINT [CDF_wash_appraisal_notice_prop_info_curr_appraised_value] DEFAULT ((0)) NOT NULL,
    [is_leased_land_property]        BIT             CONSTRAINT [CDF_wash_appraisal_notice_prop_info_is_leased_land_property] DEFAULT ((0)) NOT NULL,
    [prev_non_taxed_mkt_val]         NUMERIC (14)    CONSTRAINT [CDF_wash_appraisal_notice_prop_info_prev_non_taxed_mkt_val] DEFAULT ((0)) NULL,
    [non_taxed_mkt_val]              NUMERIC (14)    CONSTRAINT [CDF_wash_appraisal_notice_prop_info_non_taxed_mkt_val] DEFAULT ((0)) NULL,
    [master_lease_group_id]          INT             NULL,
    [postmarked]                     VARCHAR (10)    NULL,
    [penalty_pct]                    NUMERIC (5, 2)  NULL,
    [review_appraiser]               VARCHAR (40)    NULL,
    CONSTRAINT [CPK_wash_appraisal_notice_prop_info] PRIMARY KEY CLUSTERED ([notice_year] ASC, [notice_run_id] ASC, [prop_id] ASC, [owner_id] ASC, [sup_yr] ASC, [sup_num] ASC, [notice_acct_id] ASC),
    CONSTRAINT [CFK_wash_appraisal_notice_prop_info_notice_year_notice_run_id] FOREIGN KEY ([notice_year], [notice_run_id]) REFERENCES [dbo].[wash_appraisal_notice_selection_criteria] ([notice_year], [notice_run_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id_notice_year]
    ON [dbo].[wash_appraisal_notice_prop_info]([prop_id] ASC, [notice_year] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'State Farm Exempt Assets Value for Personal Property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'state_farm_exempt_assets_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Prev Market value for non-taxable land segments', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'prev_non_taxed_mkt_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Total of Segment Assessed Value for Personal Property Listing', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'total_segment_assessed_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The postmarked date or status of a BPP property in an appraisal notice', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'postmarked';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicator that property was split or merged during the notice year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'split_merge_indicator';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Previous Year Market Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'prev_market_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Master lease group associated with a notice property, if any', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'master_lease_group_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Total of Segment Original Cost for Personal Property Listing', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'total_segment_orig_cost';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Year legal acreage', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'curr_legal_acreage';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Review appraiser, for personal property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'review_appraiser';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Previous Assessed Value for Personal Property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'prev_total_assessed_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Total Value for Personal Property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'total_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Previous Year Appraised Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'prev_appraised_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The rendition penalty for a BPP property in an appraisal notice', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'penalty_pct';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Previous Appraised Value for Personal Property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'prev_total_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'DBA Name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'dba_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Current Year Market Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'curr_market_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Current Year Market Value of CU/DFL Land', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'curr_market_value_cudfl_land';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Total Assessed Value for Personal Property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'total_assessed_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Improvements on Leased Land Attribute', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'is_leased_land_property';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Previous Year Market Value of CU/DFL Land', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'prev_market_value_cudfl_land';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Value Exempt From Taxation for Personal Property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'value_exempt_from_taxation';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Current Year Appraised Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'curr_appraised_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Number of Segment Lines for Personal Property Listing', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'num_segment_lines';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Market value for non-taxable land segments', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'non_taxed_mkt_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Previous Year legal acreage', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_prop_info', @level2type = N'COLUMN', @level2name = N'prev_legal_acreage';


GO

