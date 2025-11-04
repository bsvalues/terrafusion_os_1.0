CREATE TABLE [dbo].[reet_import_reject_code] (
    [reet_import_reject_cd]   VARCHAR (10)  NOT NULL,
    [reet_import_reject_desc] VARCHAR (100) NOT NULL,
    CONSTRAINT [CPK_reet_import_reject_cd] PRIMARY KEY CLUSTERED ([reet_import_reject_cd] ASC)
);


GO

