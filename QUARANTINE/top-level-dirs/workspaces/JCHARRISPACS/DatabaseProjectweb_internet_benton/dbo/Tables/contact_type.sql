CREATE TABLE [dbo].[contact_type] (
    [contact_type_cd]   VARCHAR (10) NOT NULL,
    [contact_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_contact_type] PRIMARY KEY CLUSTERED ([contact_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

