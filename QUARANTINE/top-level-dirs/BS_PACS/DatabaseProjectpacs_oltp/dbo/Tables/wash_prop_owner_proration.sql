CREATE TABLE [dbo].[wash_prop_owner_proration] (
    [year]            NUMERIC (4)      NOT NULL,
    [sup_num]         INT              NOT NULL,
    [prop_id]         INT              NOT NULL,
    [owner_id]        INT              NOT NULL,
    [past_sup_num]    INT              NOT NULL,
    [past_owner_id]   INT              NOT NULL,
    [ex_value_pct]    NUMERIC (20, 19) NOT NULL,
    [no_ex_value_pct] NUMERIC (20, 19) NOT NULL,
    CONSTRAINT [CPK_wash_prop_owner_proration] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [past_sup_num] ASC, [past_owner_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property/Owner Value key - year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_prop_owner_proration', @level2type = N'COLUMN', @level2name = N'year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include this percentage of the value without exemptions', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_prop_owner_proration', @level2type = N'COLUMN', @level2name = N'no_ex_value_pct';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property/Owner Value key - supplement number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_prop_owner_proration', @level2type = N'COLUMN', @level2name = N'sup_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property/Owner Value key - property ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_prop_owner_proration', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property/Owner Value key - owner ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_prop_owner_proration', @level2type = N'COLUMN', @level2name = N'owner_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Use the values of this past supplement/owner', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_prop_owner_proration', @level2type = N'COLUMN', @level2name = N'past_sup_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Use the values of this past supplemnt/owner', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_prop_owner_proration', @level2type = N'COLUMN', @level2name = N'past_owner_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Calculated percentages of value for exemption proration', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_prop_owner_proration';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include this percentage of the value with exemptions', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_prop_owner_proration', @level2type = N'COLUMN', @level2name = N'ex_value_pct';


GO

