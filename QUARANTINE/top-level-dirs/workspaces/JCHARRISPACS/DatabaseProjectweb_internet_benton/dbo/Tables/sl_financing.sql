CREATE TABLE [dbo].[sl_financing] (
    [sl_financing_cd]   CHAR (5)     NOT NULL,
    [sl_financing_desc] VARCHAR (30) NULL,
    [sys_flag]          CHAR (1)     NULL,
    CONSTRAINT [CPK_sl_financing] PRIMARY KEY CLUSTERED ([sl_financing_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

