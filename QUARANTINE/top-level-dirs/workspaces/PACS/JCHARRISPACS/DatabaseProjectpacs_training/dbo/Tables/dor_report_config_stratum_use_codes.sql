CREATE TABLE [dbo].[dor_report_config_stratum_use_codes] (
    [year]            NUMERIC (5)  NOT NULL,
    [type]            VARCHAR (2)  NOT NULL,
    [group_type]      CHAR (1)     NOT NULL,
    [property_use_cd] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_dor_report_config_stratum_use_codes] PRIMARY KEY CLUSTERED ([year] ASC, [type] ASC, [group_type] ASC, [property_use_cd] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'DOR Report Configuration Stratum Use Codes', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'dor_report_config_stratum_use_codes';


GO

