CREATE TABLE [dbo].[escrow_status] (
    [escrow_status_cd]   VARCHAR (5)  NOT NULL,
    [escrow_status_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_escrow_status] PRIMARY KEY CLUSTERED ([escrow_status_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

