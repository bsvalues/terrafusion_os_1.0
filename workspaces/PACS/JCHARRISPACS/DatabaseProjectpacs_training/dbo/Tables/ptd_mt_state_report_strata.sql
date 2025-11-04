CREATE TABLE [dbo].[ptd_mt_state_report_strata] (
    [entity_id]         VARCHAR (10) NOT NULL,
    [year]              NUMERIC (4)  NOT NULL,
    [as_of_sup_num]     INT          NOT NULL,
    [state_cd]          VARCHAR (5)  NOT NULL,
    [stratum_number]    INT          NOT NULL,
    [stratum_count]     INT          NULL,
    [stratum_total_val] NUMERIC (14) NULL,
    [stratum_high_val]  NUMERIC (14) NULL,
    [appraisal_val_sum] NUMERIC (14) NULL,
    [dataset_id]        BIGINT       NOT NULL,
    CONSTRAINT [CPK_ptd_mt_state_report_strata] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [entity_id] ASC, [year] ASC, [as_of_sup_num] ASC, [state_cd] ASC, [stratum_number] ASC) WITH (FILLFACTOR = 100)
);


GO

