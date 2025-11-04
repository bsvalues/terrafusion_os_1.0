CREATE TABLE [dbo].[arb_mtg_type] (
    [arb_mtg_type_cd]   CHAR (5)     NOT NULL,
    [arb_mtg_type_desc] VARCHAR (50) NULL,
    [sys_flag]          CHAR (1)     NULL,
    CONSTRAINT [CPK_arb_mtg_type] PRIMARY KEY CLUSTERED ([arb_mtg_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

