CREATE TABLE [dbo].[escrow_status_type] (
    [escrow_status_type_cd]   VARCHAR (10) NOT NULL,
    [escrow_status_type_desc] VARCHAR (30) NULL,
    CONSTRAINT [CPK_escrow_status_type] PRIMARY KEY CLUSTERED ([escrow_status_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

