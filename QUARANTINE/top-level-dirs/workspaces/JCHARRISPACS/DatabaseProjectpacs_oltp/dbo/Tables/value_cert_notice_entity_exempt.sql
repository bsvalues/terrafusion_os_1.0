CREATE TABLE [dbo].[value_cert_notice_entity_exempt] (
    [pacs_user_id]   INT             NOT NULL,
    [prop_id]        INT             NOT NULL,
    [sup_num]        INT             NOT NULL,
    [owner_id]       INT             NOT NULL,
    [entity_id]      INT             NOT NULL,
    [exemp_type_id]  CHAR (5)        NOT NULL,
    [freeze_ceil_mk] NUMERIC (14, 2) NULL,
    [prop_val_yr]    NUMERIC (4)     NOT NULL,
    [amount]         NUMERIC (14)    NULL,
    [freeze_dt]      INT             NULL,
    CONSTRAINT [CPK_value_cert_notice_entity_exempt] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [prop_id] ASC, [sup_num] ASC, [owner_id] ASC, [entity_id] ASC, [exemp_type_id] ASC, [prop_val_yr] ASC) WITH (FILLFACTOR = 90)
);


GO

