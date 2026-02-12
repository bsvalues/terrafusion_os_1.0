CREATE TABLE [dbo].[mm_detail] (
    [mm_id]        INT            NOT NULL,
    [seq_num]      INT            NOT NULL,
    [type]         VARCHAR (5)    NOT NULL,
    [field_name]   VARCHAR (100)  NOT NULL,
    [item]         VARCHAR (20)   NULL,
    [old_value]    VARCHAR (3000) NULL,
    [old_value_id] INT            NULL,
    [new_value]    VARCHAR (3000) NULL,
    [new_value_id] INT            NULL,
    [adj_type]     VARCHAR (1)    NULL,
    [action]       VARCHAR (1)    NULL,
    [criteria]     VARCHAR (512)  NULL,
    [num_items]    INT            NOT NULL,
    CONSTRAINT [CPK_mm_detail] PRIMARY KEY CLUSTERED ([mm_id] ASC, [seq_num] ASC) WITH (FILLFACTOR = 90)
);


GO

