CREATE TABLE [dbo].[fin_event_panel] (
    [event_panel_cd]          VARCHAR (10) NOT NULL,
    [event_panel_description] VARCHAR (50) NOT NULL,
    [assoc_table_name]        VARCHAR (50) NULL,
    [core_object_type_cd]     VARCHAR (20) NULL,
    CONSTRAINT [CPK_fin_event_panel] PRIMARY KEY CLUSTERED ([event_panel_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

