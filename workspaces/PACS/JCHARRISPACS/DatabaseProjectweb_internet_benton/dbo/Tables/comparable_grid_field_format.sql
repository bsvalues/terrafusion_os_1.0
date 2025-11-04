CREATE TABLE [dbo].[comparable_grid_field_format] (
    [lFieldID]   INT         NOT NULL,
    [bRight]     BIT         NOT NULL,
    [szModifier] VARCHAR (1) NOT NULL,
    [bBold]      BIT         NOT NULL,
    [szGridType] VARCHAR (2) NOT NULL,
    CONSTRAINT [CPK_comparable_grid_field_format] PRIMARY KEY CLUSTERED ([szGridType] ASC, [lFieldID] ASC, [bRight] ASC, [szModifier] ASC) WITH (FILLFACTOR = 100)
);


GO

