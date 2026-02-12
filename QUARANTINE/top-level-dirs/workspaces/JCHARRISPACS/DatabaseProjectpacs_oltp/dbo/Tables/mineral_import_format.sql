CREATE TABLE [dbo].[mineral_import_format] (
    [year]            NUMERIC (4)   NOT NULL,
    [appr_company_id] INT           NOT NULL,
    [prop_type_cd]    CHAR (5)      NOT NULL,
    [format_type_cd]  VARCHAR (10)  NOT NULL,
    [sequence]        INT           NOT NULL,
    [field_name]      VARCHAR (100) NOT NULL,
    [prefix]          VARCHAR (20)  NULL,
    [suffix]          VARCHAR (20)  NULL,
    [delimiter]       VARCHAR (3)   NULL,
    CONSTRAINT [CPK_mineral_import_format] PRIMARY KEY CLUSTERED ([year] ASC, [appr_company_id] ASC, [prop_type_cd] ASC, [format_type_cd] ASC, [sequence] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_mineral_import_format_appr_company_id_prop_type_cd_format_type_cd_field_name] FOREIGN KEY ([appr_company_id], [prop_type_cd], [format_type_cd], [field_name]) REFERENCES [dbo].[mineral_import_format_field] ([appr_company_id], [prop_type_cd], [format_type_cd], [field_name])
);


GO

