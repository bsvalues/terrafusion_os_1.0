CREATE TABLE [dbo].[condo_maintenance] (
    [maintenance_cd]   VARCHAR (10) NOT NULL,
    [maintenance_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_maintenance] PRIMARY KEY CLUSTERED ([maintenance_cd] ASC)
);


GO

