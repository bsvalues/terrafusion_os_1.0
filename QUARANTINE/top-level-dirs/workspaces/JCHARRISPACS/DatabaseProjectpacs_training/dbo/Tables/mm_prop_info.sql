CREATE TABLE [dbo].[mm_prop_info] (
    [mm_id]          INT            NOT NULL,
    [seq_num]        INT            NOT NULL,
    [prop_id]        INT            NOT NULL,
    [type]           VARCHAR (5)    NOT NULL,
    [field_name]     VARCHAR (100)  NOT NULL,
    [updated_table]  VARCHAR (50)   NOT NULL,
    [updated_column] VARCHAR (50)   NOT NULL,
    [updated_id]     VARCHAR (20)   NOT NULL,
    [year]           NUMERIC (4)    NOT NULL,
    [sup_num]        INT            NOT NULL,
    [old_value]      VARCHAR (3000) NULL,
    [old_value_id]   INT            NULL,
    [new_value]      VARCHAR (3000) NULL,
    [new_value_id]   INT            NULL,
    [undo_failed]    BIT            DEFAULT ((0)) NOT NULL,
    [supplemented]   BIT            DEFAULT ((0)) NOT NULL,
    [parent_id]      INT            NOT NULL,
    CONSTRAINT [CPK_mm_prop_info] PRIMARY KEY CLUSTERED ([mm_id] ASC, [seq_num] ASC, [prop_id] ASC, [type] ASC, [field_name] ASC, [updated_table] ASC, [updated_column] ASC, [updated_id] ASC, [year] ASC, [parent_id] ASC)
);


GO

