CREATE TABLE [dbo].[land_meth] (
    [land_meth_cd]   CHAR (5)     NOT NULL,
    [land_meth_desc] VARCHAR (50) NULL,
    [sys_flag]       CHAR (1)     NULL,
    CONSTRAINT [CPK_land_meth] PRIMARY KEY CLUSTERED ([land_meth_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

