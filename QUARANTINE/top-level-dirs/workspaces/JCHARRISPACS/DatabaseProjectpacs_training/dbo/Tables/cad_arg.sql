CREATE TABLE [dbo].[cad_arg] (
    [cad_arg_cd]   CHAR (5)     NOT NULL,
    [cad_arg_desc] VARCHAR (50) NULL,
    [sys_flag]     CHAR (1)     NULL,
    CONSTRAINT [CPK_cad_arg] PRIMARY KEY CLUSTERED ([cad_arg_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

