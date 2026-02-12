CREATE TABLE [dbo].[split_assoc] (
    [prop_id]            INT             NOT NULL,
    [split_id]           INT             NOT NULL,
    [split_dt]           DATETIME        NULL,
    [before_legal_acres] NUMERIC (14, 4) NULL,
    [before_legal_desc]  VARCHAR (255)   NULL,
    [before_owner]       VARCHAR (2048)  NULL,
    [after_legal_acres]  NUMERIC (14, 4) NULL,
    [after_legal_desc]   VARCHAR (255)   NULL,
    [after_owner]        VARCHAR (2048)  NULL,
    [year]               NUMERIC (4)     NULL,
    [sup_num]            INT             NULL,
    CONSTRAINT [CPK_split_assoc] PRIMARY KEY CLUSTERED ([prop_id] ASC, [split_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_split_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

