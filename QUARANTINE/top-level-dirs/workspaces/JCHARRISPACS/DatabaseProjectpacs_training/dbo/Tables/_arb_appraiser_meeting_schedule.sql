CREATE TABLE [dbo].[_arb_appraiser_meeting_schedule] (
    [appraiser_id]        INT           NOT NULL,
    [meeting_id]          INT           IDENTITY (1, 1) NOT NULL,
    [meeting_start_time]  DATETIME      NOT NULL,
    [meeting_end_time]    DATETIME      NOT NULL,
    [meeting_description] VARCHAR (500) NULL,
    CONSTRAINT [CPK__arb_appraiser_meeting_schedule] PRIMARY KEY CLUSTERED ([meeting_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK__arb_appraiser_meeting_schedule_appraiser_id] FOREIGN KEY ([appraiser_id]) REFERENCES [dbo].[appraiser] ([appraiser_id])
);


GO

