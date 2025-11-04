CREATE TABLE [dbo].[arb_appr_meeting_schedule] (
    [appraiser_id] INT           NOT NULL,
    [meeting_id]   INT           NOT NULL,
    [meeting_tm]   DATETIME      NOT NULL,
    [meeting_desc] VARCHAR (500) NULL,
    CONSTRAINT [CPK_arb_appr_meeting_schedule] PRIMARY KEY NONCLUSTERED ([appraiser_id] ASC, [meeting_id] ASC, [meeting_tm] ASC) WITH (FILLFACTOR = 90)
);


GO

