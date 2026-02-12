CREATE TABLE [dbo].[_clientdb_taxing_jurisdiction_detail] (
    [prop_id]             INT              NOT NULL,
    [owner_prop_id]       INT              NOT NULL,
    [sup_yr]              NUMERIC (4)      NOT NULL,
    [owner_id]            INT              NOT NULL,
    [entity_id]           INT              NULL,
    [owner_name]          VARCHAR (70)     NULL,
    [pct_ownership]       NUMERIC (13, 10) NULL,
    [total_market]        NUMERIC (18)     NULL,
    [total_appraised_val] NUMERIC (18)     NULL,
    [total_assessed_val]  NUMERIC (18)     NULL,
    [entity_cd]           VARCHAR (5)      NULL,
    [file_as_name]        VARCHAR (70)     NULL,
    [tax_rate]            NUMERIC (15, 10) NULL,
    [appraised_val]       NUMERIC (18)     NULL,
    [assessed_val]        NUMERIC (18)     NULL,
    [taxable_val]         NUMERIC (18)     NULL,
    [freeze_ceiling]      NUMERIC (14, 2)  NULL,
    [show_values]         VARCHAR (1)      NULL,
    [homesite_val]        NUMERIC (18)     NULL,
    [nonhomesite_val]     NUMERIC (18)     NULL,
    [tax_area_id]         INT              NULL,
    [tax_district_id]     INT              NULL,
    [levy_rate]           NUMERIC (13, 10) NULL,
    [levy_cd]             VARCHAR (10)     NULL,
    [levy_description]    VARCHAR (50)     NULL,
    [taxes]               NUMERIC (14, 2)  NULL,
    [taxes_wo_ex]         NUMERIC (14, 2)  NULL
);


GO

CREATE NONCLUSTERED INDEX [IDX__clientdb_taxing_jurisdiction_detail_sup_yr]
    ON [dbo].[_clientdb_taxing_jurisdiction_detail]([sup_yr] ASC) WITH (FILLFACTOR = 90);


GO

CREATE CLUSTERED INDEX [IX__clientdb_taxing_jurisdiction_detail]
    ON [dbo].[_clientdb_taxing_jurisdiction_detail]([sup_yr] ASC, [prop_id] ASC);


GO

