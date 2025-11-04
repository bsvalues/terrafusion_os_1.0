CREATE TABLE [dbo].[udi_system_settings] (
    [id]                         SMALLINT NOT NULL,
    [preserve_original_property] BIT      NOT NULL,
    [sup_type_cd]                CHAR (6) NULL,
    CONSTRAINT [CPK_udi_system_settings] PRIMARY KEY CLUSTERED ([id] ASC) WITH (FILLFACTOR = 100)
);


GO

