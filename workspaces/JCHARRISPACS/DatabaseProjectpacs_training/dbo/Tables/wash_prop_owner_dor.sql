CREATE TABLE [dbo].[wash_prop_owner_dor] (
    [year]         NUMERIC (4)  NOT NULL,
    [sup_num]      INT          NOT NULL,
    [prop_id]      INT          NOT NULL,
    [owner_id]     INT          NOT NULL,
    [item_type]    CHAR (1)     NOT NULL,
    [item_id]      INT          NOT NULL,
    [exempt_value] NUMERIC (14) NULL,
    CONSTRAINT [CPK_wash_prop_owner_dor] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [item_type] ASC, [item_id] ASC)
);


GO

