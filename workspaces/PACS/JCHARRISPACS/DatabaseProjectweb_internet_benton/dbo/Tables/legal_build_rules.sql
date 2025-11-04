CREATE TABLE [dbo].[legal_build_rules] (
    [abs_subdv_ind] CHAR (1)     NOT NULL,
    [field_cd]      INT          NOT NULL,
    [prefix]        VARCHAR (32) NULL,
    [suffix]        VARCHAR (32) NULL,
    [pos]           INT          NULL,
    [delimiter]     VARCHAR (3)  NULL,
    CONSTRAINT [CPK_legal_build_rules] PRIMARY KEY CLUSTERED ([abs_subdv_ind] ASC, [field_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

