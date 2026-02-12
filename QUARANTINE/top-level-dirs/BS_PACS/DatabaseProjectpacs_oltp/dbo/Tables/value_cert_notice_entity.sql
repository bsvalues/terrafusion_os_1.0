CREATE TABLE [dbo].[value_cert_notice_entity] (
    [pacs_user_id] INT           NOT NULL,
    [prop_id]      INT           NOT NULL,
    [per_val_yr]   INT           NULL,
    [owner_id]     INT           NOT NULL,
    [entity_cd]    CHAR (5)      NULL,
    [entity_name]  VARCHAR (255) NULL,
    [land_mkt]     NUMERIC (14)  NULL,
    [land_appr]    NUMERIC (14)  NULL,
    [imprv_mkt]    NUMERIC (14)  NULL,
    [imprv_appr]   NUMERIC (14)  NULL,
    [mkt]          NUMERIC (14)  NULL,
    [appraised]    NUMERIC (14)  NULL,
    [cap]          NUMERIC (14)  NULL,
    [assessed]     NUMERIC (14)  NULL,
    [taxable]      NUMERIC (14)  NULL,
    [entity_id]    INT           NOT NULL,
    [sup_num]      INT           NOT NULL,
    CONSTRAINT [CPK_value_cert_notice_entity] PRIMARY KEY CLUSTERED ([prop_id] ASC, [sup_num] ASC, [owner_id] ASC, [entity_id] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 100)
);


GO

