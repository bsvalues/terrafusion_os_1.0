CREATE TABLE [dbo].[mass_update_reason] (
    [reason_cd]   VARCHAR (10) NOT NULL,
    [reason_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_mass_update_reason] PRIMARY KEY CLUSTERED ([reason_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

