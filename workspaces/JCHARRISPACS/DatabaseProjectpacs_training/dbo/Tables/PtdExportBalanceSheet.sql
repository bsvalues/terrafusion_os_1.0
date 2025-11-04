CREATE TABLE [dbo].[PtdExportBalanceSheet] (
    [source]                          VARCHAR (6)  NOT NULL,
    [entity_id]                       INT          NOT NULL,
    [file_as_name]                    VARCHAR (70) NULL,
    [entity_type_cd]                  VARCHAR (5)  NULL,
    [market_val]                      NUMERIC (38) NULL,
    [taxable_val_before_school_limit] NUMERIC (38) NULL,
    [productivity_loss]               NUMERIC (38) NULL,
    [totally_exempt_amt]              NUMERIC (14) NULL,
    [local_ov65_dp_cnt]               INT          NULL,
    [local_ov65_dp_amt]               NUMERIC (14) NULL,
    [local_hs_cnt]                    INT          NULL,
    [local_hs_amt]                    NUMERIC (14) NULL,
    [state_ov65_dp_cnt]               INT          NULL,
    [state_ov65_dp_amt]               NUMERIC (14) NULL,
    [state_hs_cnt]                    INT          NULL,
    [state_hs_amt]                    NUMERIC (14) NULL,
    [dv_cnt]                          INT          NULL,
    [dv_amt]                          NUMERIC (14) NULL,
    [fr_cnt]                          INT          NULL,
    [fr_amt]                          NUMERIC (14) NULL,
    [pc_cnt]                          INT          NULL,
    [pc_amt]                          NUMERIC (14) NULL,
    [historical_cnt]                  INT          NULL,
    [historical_amt]                  NUMERIC (14) NULL,
    [ab_cnt]                          INT          NULL,
    [ab_amt]                          NUMERIC (14) NULL,
    [ten_percent_cap]                 NUMERIC (14) NULL,
    [dataset_id]                      BIGINT       NOT NULL
);


GO

