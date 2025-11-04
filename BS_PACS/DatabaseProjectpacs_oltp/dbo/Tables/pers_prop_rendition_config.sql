CREATE TABLE [dbo].[pers_prop_rendition_config] (
    [pp_type_cd]     CHAR (10)    NOT NULL,
    [pp_rend_column] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_pers_prop_rendition_config] PRIMARY KEY CLUSTERED ([pp_rend_column] ASC, [pp_type_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_pers_prop_rendition_config_pp_rend_column] FOREIGN KEY ([pp_rend_column]) REFERENCES [dbo].[pers_prop_rendition_columns] ([pp_rend_column]),
    CONSTRAINT [CFK_pers_prop_rendition_config_pp_type_cd] FOREIGN KEY ([pp_type_cd]) REFERENCES [dbo].[pp_type] ([pp_type_cd])
);


GO

