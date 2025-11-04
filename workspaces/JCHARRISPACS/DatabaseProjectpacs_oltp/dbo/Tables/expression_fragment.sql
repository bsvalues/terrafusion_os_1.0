CREATE TABLE [dbo].[expression_fragment] (
    [fragment_id]                 INT           NOT NULL,
    [expression_id]               INT           NOT NULL,
    [fragment_order]              INT           NOT NULL,
    [operand_one_table_dot_field] VARCHAR (255) NULL,
    [operand_one_constant]        VARCHAR (255) NULL,
    [math_operator]               CHAR (1)      NOT NULL,
    [operand_two_table_dot_field] VARCHAR (255) NULL,
    [operand_two_constant]        VARCHAR (255) NULL,
    [operand_one_function]        INT           CONSTRAINT [CDF_expression_fragment_operand_one_function] DEFAULT ((0)) NOT NULL,
    [operand_one_parameter]       VARCHAR (100) NULL,
    [operand_two_function]        INT           CONSTRAINT [CDF_expression_fragment_operand_two_function] DEFAULT ((0)) NOT NULL,
    [operand_two_parameter]       VARCHAR (100) NULL,
    CONSTRAINT [CPK_expression_fragment] PRIMARY KEY CLUSTERED ([fragment_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_expression_fragment_math_operator] CHECK ([math_operator]='/' OR [math_operator]='*' OR [math_operator]='-' OR [math_operator]='+'),
    CONSTRAINT [CCK_expression_fragment_operand_one] CHECK ([operand_one_table_dot_field] IS NULL AND [operand_one_constant] IS NOT NULL OR [operand_one_table_dot_field] IS NOT NULL AND [operand_one_constant] IS NULL),
    CONSTRAINT [CCK_expression_fragment_operand_two] CHECK ([operand_two_table_dot_field] IS NULL AND [operand_two_constant] IS NOT NULL OR [operand_two_table_dot_field] IS NOT NULL AND [operand_two_constant] IS NULL),
    CONSTRAINT [CFK_expression_fragment_expression_id] FOREIGN KEY ([expression_id]) REFERENCES [dbo].[expression] ([expression_id]) ON DELETE CASCADE
);


GO

