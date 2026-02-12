CREATE TABLE [dbo].[data_property_definition] (
    [field_id]          INT           IDENTITY (1, 1) NOT NULL,
    [field_order]       SMALLINT      NOT NULL,
    [column_name]       VARCHAR (50)  NOT NULL,
    [label_name]        VARCHAR (50)  NOT NULL,
    [control_type]      SMALLINT      NOT NULL,
    [show]              SMALLINT      NULL,
    [tab_order]         SMALLINT      NULL,
    [control_top]       SMALLINT      NULL,
    [control_left]      SMALLINT      NULL,
    [control_bottom]    SMALLINT      NULL,
    [control_right]     SMALLINT      NULL,
    [edit_max]          SMALLINT      NOT NULL,
    [lookup_query]      VARCHAR (512) NULL,
    [pp_show]           SMALLINT      NULL,
    [pp_tab_order]      SMALLINT      NULL,
    [pp_control_top]    SMALLINT      NULL,
    [pp_control_left]   SMALLINT      NULL,
    [pp_control_bottom] SMALLINT      NULL,
    [pp_control_right]  SMALLINT      NULL,
    CONSTRAINT [CPK_data_property_definition] PRIMARY KEY CLUSTERED ([field_id] ASC) WITH (FILLFACTOR = 100)
);


GO

