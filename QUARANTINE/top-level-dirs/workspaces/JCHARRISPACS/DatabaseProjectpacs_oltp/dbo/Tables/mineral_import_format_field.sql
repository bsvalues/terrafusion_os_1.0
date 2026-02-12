CREATE TABLE [dbo].[mineral_import_format_field] (
    [appr_company_id]   INT           NOT NULL,
    [prop_type_cd]      CHAR (5)      NOT NULL,
    [format_type_cd]    VARCHAR (10)  NOT NULL,
    [field_name]        VARCHAR (100) NOT NULL,
    [field_description] VARCHAR (100) NOT NULL,
    CONSTRAINT [CPK_mineral_import_format_field] PRIMARY KEY CLUSTERED ([appr_company_id] ASC, [prop_type_cd] ASC, [format_type_cd] ASC, [field_name] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_mineral_import_format_field_appr_company_id] FOREIGN KEY ([appr_company_id]) REFERENCES [dbo].[appr_company] ([appr_company_id]),
    CONSTRAINT [CFK_mineral_import_format_field_prop_type_cd_format_type_cd] FOREIGN KEY ([prop_type_cd], [format_type_cd]) REFERENCES [dbo].[mineral_import_prop_format] ([prop_type_cd], [format_type_cd])
);


GO

