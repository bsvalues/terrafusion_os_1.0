CREATE TABLE [dbo].[msg_inbox_item] (
    [item_id]         UNIQUEIDENTIFIER NOT NULL,
    [item_sender]     INT              NOT NULL,
    [item_recipient]  INT              NOT NULL,
    [item_subject]    VARCHAR (255)    NOT NULL,
    [item_date]       DATETIME         NOT NULL,
    [is_read]         BIT              NOT NULL,
    [notification_id] INT              NULL,
    [is_corrupted]    BIT              CONSTRAINT [CDF_msg_inbox_item_is_corrupted] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_msg_inbox_item] PRIMARY KEY NONCLUSTERED ([item_id] ASC) WITH (FILLFACTOR = 90)
);


GO

