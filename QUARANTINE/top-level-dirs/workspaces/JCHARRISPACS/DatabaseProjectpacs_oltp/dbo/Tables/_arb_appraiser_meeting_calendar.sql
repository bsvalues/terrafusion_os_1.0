CREATE TABLE [dbo].[_arb_appraiser_meeting_calendar] (
    [calendar_id]         INT      IDENTITY (1, 1) NOT NULL,
    [appraiser_id]        INT      NOT NULL,
    [calendar_start_time] DATETIME NOT NULL,
    [calendar_end_time]   DATETIME NOT NULL,
    CONSTRAINT [CPK__arb_appraiser_meeting_calendar] PRIMARY KEY CLUSTERED ([calendar_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK__arb_appraiser_meeting_calendar_appraiser_id] FOREIGN KEY ([appraiser_id]) REFERENCES [dbo].[appraiser] ([appraiser_id])
);


GO

