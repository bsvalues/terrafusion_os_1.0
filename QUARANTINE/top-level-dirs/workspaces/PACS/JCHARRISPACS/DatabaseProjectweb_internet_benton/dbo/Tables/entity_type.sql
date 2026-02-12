CREATE TABLE [dbo].[entity_type] (
    [entity_type_cd]   CHAR (5)     NOT NULL,
    [entity_type_desc] VARCHAR (50) NOT NULL,
    [sys_flag]         CHAR (1)     NULL,
    CONSTRAINT [CPK_entity_type] PRIMARY KEY CLUSTERED ([entity_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

