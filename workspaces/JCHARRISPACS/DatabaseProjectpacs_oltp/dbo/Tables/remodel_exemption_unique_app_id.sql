CREATE TABLE [dbo].[remodel_exemption_unique_app_id] (
    [prop_id]               INT         NOT NULL,
    [year]                  NUMERIC (4) NOT NULL,
    [next_id]               INT         NOT NULL,
    [current_assessment_yr] INT         NULL,
    CONSTRAINT [pk_remodel_exemption_unique_app_id] PRIMARY KEY CLUSTERED ([prop_id] ASC, [year] ASC, [next_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Keeps the year the unique app id was created. ', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'remodel_exemption_unique_app_id', @level2type = N'COLUMN', @level2name = N'current_assessment_yr';


GO

