CREATE TABLE [dbo].[_20240516_rbk_DO95365_fin_coll_transaction_assoc] (
    [fin_transaction_id]    INT            NOT NULL,
    [posted_transaction_id] INT            NOT NULL,
    [percentage]            NUMERIC (5, 2) NOT NULL,
    [fee_mr_detail_id]      INT            NULL
);


GO

