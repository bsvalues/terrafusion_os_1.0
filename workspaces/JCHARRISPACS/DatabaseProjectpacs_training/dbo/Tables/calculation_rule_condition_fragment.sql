CREATE TABLE [dbo].[calculation_rule_condition_fragment] (
    [condition_fragment_id]       INT           NOT NULL,
    [condition_id]                INT           NOT NULL,
    [condition_fragment_order]    INT           NOT NULL,
    [operand_one_expression_id]   INT           NULL,
    [operand_one_table_dot_field] VARCHAR (255) NULL,
    [comparison_operator]         VARCHAR (2)   NOT NULL,
    [operand_two_expression_id]   INT           NULL,
    [operand_two_table_dot_field] VARCHAR (255) NULL,
    [operand_two_constant]        VARCHAR (255) NULL,
    [logical_operator]            VARCHAR (3)   NOT NULL,
    [operand_one_function]        INT           CONSTRAINT [CDF_calculation_rule_condition_fragment_operand_one_function] DEFAULT ((0)) NOT NULL,
    [operand_one_parameter]       VARCHAR (100) NULL,
    [operand_two_function]        INT           CONSTRAINT [CDF_calculation_rule_condition_fragment_operand_two_function] DEFAULT ((0)) NOT NULL,
    [operand_two_parameter]       VARCHAR (100) NULL,
    CONSTRAINT [CPK_calculation_rule_condition_fragment] PRIMARY KEY CLUSTERED ([condition_fragment_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_calculation_rule_condition_fragment_comparison_operator] CHECK ([comparison_operator]='>=' OR [comparison_operator]='<=' OR [comparison_operator]='>' OR [comparison_operator]='<' OR [comparison_operator]='=='),
    CONSTRAINT [CCK_calculation_rule_condition_fragment_logical_operator] CHECK ([logical_operator]='OR' OR [logical_operator]='AND'),
    CONSTRAINT [CCK_calculation_rule_condition_fragment_operand_one] CHECK ([operand_one_expression_id] IS NOT NULL AND [operand_one_table_dot_field] IS NULL OR [operand_one_expression_id] IS NULL AND [operand_one_table_dot_field] IS NOT NULL),
    CONSTRAINT [CCK_calculation_rule_condition_fragment_operand_two] CHECK ([operand_two_expression_id] IS NOT NULL AND [operand_two_table_dot_field] IS NULL AND [operand_two_constant] IS NULL OR [operand_two_expression_id] IS NULL AND [operand_two_table_dot_field] IS NOT NULL AND [operand_two_constant] IS NULL OR [operand_two_expression_id] IS NULL AND [operand_two_table_dot_field] IS NULL AND [operand_two_constant] IS NOT NULL),
    CONSTRAINT [CFK_calculation_rule_condition_fragment_condition_id] FOREIGN KEY ([condition_id]) REFERENCES [dbo].[calculation_rule_condition] ([condition_id]) ON DELETE CASCADE
);


GO

