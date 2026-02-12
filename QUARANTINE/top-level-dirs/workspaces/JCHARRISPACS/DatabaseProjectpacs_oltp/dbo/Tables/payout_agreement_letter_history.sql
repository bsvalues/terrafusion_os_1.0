CREATE TABLE [dbo].[payout_agreement_letter_history] (
    [letter_history_id]   INT      NOT NULL,
    [payout_agreement_id] INT      NOT NULL,
    [letter_id]           INT      NOT NULL,
    [created_by_id]       INT      NOT NULL,
    [create_date]         DATETIME NOT NULL,
    CONSTRAINT [CPK_payout_agreement_letter_history] PRIMARY KEY CLUSTERED ([letter_history_id] ASC),
    CONSTRAINT [CFK_payout_agreement_letter_history_letter_id] FOREIGN KEY ([letter_id]) REFERENCES [dbo].[letter] ([letter_id]),
    CONSTRAINT [CFK_payout_agreement_letter_history_payout_agreement_id] FOREIGN KEY ([payout_agreement_id]) REFERENCES [dbo].[payout_agreement] ([payout_agreement_id])
);


GO

