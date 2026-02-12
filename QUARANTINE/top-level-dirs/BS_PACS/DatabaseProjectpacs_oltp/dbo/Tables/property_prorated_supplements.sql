CREATE TABLE [dbo].[property_prorated_supplements] (
    [year]         NUMERIC (4) NOT NULL,
    [sup_num]      INT         NOT NULL,
    [prop_id]      INT         NOT NULL,
    [past_sup_num] INT         NOT NULL,
    [begin_date]   DATETIME    NULL,
    [end_date]     DATETIME    NULL,
    CONSTRAINT [CPK_property_prorated_supplements] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [past_sup_num] ASC),
    CONSTRAINT [CFK_property_prorated_supplements_property_val] FOREIGN KEY ([year], [sup_num], [prop_id]) REFERENCES [dbo].[property_val] ([prop_val_yr], [sup_num], [prop_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - property ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_supplements', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The number of the past supplement begin included', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_supplements', @level2type = N'COLUMN', @level2name = N'past_sup_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'A list of past supplements without exemptions, which the user has selected to be included in exemption proration.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_supplements';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The first day on which the past supplement is effective', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_supplements', @level2type = N'COLUMN', @level2name = N'begin_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The last day on which the past supplement is effective', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_supplements', @level2type = N'COLUMN', @level2name = N'end_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_supplements', @level2type = N'COLUMN', @level2name = N'year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - supplement number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_supplements', @level2type = N'COLUMN', @level2name = N'sup_num';


GO

