CREATE TABLE [dbo].[query_builder_query_wherecriteria] (
    [lQueryID]                INT           NOT NULL,
    [lOrder]                  INT           NOT NULL,
    [lUniqueColumnID]         INT           NOT NULL,
    [lComparisonOperator]     INT           NOT NULL,
    [lBooleanOperator]        INT           NOT NULL,
    [lTable]                  INT           NOT NULL,
    [lUniqueColumnID_Operand] INT           NOT NULL,
    [lTable_Operand]          INT           NOT NULL,
    [bNullOperand]            BIT           NOT NULL,
    [szOperand1]              VARCHAR (255) NOT NULL,
    [szOperand2]              VARCHAR (255) NOT NULL,
    [lBetweenOperandColumn1]  INT           NOT NULL,
    [lBetweenOperandColumn2]  INT           NOT NULL,
    [lBetweenOperandTable1]   INT           NOT NULL,
    [lBetweenOperandTable2]   INT           NOT NULL,
    CONSTRAINT [CPK_query_builder_query_wherecriteria] PRIMARY KEY CLUSTERED ([lQueryID] ASC, [lOrder] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_query_builder_query_wherecriteria_lQueryID] FOREIGN KEY ([lQueryID]) REFERENCES [dbo].[query_builder_query] ([lQueryID]) ON DELETE CASCADE
);


GO

