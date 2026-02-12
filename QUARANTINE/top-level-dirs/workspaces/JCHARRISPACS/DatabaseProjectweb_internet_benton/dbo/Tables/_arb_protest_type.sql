CREATE TABLE [dbo].[_arb_protest_type] (
    [protest_type_cd]   VARCHAR (10) NOT NULL,
    [protest_type_desc] VARCHAR (50) NULL,
    [sys_flag]          CHAR (1)     NULL,
    CONSTRAINT [CPK__arb_protest_type] PRIMARY KEY CLUSTERED ([protest_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

