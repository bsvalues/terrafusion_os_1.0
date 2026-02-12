CREATE TABLE [dbo].[pers_prop_rendition_columns] (
    [pp_rend_column]     VARCHAR (10)  NOT NULL,
    [column_display]     VARCHAR (100) NOT NULL,
    [column_description] VARCHAR (255) NULL,
    [column_order]       INT           NULL,
    [default_pp_type_cd] CHAR (10)     NULL,
    CONSTRAINT [CPK_pers_prop_rendition_columns] PRIMARY KEY CLUSTERED ([pp_rend_column] ASC) WITH (FILLFACTOR = 80)
);


GO

