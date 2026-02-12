CREATE TABLE [dbo].[litigation_jury_type] (
    [litigation_jury_type_cd]   VARCHAR (10) NOT NULL,
    [litigation_jury_type_desc] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_litigation_jury_type] PRIMARY KEY CLUSTERED ([litigation_jury_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

