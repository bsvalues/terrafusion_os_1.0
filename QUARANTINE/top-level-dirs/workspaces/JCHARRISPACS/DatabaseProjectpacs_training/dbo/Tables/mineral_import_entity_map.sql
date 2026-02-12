CREATE TABLE [dbo].[mineral_import_entity_map] (
    [year]                   NUMERIC (4)  NOT NULL,
    [appr_company_id]        INT          NOT NULL,
    [appr_company_entity_cd] VARCHAR (10) NOT NULL,
    [entity_id]              INT          NULL,
    [entity_in_cad]          BIT          CONSTRAINT [CDF_mineral_import_entity_map_entity_in_cad] DEFAULT (0) NOT NULL,
    CONSTRAINT [CFK_mineral_import_entity_map_appr_company_id] FOREIGN KEY ([appr_company_id]) REFERENCES [dbo].[appr_company] ([appr_company_id])
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [idx_year_appr_company_id_appr_company_entity_cd_entity_id]
    ON [dbo].[mineral_import_entity_map]([year] ASC, [appr_company_id] ASC, [appr_company_entity_cd] ASC, [entity_id] ASC) WITH (FILLFACTOR = 90);


GO

