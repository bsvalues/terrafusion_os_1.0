CREATE TABLE [dbo].[curr_use_sub_code] (
    [sub_cd]      VARCHAR (10) NOT NULL,
    [sub_desc]    VARCHAR (30) NOT NULL,
    [curr_use_cd] CHAR (5)     NOT NULL,
    CONSTRAINT [CPK_curr_use_sub_code] PRIMARY KEY CLUSTERED ([sub_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

