CREATE TABLE [dbo].[depreciation_type] (
    [type_cd]   CHAR (5)     NOT NULL,
    [type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_depreciation_type] PRIMARY KEY CLUSTERED ([type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

