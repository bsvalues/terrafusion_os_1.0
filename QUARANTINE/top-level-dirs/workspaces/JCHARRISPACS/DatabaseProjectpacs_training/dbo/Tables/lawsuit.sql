CREATE TABLE [dbo].[lawsuit] (
    [lawsuit_id]        INT            NOT NULL,
    [cause_num]         VARCHAR (50)   NULL,
    [attorney_suit_num] VARCHAR (50)   NULL,
    [court]             VARCHAR (50)   NULL,
    [judge]             VARCHAR (50)   NULL,
    [reason_for_suit]   VARCHAR (2048) NULL,
    [status]            VARCHAR (10)   NULL,
    [date_filed]        DATETIME       NULL,
    [certified_date]    DATETIME       NULL,
    [trial_date]        DATETIME       NULL,
    [comments]          VARCHAR (2048) NULL,
    [jury_type]         VARCHAR (10)   NULL,
    [suite_type]        VARCHAR (10)   NULL,
    [decision_date]     DATETIME       NULL,
    [conference_date]   DATETIME       NULL,
    CONSTRAINT [CPK_lawsuit] PRIMARY KEY CLUSTERED ([lawsuit_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_lawsuit_status] FOREIGN KEY ([status]) REFERENCES [dbo].[lawsuit_status] ([status_cd]),
    CONSTRAINT [CFK_lawsuit_suite_type] FOREIGN KEY ([suite_type]) REFERENCES [dbo].[lawsuit_suit_type] ([suit_type_cd])
);


GO

