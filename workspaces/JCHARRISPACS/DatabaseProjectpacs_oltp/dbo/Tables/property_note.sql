CREATE TABLE [dbo].[property_note] (
    [prop_id]     INT           NOT NULL,
    [prop_val_yr] INT           NOT NULL,
    [prop_note]   VARCHAR (320) NULL,
    CONSTRAINT [CPK_property_note] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC)
);


GO

