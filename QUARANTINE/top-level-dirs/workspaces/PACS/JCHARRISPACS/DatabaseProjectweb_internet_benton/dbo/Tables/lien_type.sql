CREATE TABLE [dbo].[lien_type] (
    [lien_type_code]        VARCHAR (20) NOT NULL,
    [lien_type_description] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_lien_type] PRIMARY KEY CLUSTERED ([lien_type_code] ASC)
);


GO

