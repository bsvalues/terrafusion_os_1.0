CREATE TABLE [dbo].[_arb_protest_panel] (
    [panel_cd]            VARCHAR (10)  NOT NULL,
    [panel_desc]          VARCHAR (50)  NULL,
    [panel_printer_name]  VARCHAR (256) NULL,
    [panel_computer_name] VARCHAR (50)  NULL,
    CONSTRAINT [CPK__arb_protest_panel] PRIMARY KEY CLUSTERED ([panel_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

