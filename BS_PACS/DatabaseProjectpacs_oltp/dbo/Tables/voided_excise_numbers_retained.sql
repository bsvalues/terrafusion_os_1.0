CREATE TABLE [dbo].[voided_excise_numbers_retained] (
    [excise_number] INT NOT NULL,
    [unavailable]   BIT DEFAULT ((0)) NOT NULL,
    [exported]      BIT DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_voided_excise_numbers_retained] PRIMARY KEY CLUSTERED ([excise_number] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Table to keep track of REET Excise Numbers that have been voided/exported', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'voided_excise_numbers_retained';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Excise Number that had payment voided', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'voided_excise_numbers_retained', @level2type = N'COLUMN', @level2name = N'excise_number';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicator that Excise Number has been reused', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'voided_excise_numbers_retained', @level2type = N'COLUMN', @level2name = N'unavailable';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicator that Excise Number has been exported.  Once exported, it cannot be reused again.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'voided_excise_numbers_retained', @level2type = N'COLUMN', @level2name = N'exported';


GO

