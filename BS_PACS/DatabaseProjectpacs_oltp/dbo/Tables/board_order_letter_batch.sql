CREATE TABLE [dbo].[board_order_letter_batch] (
    [board_order_letter_batch_id] INT           IDENTITY (1, 1) NOT NULL,
    [batch_date]                  SMALLDATETIME NOT NULL,
    CONSTRAINT [CPK_board_order_letter_batch] PRIMARY KEY CLUSTERED ([board_order_letter_batch_id] ASC) WITH (FILLFACTOR = 100)
);


GO

