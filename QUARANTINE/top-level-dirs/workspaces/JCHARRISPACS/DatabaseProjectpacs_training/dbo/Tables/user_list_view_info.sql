CREATE TABLE [dbo].[user_list_view_info] (
    [list_type]             VARCHAR (10) NOT NULL,
    [user_id]               INT          NOT NULL,
    [column_seq]            INT          NOT NULL,
    [order_seq]             INT          NOT NULL,
    [column_width]          INT          NULL,
    [sort_column_indicator] CHAR (1)     NULL,
    [sort_indicator]        CHAR (1)     NULL,
    CONSTRAINT [CPK_user_list_view_info] PRIMARY KEY CLUSTERED ([list_type] ASC, [user_id] ASC, [column_seq] ASC) WITH (FILLFACTOR = 90)
);


GO

