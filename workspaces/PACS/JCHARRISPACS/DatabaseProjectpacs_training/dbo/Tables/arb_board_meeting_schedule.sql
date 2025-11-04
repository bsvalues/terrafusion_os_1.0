CREATE TABLE [dbo].[arb_board_meeting_schedule] (
    [arb_board_cd] VARCHAR (10)  NOT NULL,
    [meeting_id]   INT           NOT NULL,
    [meeting_tm]   DATETIME      NOT NULL,
    [meeting_desc] VARCHAR (100) NULL,
    CONSTRAINT [CPK_arb_board_meeting_schedule] PRIMARY KEY NONCLUSTERED ([arb_board_cd] ASC, [meeting_id] ASC, [meeting_tm] ASC) WITH (FILLFACTOR = 90)
);


GO

