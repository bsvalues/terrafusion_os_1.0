CREATE TABLE [dbo].[mm_adjustment] (
    [mm_id]        INT             NOT NULL,
    [seq_num]      INT             NOT NULL,
    [year]         NUMERIC (4)     NOT NULL,
    [sup_num]      INT             NOT NULL,
    [prop_id]      INT             NOT NULL,
    [adj_id]       INT             NOT NULL,
    [parent_id]    INT             NOT NULL,
    [parent_id2]   INT             NULL,
    [adj_type_cd]  VARCHAR (5)     NOT NULL,
    [adj_desc]     VARCHAR (50)    NULL,
    [adj_percent]  NUMERIC (14, 2) NULL,
    [adj_amount]   NUMERIC (14)    NULL,
    [adj_date]     DATETIME        NULL,
    [year_added]   NUMERIC (4)     NULL,
    [orig_value]   NUMERIC (14)    NULL,
    [econ_life]    NUMERIC (4)     NULL,
    [residual_pct] NUMERIC (14, 2) NULL,
    [adj_method]   CHAR (1)        CONSTRAINT [CDF_mm_adjustment_adj_method] DEFAULT ('A') NOT NULL,
    CONSTRAINT [CPK_mm_adjustment] PRIMARY KEY CLUSTERED ([mm_id] ASC, [seq_num] ASC, [year] ASC, [sup_num] ASC, [prop_id] ASC, [adj_id] ASC, [parent_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Adjustment Method flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mm_adjustment', @level2type = N'COLUMN', @level2name = N'adj_method';


GO

