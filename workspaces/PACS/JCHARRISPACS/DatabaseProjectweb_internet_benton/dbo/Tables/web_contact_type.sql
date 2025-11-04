CREATE TABLE [dbo].[web_contact_type] (
    [web_contact_type_cd]   VARCHAR (5)  NOT NULL,
    [web_contact_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_web_contact_type] PRIMARY KEY CLUSTERED ([web_contact_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

