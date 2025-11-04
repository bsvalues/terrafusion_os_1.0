CREATE TABLE [dbo].[delq_roll_params_adjust_cd] (
    [pacs_user_id]   INT          NOT NULL,
    [bill_adjust_cd] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_delq_roll_params_adjust_cd] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [bill_adjust_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

