CREATE TABLE [dbo].[split_merge_prop_info] (
    [Split_merge_id] INT            NOT NULL,
    [Prop_id]        INT            NOT NULL,
    [Year]           INT            NOT NULL,
    [Sup_num]        INT            NOT NULL,
    [Updated_table]  VARCHAR (50)   NOT NULL,
    [Updated_column] VARCHAR (50)   NOT NULL,
    [Old_value]      VARCHAR (3000) NULL,
    [New_value]      VARCHAR (3000) NULL,
    CONSTRAINT [CPK_split_merge_prop_info] PRIMARY KEY CLUSTERED ([Split_merge_id] ASC, [Prop_id] ASC, [Year] ASC, [Sup_num] ASC, [Updated_table] ASC, [Updated_column] ASC)
);


GO

