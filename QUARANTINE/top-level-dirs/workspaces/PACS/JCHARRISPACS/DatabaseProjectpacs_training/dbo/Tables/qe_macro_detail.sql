CREATE TABLE [dbo].[qe_macro_detail] (
    [macro_id]       INT            NOT NULL,
    [func_key]       INT            NOT NULL,
    [seq_num]        INT            NOT NULL,
    [func_key_label] VARCHAR (20)   NULL,
    [type]           VARCHAR (5)    NULL,
    [field_name]     VARCHAR (100)  NULL,
    [item]           VARCHAR (10)   NULL,
    [old_value]      VARCHAR (50)   NULL,
    [new_value]      VARCHAR (50)   NULL,
    [adj_type]       VARCHAR (1)    NULL,
    [action]         VARCHAR (1)    NULL,
    [criteria]       VARCHAR (4000) NULL,
    [sql_criteria]   VARCHAR (4000) NULL,
    CONSTRAINT [CPK_qe_macro_detail] PRIMARY KEY CLUSTERED ([macro_id] ASC, [func_key] ASC, [seq_num] ASC) WITH (FILLFACTOR = 90)
);


GO

