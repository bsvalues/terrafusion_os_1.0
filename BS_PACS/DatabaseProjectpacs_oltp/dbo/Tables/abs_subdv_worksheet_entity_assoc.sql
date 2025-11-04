CREATE TABLE [dbo].[abs_subdv_worksheet_entity_assoc] (
    [abs_subdv_cd] VARCHAR (10) NOT NULL,
    [entity_id]    INT          NOT NULL,
    [entity_type]  VARCHAR (5)  NULL,
    CONSTRAINT [CPK_abs_subdv_worksheet_entity_assoc] PRIMARY KEY CLUSTERED ([abs_subdv_cd] ASC, [entity_id] ASC) WITH (FILLFACTOR = 90)
);


GO

