CREATE TABLE [dbo].[freeze_ceiling_verification_run_detail] (
    [run_id]                            INT              NOT NULL,
    [run_type_id]                       INT              NOT NULL,
    [action_indicator]                  INT              NOT NULL,
    [action_message]                    VARCHAR (100)    NOT NULL,
    [report_sort_order]                 INT              NOT NULL,
    [prop_type_cd]                      VARCHAR (5)      NOT NULL,
    [prop_id]                           INT              NOT NULL,
    [owner_id]                          INT              NOT NULL,
    [entity_id]                         INT              NOT NULL,
    [tax_yr]                            NUMERIC (4)      NOT NULL,
    [sup_num]                           INT              NOT NULL,
    [freeze_type]                       VARCHAR (10)     NOT NULL,
    [curr_yr_entity_id]                 INT              NULL,
    [exmpt_type_cd]                     VARCHAR (5)      NULL,
    [qualify_yr]                        NUMERIC (4)      NULL,
    [enable_freeze_ceiling_calculation] BIT              NULL,
    [freeze_flag]                       BIT              NULL,
    [set_initial_freeze_date]           DATETIME         NULL,
    [sup_group_id]                      INT              NULL,
    [sup_status]                        VARCHAR (5)      NULL,
    [udi_parent_prop_id]                INT              NULL,
    [udi_status]                        VARCHAR (5)      NULL,
    [local_exemption_amt]               NUMERIC (14)     NULL,
    [state_exemption_amt]               NUMERIC (14)     NULL,
    [land_hstd_val]                     NUMERIC (14)     NULL,
    [imprv_hstd_val]                    NUMERIC (14)     NULL,
    [ten_percent_cap]                   NUMERIC (14)     NULL,
    [transfer_dt]                       DATETIME         NULL,
    [prev_tax_due]                      NUMERIC (14, 2)  NULL,
    [prev_tax_nofrz]                    NUMERIC (14, 2)  NULL,
    [use_freeze]                        CHAR (1)         NULL,
    [freeze_ceiling]                    NUMERIC (14, 2)  NULL,
    [freeze_yr]                         NUMERIC (4)      NULL,
    [transfer_pct]                      NUMERIC (9, 6)   NULL,
    [transfer_pct_override]             CHAR (1)         NULL,
    [pacs_freeze]                       CHAR (1)         NULL,
    [pacs_freeze_date]                  DATETIME         NULL,
    [pacs_freeze_ceiling]               NUMERIC (14, 2)  NULL,
    [pacs_freeze_run]                   INT              NULL,
    [freeze_override]                   BIT              NULL,
    [prev_yr_owner_id]                  INT              NULL,
    [prev_yr_entity_id]                 INT              NULL,
    [prev_yr_tax_yr]                    NUMERIC (4)      NULL,
    [prev_yr_sup_num]                   INT              NULL,
    [prev_yr_sup_group_id]              INT              NULL,
    [prev_yr_sup_status]                VARCHAR (5)      NULL,
    [prev_yr_exmpt_type_cd]             VARCHAR (5)      NULL,
    [prev_yr_qualify_yr]                NUMERIC (4)      NULL,
    [prev_yr_m_n_o_tax_pct]             NUMERIC (13, 10) NULL,
    [prev_yr_i_n_s_tax_pct]             NUMERIC (13, 10) NULL,
    [prev_yr_local_exemption_amt]       NUMERIC (14)     NULL,
    [prev_yr_state_exemption_amt]       NUMERIC (14)     NULL,
    [prev_yr_land_hstd_val]             NUMERIC (14)     NULL,
    [prev_yr_imprv_hstd_val]            NUMERIC (14)     NULL,
    [prev_yr_ten_percent_cap]           NUMERIC (14)     NULL,
    [prev_yr_transfer_dt]               DATETIME         NULL,
    [prev_yr_prev_tax_due]              NUMERIC (14, 2)  NULL,
    [prev_yr_prev_tax_nofrz]            NUMERIC (14, 2)  NULL,
    [prev_yr_use_freeze]                CHAR (1)         NULL,
    [prev_yr_freeze_ceiling]            NUMERIC (14, 2)  NULL,
    [prev_yr_freeze_yr]                 NUMERIC (4)      NULL,
    [prev_yr_transfer_pct]              NUMERIC (9, 6)   NULL,
    [prev_yr_transfer_pct_override]     CHAR (1)         NULL,
    [prev_yr_pacs_freeze]               CHAR (1)         NULL,
    [prev_yr_pacs_freeze_date]          DATETIME         NULL,
    [prev_yr_pacs_freeze_ceiling]       NUMERIC (14, 2)  NULL,
    [prev_yr_pacs_freeze_run]           INT              NULL,
    [prev_yr_freeze_override]           BIT              NULL,
    [supplement_prop_id]                INT              NULL,
    [udi_supplement]                    CHAR (1)         NULL,
    [freeze_sup_num]                    INT              NULL,
    [missing_freeze]                    BIT              NULL,
    [qualify_year_freeze]               BIT              NULL,
    [missing_freeze_tax_amount]         NUMERIC (14, 2)  NULL,
    [qualify_year_tax_amount]           NUMERIC (14, 2)  NULL,
    [calculated_freeze_assessed_amount] NUMERIC (14)     NULL,
    [calculated_freeze_taxable_amount]  NUMERIC (14)     NULL,
    [calculated_freeze_ceiling]         NUMERIC (14, 2)  NULL,
    [calculated_freeze_yr]              NUMERIC (4)      NULL,
    CONSTRAINT [CPK_freeze_ceiling_verification_run_detail] PRIMARY KEY CLUSTERED ([run_id] ASC, [prop_id] ASC, [owner_id] ASC, [entity_id] ASC, [tax_yr] ASC, [sup_num] ASC, [freeze_type] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_freeze_ceiling_verification_run_detail_run_id] FOREIGN KEY ([run_id]) REFERENCES [dbo].[freeze_ceiling_run] ([run_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_action_indicator]
    ON [dbo].[freeze_ceiling_verification_run_detail]([action_indicator] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_report_sort_order]
    ON [dbo].[freeze_ceiling_verification_run_detail]([report_sort_order] ASC);


GO

