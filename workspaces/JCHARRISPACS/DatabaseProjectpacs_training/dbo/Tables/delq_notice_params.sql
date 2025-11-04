CREATE TABLE [dbo].[delq_notice_params] (
    [pacs_user_id] INT          NOT NULL,
    [notice_dt]    DATETIME     NULL,
    [heading]      CHAR (1)     NULL,
    [month1]       VARCHAR (50) NULL,
    [month2]       VARCHAR (50) NULL,
    [month3]       VARCHAR (50) NULL,
    CONSTRAINT [CPK_delq_notice_params] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC) WITH (FILLFACTOR = 90)
);


GO

