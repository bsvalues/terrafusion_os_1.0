CREATE TABLE [dbo].[appr_notice_prop_list_bill] (
    [notice_yr]        NUMERIC (4)      NOT NULL,
    [notice_num]       INT              NOT NULL,
    [prop_id]          INT              NOT NULL,
    [sup_num]          INT              NOT NULL,
    [sup_yr]           NUMERIC (4)      NOT NULL,
    [owner_id]         INT              NOT NULL,
    [entity_id]        INT              NOT NULL,
    [bill_m_n_o]       NUMERIC (14, 2)  NULL,
    [bill_i_n_s]       NUMERIC (14, 2)  NULL,
    [assessed_val]     NUMERIC (14, 2)  NULL,
    [taxable_val]      NUMERIC (14, 2)  NULL,
    [tax_rate]         NUMERIC (13, 10) NULL,
    [prev_taxable_val] NUMERIC (14, 2)  NULL,
    [freeze_yr]        NUMERIC (4)      NULL,
    [freeze_ceiling]   NUMERIC (14, 2)  NULL,
    [use_freeze]       CHAR (1)         NULL
);


GO

CREATE CLUSTERED INDEX [idx_notice_yr_notice_num_prop_id_sup_yr_sup_num_owner_id_entity_id]
    ON [dbo].[appr_notice_prop_list_bill]([notice_yr] ASC, [notice_num] ASC, [prop_id] ASC, [sup_yr] ASC, [sup_num] ASC, [owner_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100);


GO

