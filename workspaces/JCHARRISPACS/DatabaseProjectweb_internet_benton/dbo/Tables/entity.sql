CREATE TABLE [dbo].[entity] (
    [entity_id]              INT             NOT NULL,
    [entity_cd]              CHAR (5)        NOT NULL,
    [entity_type_cd]         CHAR (5)        NOT NULL,
    [entity_disb_bal]        NUMERIC (14, 2) NULL,
    [taxing_unit_num]        VARCHAR (50)    NULL,
    [mbl_hm_submission]      CHAR (1)        NULL,
    [freeports_allowed]      CHAR (1)        NULL,
    [ptd_multi_unit]         CHAR (1)        NULL,
    [appr_company_entity_cd] CHAR (5)        NULL,
    [refund_default_flag]    CHAR (1)        NULL,
    [weed_control]           CHAR (1)        NULL,
    [fiscal_begin_date]      DATETIME        NULL,
    [fiscal_end_date]        DATETIME        NULL,
    [fiscal_year]            VARCHAR (10)    NULL,
    [county_taxing_unit_ind] VARCHAR (1)     NULL,
    [collector_id]           INT             NULL,
    [rendition_entity]       BIT             NULL,
    [enable_timber_78]       BIT             CONSTRAINT [DF_entity_enable_timber_78] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_entity] PRIMARY KEY CLUSTERED ([entity_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_entity_type_cd]
    ON [dbo].[entity]([entity_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_taxing_unit_num]
    ON [dbo].[entity]([taxing_unit_num] ASC) WITH (FILLFACTOR = 90);


GO

