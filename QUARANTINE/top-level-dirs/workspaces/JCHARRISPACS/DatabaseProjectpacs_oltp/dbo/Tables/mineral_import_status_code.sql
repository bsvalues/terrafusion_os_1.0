CREATE TABLE [dbo].[mineral_import_status_code] (
    [status_code]        VARCHAR (20) NOT NULL,
    [status_description] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_mineral_import_status_code] PRIMARY KEY CLUSTERED ([status_code] ASC) WITH (FILLFACTOR = 90)
);


GO

