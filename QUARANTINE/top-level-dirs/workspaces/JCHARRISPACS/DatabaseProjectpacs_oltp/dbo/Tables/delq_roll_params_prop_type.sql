CREATE TABLE [dbo].[delq_roll_params_prop_type] (
    [pacs_user_id] INT      NOT NULL,
    [prop_type_cd] CHAR (5) NOT NULL,
    CONSTRAINT [CPK_delq_roll_params_prop_type] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [prop_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

