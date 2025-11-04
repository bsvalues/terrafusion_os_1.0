CREATE TABLE [dbo].[dor_report_config] (
    [year]                       NUMERIC (4)  NOT NULL,
    [type]                       VARCHAR (2)  NOT NULL,
    [exclude_current_use]        BIT          DEFAULT ((0)) NOT NULL,
    [sale_date_begin]            DATETIME     NULL,
    [sale_date_end]              DATETIME     NULL,
    [separate_current_use_group] BIT          CONSTRAINT [CDF_dor_report_config_separate_current_use_group] DEFAULT ((0)) NULL,
    [use_custom_stratum]         BIT          NULL,
    [custom_stratum_name]        VARCHAR (70) NULL,
    CONSTRAINT [CPK_dor_report_config] PRIMARY KEY CLUSTERED ([year] ASC, [type] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Custom Stratum Name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'dor_report_config', @level2type = N'COLUMN', @level2name = N'custom_stratum_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'True if there should be 3 real stratification groups for this year instead of two', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'dor_report_config', @level2type = N'COLUMN', @level2name = N'separate_current_use_group';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Verify if Report should use Custom Stratum', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'dor_report_config', @level2type = N'COLUMN', @level2name = N'use_custom_stratum';


GO

