CREATE TABLE [dbo].[mh_movement_tax_due] (
    [permit_num]  INT             NOT NULL,
    [entity_id]   INT             NOT NULL,
    [tax_due]     NUMERIC (14, 2) NULL,
    [no_response] VARCHAR (1)     NULL,
    [tax_year]    VARCHAR (20)    NULL,
    CONSTRAINT [CPK_mh_movement_tax_due] PRIMARY KEY CLUSTERED ([permit_num] ASC, [entity_id] ASC) WITH (FILLFACTOR = 90)
);


GO

