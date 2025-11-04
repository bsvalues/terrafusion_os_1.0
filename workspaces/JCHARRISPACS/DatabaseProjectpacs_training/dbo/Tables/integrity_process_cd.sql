CREATE TABLE [dbo].[integrity_process_cd] (
    [process_cd]   VARCHAR (10) NOT NULL,
    [process_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_integrity_process_cd] PRIMARY KEY CLUSTERED ([process_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

