CREATE TABLE [dbo].[cms_occupancy] (
    [year]           NUMERIC (4)    NOT NULL,
    [code]           VARCHAR (5)    NOT NULL,
    [name]           VARCHAR (50)   NULL,
    [default_height] NUMERIC (5, 2) NULL,
    [default_depth]  NUMERIC (5, 2) NULL,
    CONSTRAINT [CPK_cms_occupancy] PRIMARY KEY CLUSTERED ([year] ASC, [code] ASC)
);


GO

