CREATE TABLE [dbo].[autopay_ownership_change] (
    [run_id]            INT          NOT NULL,
    [create_date]       DATETIME     NOT NULL,
    [created_by]        VARCHAR (32) NOT NULL,
    [last_printed_date] DATETIME     NULL,
    [last_printed_by]   VARCHAR (32) NULL,
    CONSTRAINT [CPK_autopay_ownership_change] PRIMARY KEY CLUSTERED ([run_id] ASC)
);


GO

