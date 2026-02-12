CREATE TABLE [dbo].[_arb_protest_panel_member_cd] (
    [member_cd]     VARCHAR (10) NOT NULL,
    [member_desc]   VARCHAR (50) NULL,
    [inactive_flag] BIT          NOT NULL,
    CONSTRAINT [CPK__arb_protest_panel_member_cd] PRIMARY KEY CLUSTERED ([member_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

