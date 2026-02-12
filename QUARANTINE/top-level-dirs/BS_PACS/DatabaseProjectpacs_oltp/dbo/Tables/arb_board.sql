CREATE TABLE [dbo].[arb_board] (
    [arb_board_cd]             VARCHAR (10)  NOT NULL,
    [arb_board_desc]           VARCHAR (50)  NULL,
    [arb_board_members]        INT           NULL,
    [arb_board_begin_date]     DATETIME      NULL,
    [arb_board_end_date]       DATETIME      NULL,
    [arb_board_begin_time]     DATETIME      NULL,
    [arb_board_end_time]       DATETIME      NULL,
    [arb_board_monday]         CHAR (1)      NULL,
    [arb_board_tuesday]        CHAR (1)      NULL,
    [arb_board_wednesday]      CHAR (1)      NULL,
    [arb_board_thursday]       CHAR (1)      NULL,
    [arb_board_friday]         CHAR (1)      NULL,
    [arb_board_comments]       VARCHAR (512) NULL,
    [arb_board_meeting_length] INT           NULL,
    CONSTRAINT [CPK_arb_board] PRIMARY KEY NONCLUSTERED ([arb_board_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

