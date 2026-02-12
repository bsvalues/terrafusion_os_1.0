CREATE TABLE [dbo].[distribution_transaction_list] (
    [dataset_id]            INT             NOT NULL,
    [segment_id]            INT             NULL,
    [posted_transaction_id] INT             NOT NULL,
    [transaction_id]        INT             NOT NULL,
    [trans_group_id]        INT             NOT NULL,
    [base_amount]           NUMERIC (14, 2) NOT NULL,
    [base_amount_pd]        NUMERIC (14, 2) NOT NULL,
    [penalty_amount_pd]     NUMERIC (14, 2) NOT NULL,
    [interest_amount_pd]    NUMERIC (14, 2) NOT NULL,
    [bond_interest_pd]      NUMERIC (14, 2) NOT NULL,
    [transaction_type]      VARCHAR (10)    NOT NULL,
    [underage_amount_pd]    NUMERIC (14, 2) NOT NULL,
    [overage_amount_pd]     NUMERIC (14, 2) NOT NULL,
    [pacs_user_id]          INT             NOT NULL,
    [transaction_date]      DATETIME        NOT NULL,
    [posted_date]           DATETIME        NOT NULL,
    [effective_date]        DATETIME        NOT NULL,
    [other_amount_pd]       NUMERIC (14, 2) NULL,
    [recorded_date]         DATETIME        NULL,
    [refund_amount_pd]      NUMERIC (14, 2) NOT NULL,
    [core_transaction_type] INT             NOT NULL
);


GO

CREATE CLUSTERED INDEX [idx_dataset_id_segment_id]
    ON [dbo].[distribution_transaction_list]([dataset_id] ASC, [segment_id] ASC);


GO

