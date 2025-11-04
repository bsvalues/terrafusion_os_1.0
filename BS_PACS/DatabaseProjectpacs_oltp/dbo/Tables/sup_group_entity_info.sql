CREATE TABLE [dbo].[sup_group_entity_info] (
    [sup_group_id]    INT              NOT NULL,
    [sup_yr]          NUMERIC (4)      NOT NULL,
    [sup_num]         INT              NOT NULL,
    [data_flag]       BIT              NOT NULL,
    [prop_id]         INT              NOT NULL,
    [entity_id]       INT              NOT NULL,
    [sup_action]      CHAR (1)         NOT NULL,
    [entity_cd]       VARCHAR (5)      NOT NULL,
    [pacs_user_id]    INT              NOT NULL,
    [entity_prop_pct] NUMERIC (13, 10) NULL,
    [statement_id]    NUMERIC (18)     NULL,
    [freeze_info_1]   VARCHAR (20)     NULL,
    [freeze_info_2]   VARCHAR (20)     NULL,
    [assessed]        NUMERIC (14)     NULL,
    [exemptions]      NUMERIC (14)     NULL,
    [taxable]         NUMERIC (14)     NULL,
    [tax]             NUMERIC (14, 2)  NULL,
    CONSTRAINT [CPK_sup_group_entity_info] PRIMARY KEY CLUSTERED ([sup_group_id] ASC, [sup_yr] ASC, [sup_num] ASC, [data_flag] ASC, [prop_id] ASC, [entity_id] ASC, [sup_action] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_sup_group_entity_info_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[entity] ([entity_id]),
    CONSTRAINT [CFK_sup_group_entity_info_sup_group_id_sup_yr_sup_num_data_flag_prop_id] FOREIGN KEY ([sup_group_id], [sup_yr], [sup_num], [data_flag], [prop_id]) REFERENCES [dbo].[sup_group_property_info] ([sup_group_id], [sup_yr], [sup_num], [data_flag], [prop_id])
);


GO

