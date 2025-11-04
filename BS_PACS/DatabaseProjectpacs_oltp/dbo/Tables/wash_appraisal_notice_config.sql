CREATE TABLE [dbo].[wash_appraisal_notice_config] (
    [notice_year]                NUMERIC (4)   NOT NULL,
    [notice_line1]               VARCHAR (60)  NULL,
    [notice_line2]               VARCHAR (60)  NULL,
    [notice_line3]               VARCHAR (60)  NULL,
    [notice_line4]               VARCHAR (60)  NULL,
    [notice_line5]               VARCHAR (60)  NULL,
    [notice_line6]               VARCHAR (60)  NULL,
    [logo_path]                  VARCHAR (128) NULL,
    [print_property_id]          BIT           NULL,
    [print_property_id_type]     INT           NULL,
    [print_prior_values]         BIT           NULL,
    [print_appraiser_id]         BIT           NULL,
    [main_phone]                 VARCHAR (20)  NULL,
    [direct_phone]               VARCHAR (20)  NULL,
    [fax]                        VARCHAR (20)  NULL,
    [email]                      VARCHAR (255) NULL,
    [notice_expiration]          DATETIME      NOT NULL,
    [notice_footer_reviewed]     BIT           NULL,
    [notice_footer_left]         VARCHAR (MAX) NULL,
    [notice_footer_right]        VARCHAR (MAX) NULL,
    [notice_block_a_reviewed]    BIT           NULL,
    [notice_block_a]             VARCHAR (MAX) NULL,
    [notice_block_b_reviewed]    BIT           NULL,
    [notice_block_b]             VARCHAR (MAX) NULL,
    [notice_block_c_reviewed]    BIT           NULL,
    [notice_block_c]             VARCHAR (MAX) NULL,
    [notice_block_d_reviewed]    BIT           NULL,
    [notice_block_d]             VARCHAR (MAX) NULL,
    [notice_block_e_reviewed]    BIT           NULL,
    [notice_block_e]             VARCHAR (MAX) NULL,
    [notice_block_f_reviewed]    BIT           NULL,
    [notice_block_f]             VARCHAR (MAX) NULL,
    [notice_block_g_reviewed]    BIT           NULL,
    [notice_block_g]             VARCHAR (MAX) NULL,
    [type_cd]                    VARCHAR (5)   CONSTRAINT [CDF_wash_appraisal_notice_config_type_cd] DEFAULT ('R') NOT NULL,
    [include_pp_segment_listing] BIT           CONSTRAINT [CDF_wash_appraisal_notice_config_include_pp_segment_listing] DEFAULT ((0)) NOT NULL,
    [penalty_rate_text]          VARCHAR (MAX) NULL,
    [no_file_text]               VARCHAR (MAX) NULL,
    [asset_sort]                 INT           CONSTRAINT [CDF_wash_appraisal_notice_config_asset_sort] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_wash_appraisal_notice_config] PRIMARY KEY CLUSTERED ([notice_year] ASC, [notice_expiration] ASC, [type_cd] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Personal Property Asset Sort Setting', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_config', @level2type = N'COLUMN', @level2name = N'asset_sort';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Type Code for configuration', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_config', @level2type = N'COLUMN', @level2name = N'type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include Segment Listing on Personal Property Notice', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_config', @level2type = N'COLUMN', @level2name = N'include_pp_segment_listing';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'User defined text for reports', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_config', @level2type = N'COLUMN', @level2name = N'penalty_rate_text';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'User defined text for reports', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_config', @level2type = N'COLUMN', @level2name = N'no_file_text';


GO

