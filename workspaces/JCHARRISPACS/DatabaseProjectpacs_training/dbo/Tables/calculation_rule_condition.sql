CREATE TABLE [dbo].[calculation_rule_condition] (
    [condition_id]           INT           NOT NULL,
    [rule_id]                INT           NOT NULL,
    [condition_order]        INT           NOT NULL,
    [result_expression_id]   INT           NULL,
    [result_table_dot_field] VARCHAR (255) NULL,
    [result_constant]        VARCHAR (255) NULL,
    [result_function]        INT           CONSTRAINT [CDF_calculation_rule_condition_result_function] DEFAULT ((0)) NOT NULL,
    [result_parameter]       VARCHAR (100) NULL,
    CONSTRAINT [CPK_calculation_rule_condition] PRIMARY KEY CLUSTERED ([condition_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_calculation_rule_condition_result] CHECK ([result_expression_id] IS NOT NULL AND [result_table_dot_field] IS NULL AND [result_constant] IS NULL OR [result_expression_id] IS NULL AND [result_table_dot_field] IS NOT NULL AND [result_constant] IS NULL OR [result_expression_id] IS NULL AND [result_table_dot_field] IS NULL AND [result_constant] IS NOT NULL),
    CONSTRAINT [CFK_calculation_rule_condition_rule_id] FOREIGN KEY ([rule_id]) REFERENCES [dbo].[calculation_rule] ([rule_id]) ON DELETE CASCADE
);


GO

