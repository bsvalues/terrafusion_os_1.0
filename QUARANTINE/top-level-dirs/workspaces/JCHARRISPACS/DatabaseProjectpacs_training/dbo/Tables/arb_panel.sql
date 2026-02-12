CREATE TABLE [dbo].[arb_panel] (
    [arb_panel_cd]   CHAR (5)     NOT NULL,
    [arb_panel_desc] VARCHAR (50) NOT NULL,
    [sys_flag]       CHAR (1)     NULL,
    CONSTRAINT [CPK_arb_panel] PRIMARY KEY CLUSTERED ([arb_panel_cd] ASC, [arb_panel_desc] ASC) WITH (FILLFACTOR = 90)
);


GO

