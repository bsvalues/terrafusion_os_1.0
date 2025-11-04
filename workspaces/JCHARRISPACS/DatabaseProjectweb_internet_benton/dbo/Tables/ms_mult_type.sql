CREATE TABLE [dbo].[ms_mult_type] (
    [mult_type_cd]   CHAR (2)     NOT NULL,
    [mult_type_desc] VARCHAR (20) NULL,
    [sys_flag]       CHAR (1)     NULL,
    CONSTRAINT [CPK_ms_mult_type] PRIMARY KEY CLUSTERED ([mult_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

