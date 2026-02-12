CREATE TABLE [dbo].[msg_inbox_item_data] (
    [item_id]      UNIQUEIDENTIFIER NOT NULL,
    [data_id]      UNIQUEIDENTIFIER NOT NULL,
    [item_data]    VARBINARY (MAX)  NOT NULL,
    [is_file]      BIT              CONSTRAINT [CDF_msg_inbox_item_data_is_file] DEFAULT ((0)) NOT NULL,
    [is_corrupted] BIT              CONSTRAINT [CDF_msg_inbox_item_data_is_corrupted] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_msg_inbox_item_data] PRIMARY KEY CLUSTERED ([item_id] ASC, [data_id] ASC, [is_file] ASC)
);


GO

