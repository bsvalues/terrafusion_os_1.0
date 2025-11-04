CREATE TABLE [dbo].[autopay_ownership_change_detail] (
    [id]                 INT          IDENTITY (1, 1) NOT NULL,
    [run_id]             INT          NOT NULL,
    [prop_id]            INT          NOT NULL,
    [transfer_action_cd] VARCHAR (16) NOT NULL,
    [change_date]        DATETIME     NULL,
    [prev_owner_id]      INT          NOT NULL,
    [prev_owner_name]    VARCHAR (70) NULL,
    [curr_owner_id]      INT          NOT NULL,
    [curr_owner_name]    VARCHAR (70) NULL,
    [prev_autopay_id]    INT          CONSTRAINT [CDF_autopay_ownership_change_detail_prev_autopay_id] DEFAULT ((0)) NULL,
    [prev_autopay_name]  VARCHAR (80) CONSTRAINT [CDF_autopay_ownership_change_detail_prev_autopay_name] DEFAULT ('') NULL,
    CONSTRAINT [CPK_autopay_ownership_change_detail] PRIMARY KEY CLUSTERED ([id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'prev_autopay_name value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'autopay_ownership_change_detail', @level2type = N'COLUMN', @level2name = N'prev_autopay_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'prev_autopay_id value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'autopay_ownership_change_detail', @level2type = N'COLUMN', @level2name = N'prev_autopay_id';


GO

