CREATE TABLE [dbo].[wash_appraisal_notice_selection_criteria] (
    [notice_year]                               NUMERIC (4)    NOT NULL,
    [notice_run_id]                             INT            NOT NULL,
    [real_option]                               CHAR (1)       NULL,
    [personal_option]                           CHAR (1)       NULL,
    [mobile_option]                             CHAR (1)       NULL,
    [mineral_option]                            CHAR (1)       NULL,
    [market_value_based]                        BIT            NULL,
    [assessed_value_based]                      BIT            NULL,
    [include_value_increase_greater]            BIT            NULL,
    [value_increase_greater]                    NUMERIC (14)   NULL,
    [include_value_decrease_greater]            BIT            NULL,
    [value_decrease_greater]                    NUMERIC (14)   NULL,
    [include_rendered_value]                    BIT            NULL,
    [rendered_value]                            CHAR (1)       NULL,
    [include_neighborhood_codes]                BIT            NULL,
    [include_last_ownership_change]             BIT            NULL,
    [last_ownership_change_date]                DATETIME       NULL,
    [include_previously_printed]                BIT            NULL,
    [include_last_appraisal_year]               BIT            NULL,
    [last_appraisal_year]                       NUMERIC (4)    NULL,
    [include_cycles]                            BIT            NULL,
    [include_property_groups]                   BIT            NULL,
    [select_by_query]                           BIT            NULL,
    [query]                                     VARCHAR (4096) NULL,
    [exclude_properties_no_notice]              BIT            NULL,
    [exclude_properties_under_500]              BIT            NULL,
    [exclude_exempt_properties]                 BIT            NULL,
    [exclude_local_assessed_properties]         BIT            NULL,
    [create_date]                               DATETIME       NULL,
    [created_by]                                INT            NULL,
    [print_date]                                DATETIME       NULL,
    [printed_by]                                INT            NULL,
    [notice_line1]                              VARCHAR (60)   NULL,
    [notice_line2]                              VARCHAR (60)   NULL,
    [notice_line3]                              VARCHAR (60)   NULL,
    [print_property_id]                         BIT            NULL,
    [property_id_type]                          INT            NULL,
    [print_prior_year_values]                   BIT            NULL,
    [print_appraiser_id]                        BIT            NULL,
    [logo_path]                                 VARCHAR (128)  NULL,
    [sup_yr]                                    NUMERIC (4)    NULL,
    [sup_num]                                   INT            NULL,
    [include_pp_segment_listing]                BIT            CONSTRAINT [CDF_wash_appraisal_notice_selection_criteria_include_pp_segment_listing] DEFAULT ((0)) NOT NULL,
    [exclude_state_assessed_utility_properties] BIT            CONSTRAINT [CDF_wash_appraisal_notice_selection_criteria_exclude_state_assessed_utility_properties] DEFAULT ((0)) NOT NULL,
    [display_frozen_value]                      BIT            CONSTRAINT [CDF_wash_appraisal_notice_selection_criteria_display_frozen_value] DEFAULT ((0)) NOT NULL,
    [filing_status]                             VARCHAR (25)   NULL,
    [master_lease_option]                       CHAR (1)       CONSTRAINT [CDF_wash_appraisal_notice_selection_criteria_master_lease_option] DEFAULT ('E') NOT NULL,
    [bpp_review_date]                           BIT            CONSTRAINT [CDF_wash_appraisal_notice_selection_criteria_bpp_review_date] DEFAULT ((0)) NOT NULL,
    [bpp_review_date_from]                      DATETIME       NULL,
    [bpp_review_date_to]                        DATETIME       NULL,
    [asset_sort]                                INT            CONSTRAINT [CDF_wash_appraisal_notice_selection_criteria_asset_sort] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_wash_appraisal_notice_selection_criteria] PRIMARY KEY CLUSTERED ([notice_year] ASC, [notice_run_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'BPP Review Date - To', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_selection_criteria', @level2type = N'COLUMN', @level2name = N'bpp_review_date_to';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Display Frozen Value Indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_selection_criteria', @level2type = N'COLUMN', @level2name = N'display_frozen_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag to indicate user excluded state assessed utility properties', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_selection_criteria', @level2type = N'COLUMN', @level2name = N'exclude_state_assessed_utility_properties';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include or exclude master leases', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_selection_criteria', @level2type = N'COLUMN', @level2name = N'master_lease_option';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Filing status of a personal property rendition', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_selection_criteria', @level2type = N'COLUMN', @level2name = N'filing_status';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'BPP Review Date - From', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_selection_criteria', @level2type = N'COLUMN', @level2name = N'bpp_review_date_from';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include Segment Listing on Personal Property Notice', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_selection_criteria', @level2type = N'COLUMN', @level2name = N'include_pp_segment_listing';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Use a BPP review date criteria', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_selection_criteria', @level2type = N'COLUMN', @level2name = N'bpp_review_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Personal Property Asset Sort Setting', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_selection_criteria', @level2type = N'COLUMN', @level2name = N'asset_sort';


GO

