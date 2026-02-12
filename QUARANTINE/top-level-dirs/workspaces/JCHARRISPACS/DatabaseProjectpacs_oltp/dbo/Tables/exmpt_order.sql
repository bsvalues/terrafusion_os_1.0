CREATE TABLE [dbo].[exmpt_order] (
    [exmpt_type_cd]   VARCHAR (10) NOT NULL,
    [exmpt_type_desc] VARCHAR (20) NULL,
    [exmpt_order]     INT          NOT NULL,
    [entity_type]     CHAR (1)     NOT NULL,
    CONSTRAINT [CPK_exmpt_order] PRIMARY KEY CLUSTERED ([exmpt_type_cd] ASC, [entity_type] ASC, [exmpt_order] ASC) WITH (FILLFACTOR = 100)
);


GO

