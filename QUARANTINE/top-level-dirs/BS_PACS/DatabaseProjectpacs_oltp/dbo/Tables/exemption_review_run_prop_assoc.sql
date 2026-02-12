CREATE TABLE [dbo].[exemption_review_run_prop_assoc] (
    [run_id]  INT NOT NULL,
    [prop_id] INT NOT NULL,
    CONSTRAINT [CPK_exemption_review_run_prop_assoc] PRIMARY KEY CLUSTERED ([run_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_exemption_review_run_prop_assoc_exemption_review_run] FOREIGN KEY ([run_id]) REFERENCES [dbo].[exemption_review_run] ([run_id]) ON DELETE CASCADE
);


GO

