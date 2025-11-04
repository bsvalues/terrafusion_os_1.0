CREATE TABLE [dbo].[address_type] (
    [addr_type_cd]   CHAR (5)     NOT NULL,
    [addr_type_desc] VARCHAR (50) NULL,
    [sys_flag]       CHAR (1)     NULL,
    CONSTRAINT [CPK_address_type] PRIMARY KEY CLUSTERED ([addr_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

