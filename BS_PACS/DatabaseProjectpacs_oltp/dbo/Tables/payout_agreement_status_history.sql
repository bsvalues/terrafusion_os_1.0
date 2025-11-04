CREATE TABLE [dbo].[payout_agreement_status_history] (
    [payout_agreement_id] INT           NOT NULL,
    [status_change_id]    INT           IDENTITY (1, 1) NOT NULL,
    [pacs_user_id]        INT           NOT NULL,
    [comment]             VARCHAR (255) NULL,
    [status_change_date]  DATETIME      NOT NULL,
    CONSTRAINT [CPK_payout_agreement_status_history] PRIMARY KEY CLUSTERED ([payout_agreement_id] ASC, [status_change_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_payout_agreement_status_history_pacs_user_id] FOREIGN KEY ([pacs_user_id]) REFERENCES [dbo].[pacs_user] ([pacs_user_id]),
    CONSTRAINT [CFK_payout_agreement_status_history_payout_agreement_id] FOREIGN KEY ([payout_agreement_id]) REFERENCES [dbo].[payout_agreement] ([payout_agreement_id])
);


GO

