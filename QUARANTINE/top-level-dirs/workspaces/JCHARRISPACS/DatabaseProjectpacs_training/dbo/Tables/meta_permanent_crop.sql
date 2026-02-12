CREATE TABLE [dbo].[meta_permanent_crop] (
    [field_id]              INT          NOT NULL,
    [field_name]            VARCHAR (30) NOT NULL,
    [control_name_prefix]   VARCHAR (30) NOT NULL,
    [binding_table_name]    VARCHAR (20) NOT NULL,
    [binding_column_name]   VARCHAR (50) NOT NULL,
    [combo_box_reader_name] VARCHAR (50) NULL,
    [num_decimal_places]    INT          NULL,
    [positioning_index]     INT          NOT NULL,
    CONSTRAINT [CPK_meta_component_crop] PRIMARY KEY CLUSTERED ([field_id] ASC)
);


GO

