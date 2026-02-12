CREATE TABLE [dbo].[pp_table_meth] (
    [pp_table_meth_cd]   CHAR (5)     NOT NULL,
    [pp_table_meth_desc] VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    CONSTRAINT [CPK_pp_table_meth] PRIMARY KEY CLUSTERED ([pp_table_meth_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

