CREATE TABLE [dbo].[mm_land_misc_code_detail] (
    [mm_id]             INT             NOT NULL,
    [seq_num]           INT             NOT NULL,
    [action]            CHAR (1)        NOT NULL,
    [old_county]        NUMERIC (1)     NULL,
    [old_cycle]         NUMERIC (1)     NULL,
    [old_region]        VARCHAR (5)     NULL,
    [old_hood]          VARCHAR (10)    NULL,
    [old_subset]        VARCHAR (5)     NULL,
    [old_code]          VARCHAR (6)     NULL,
    [new_county]        NUMERIC (1)     NULL,
    [new_cycle]         NUMERIC (1)     NULL,
    [new_region]        VARCHAR (5)     NULL,
    [new_hood]          VARCHAR (10)    NULL,
    [new_subset]        VARCHAR (5)     NULL,
    [new_code]          VARCHAR (6)     NULL,
    [new_value]         NUMERIC (14, 3) NULL,
    [new_index]         NUMERIC (8, 2)  NULL,
    [new_indexed_value] NUMERIC (14)    NULL,
    [num_items]         INT             NOT NULL,
    CONSTRAINT [CPK_mm_land_misc_code_detail] PRIMARY KEY CLUSTERED ([mm_id] ASC, [seq_num] ASC)
);


GO

