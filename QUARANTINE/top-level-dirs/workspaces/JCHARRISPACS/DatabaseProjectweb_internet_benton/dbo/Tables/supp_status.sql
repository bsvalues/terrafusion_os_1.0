CREATE TABLE [dbo].[supp_status] (
    [status_cd]   CHAR (5)     NOT NULL,
    [status_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_supp_status] PRIMARY KEY CLUSTERED ([status_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

