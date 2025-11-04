CREATE TABLE [dbo].[penalty_interest_property_type] (
    [penalty_interest_property_type_cd]   VARCHAR (10) NOT NULL,
    [penalty_interest_property_type_desc] VARCHAR (50) NULL,
    [personal]                            BIT          CONSTRAINT [CDF_penalty_interest_property_type_personal] DEFAULT ((0)) NOT NULL,
    [priority]                            INT          CONSTRAINT [CDF_penalty_interest_property_type_priority] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_penalty_interest_property_type] PRIMARY KEY CLUSTERED ([penalty_interest_property_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Heirarchy Order', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'penalty_interest_property_type', @level2type = N'COLUMN', @level2name = N'priority';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Personal Property Type Flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'penalty_interest_property_type', @level2type = N'COLUMN', @level2name = N'personal';


GO

