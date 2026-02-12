CREATE TABLE [dbo].[ptd_mt_state_report_top_ten] (
    [entity_id]         INT          NOT NULL,
    [year]              NUMERIC (4)  NOT NULL,
    [as_of_sup_num]     INT          NOT NULL,
    [owner_id]          INT          NOT NULL,
    [owner_name]        VARCHAR (70) NULL,
    [total_market_val]  NUMERIC (14) NULL,
    [total_taxable_val] NUMERIC (14) NULL,
    [dataset_id]        BIGINT       NOT NULL,
    CONSTRAINT [CPK_ptd_mt_state_report_top_ten] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [entity_id] ASC, [year] ASC, [as_of_sup_num] ASC, [owner_id] ASC) WITH (FILLFACTOR = 100)
);


GO

