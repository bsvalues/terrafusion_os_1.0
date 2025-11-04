CREATE TABLE [dbo].[_arb_protest_by] (
    [protest_by_cd]   VARCHAR (10) NOT NULL,
    [protest_by_desc] VARCHAR (50) NULL,
    [sys_flag]        CHAR (1)     NULL,
    CONSTRAINT [CPK__arb_protest_by] PRIMARY KEY CLUSTERED ([protest_by_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

