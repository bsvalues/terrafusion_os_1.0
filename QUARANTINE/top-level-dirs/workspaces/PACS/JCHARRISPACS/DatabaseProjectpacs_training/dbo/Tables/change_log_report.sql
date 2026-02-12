CREATE TABLE [dbo].[change_log_report] (
    [lKey]               BIGINT        IDENTITY (1, 1) NOT NULL,
    [lReportPacsUserID]  INT           NOT NULL,
    [chg_id]             INT           NOT NULL,
    [chg_pacs_user_id]   INT           NOT NULL,
    [chg_sql_account]    VARCHAR (50)  NOT NULL,
    [chg_client_machine] VARCHAR (50)  NOT NULL,
    [chg_dt_tm]          DATETIME      NOT NULL,
    [chg_type]           CHAR (1)      NOT NULL,
    [chg_before_val]     VARCHAR (255) NULL,
    [chg_after_val]      VARCHAR (255) NULL,
    [ref_id]             VARCHAR (255) NULL,
    [chg_table]          VARCHAR (128) NOT NULL,
    [chg_column]         VARCHAR (128) NOT NULL,
    [chg_column_desc]    VARCHAR (100) NULL,
    [pacs_user_name]     VARCHAR (30)  NULL,
    [chg_acct_id]        INT           NOT NULL,
    [chg_by_prop_id]     INT           NOT NULL,
    [prop_val_yr]        INT           NOT NULL,
    [sup_num]            INT           NOT NULL,
    [chg_of_owner_id]    INT           NOT NULL,
    [chg_bldg_permit_id] INT           NOT NULL,
    [chg_arb_case_id]    INT           NOT NULL,
    [chg_arb_yr]         INT           NOT NULL,
    [str_chg_dt_tm]      VARCHAR (50)  NOT NULL,
    CONSTRAINT [CPK_change_log_report] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

