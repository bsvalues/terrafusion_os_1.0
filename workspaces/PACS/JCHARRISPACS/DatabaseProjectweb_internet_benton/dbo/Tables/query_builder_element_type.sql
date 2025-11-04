CREATE TABLE [dbo].[query_builder_element_type] (
    [lElementType]  INT          NOT NULL,
    [szElementType] VARCHAR (23) NOT NULL,
    CONSTRAINT [CPK_query_builder_element_type] PRIMARY KEY CLUSTERED ([lElementType] ASC) WITH (FILLFACTOR = 100)
);


GO

