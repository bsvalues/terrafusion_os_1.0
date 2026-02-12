CREATE TABLE [dbo].[meta_field_type] (
    [field_type_id]       INT           NOT NULL,
    [field_name]          VARCHAR (255) NOT NULL,
    [field_regional_name] VARCHAR (255) NULL,
    CONSTRAINT [CPK_meta_field_type] PRIMARY KEY CLUSTERED ([field_type_id] ASC) WITH (FILLFACTOR = 100)
);


GO

