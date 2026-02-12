CREATE TABLE [dbo].[import_user_property_val_assessment_data] (
    [import_id]             INT             NOT NULL,
    [import_data_id]        INT             IDENTITY (1, 1) NOT NULL,
    [match]                 CHAR (1)        NULL,
    [error]                 VARCHAR (255)   NULL,
    [complete]              BIT             NULL,
    [pacs_property_id]      INT             NULL,
    [pacs_geo_id]           CHAR (25)       NULL,
    [prop_id]               INT             NULL,
    [geo_id]                CHAR (25)       NULL,
    [is_primary]            BIT             NULL,
    [benefit_acres]         NUMERIC (18, 4) NULL,
    [benefit_acre_sum]      NUMERIC (18, 4) NULL,
    [nwa_type]              VARCHAR (3)     NULL,
    [nwa_acres]             INT             NULL,
    [nwa_supplemental]      NUMERIC (18, 4) NULL,
    [nwa_aggregate_pid]     INT             NULL,
    [displaytext_exemption] VARCHAR (50)    NULL,
    [displaytext_massadj]   VARCHAR (50)    NULL,
    [crid_acres]            NUMERIC (18)    NULL,
    [weed_acres]            NUMERIC (18)    NULL,
    [drain_acres]           DECIMAL (18, 4) NULL,
    PRIMARY KEY CLUSTERED ([import_id] ASC, [import_data_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'nwa_acres', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_user_property_val_assessment_data', @level2type = N'COLUMN', @level2name = N'nwa_acres';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'nwa_supplemental', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_user_property_val_assessment_data', @level2type = N'COLUMN', @level2name = N'nwa_supplemental';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'is_primary', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_user_property_val_assessment_data', @level2type = N'COLUMN', @level2name = N'is_primary';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'displaytext_massadj', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_user_property_val_assessment_data', @level2type = N'COLUMN', @level2name = N'displaytext_massadj';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'nwa_type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_user_property_val_assessment_data', @level2type = N'COLUMN', @level2name = N'nwa_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Import staging table for user_property_val_assessment_data', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_user_property_val_assessment_data';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'benefit_acre_sum', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_user_property_val_assessment_data', @level2type = N'COLUMN', @level2name = N'benefit_acre_sum';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'displaytext_exemption', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_user_property_val_assessment_data', @level2type = N'COLUMN', @level2name = N'displaytext_exemption';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'nwa_aggregate_pid', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_user_property_val_assessment_data', @level2type = N'COLUMN', @level2name = N'nwa_aggregate_pid';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'benefit_acres', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_user_property_val_assessment_data', @level2type = N'COLUMN', @level2name = N'benefit_acres';


GO

