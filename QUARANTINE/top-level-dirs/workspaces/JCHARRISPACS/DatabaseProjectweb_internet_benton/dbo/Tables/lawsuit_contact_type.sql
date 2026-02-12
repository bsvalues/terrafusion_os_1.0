CREATE TABLE [dbo].[lawsuit_contact_type] (
    [contact_cd]   VARCHAR (10) NOT NULL,
    [contact_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_lawsuit_contact_type] PRIMARY KEY CLUSTERED ([contact_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

