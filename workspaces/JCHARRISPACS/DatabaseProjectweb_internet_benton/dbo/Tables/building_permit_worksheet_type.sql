CREATE TABLE [dbo].[building_permit_worksheet_type] (
    [type_cd]   VARCHAR (10) NOT NULL,
    [type_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_building_permit_worksheet_type] PRIMARY KEY CLUSTERED ([type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

