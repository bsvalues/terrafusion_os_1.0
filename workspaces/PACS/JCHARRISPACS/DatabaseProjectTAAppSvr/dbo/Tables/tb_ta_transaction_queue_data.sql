CREATE TABLE [dbo].[tb_ta_transaction_queue_data] (
    [l64TransactionQueueID] BIGINT NOT NULL,
    [binParamsIn]           IMAGE  NULL,
    [binParamsOut]          IMAGE  NULL,
    CONSTRAINT [CPK_tb_ta_transaction_queue_data] PRIMARY KEY CLUSTERED ([l64TransactionQueueID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_tb_ta_transaction_queue_data_l64TransactionQueueID] FOREIGN KEY ([l64TransactionQueueID]) REFERENCES [dbo].[tb_ta_transaction_queue] ([l64TransactionQueueID]) ON DELETE CASCADE
);


GO

