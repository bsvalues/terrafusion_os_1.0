CREATE TABLE [dbo].[chg_reason] (
    [chg_reason_cd]   CHAR (5)     NOT NULL,
    [chg_reason_desc] VARCHAR (50) NULL,
    [sys_flag]        CHAR (1)     NULL,
    CONSTRAINT [CPK_chg_reason] PRIMARY KEY CLUSTERED ([chg_reason_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

