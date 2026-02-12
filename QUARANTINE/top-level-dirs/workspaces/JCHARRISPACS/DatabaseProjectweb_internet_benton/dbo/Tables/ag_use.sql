CREATE TABLE [dbo].[ag_use] (
    [ag_use_cd]     CHAR (5)     NOT NULL,
    [ag_use_desc]   VARCHAR (50) NOT NULL,
    [sys_flag]      CHAR (1)     NULL,
    [dfl]           BIT          NULL,
    [timber]        BIT          NULL,
    [reforestation] BIT          NULL,
    [ag]            BIT          NULL,
    [osp]           BIT          NULL,
    [pbrs]          BIT          NOT NULL,
    CONSTRAINT [CPK_ag_use] PRIMARY KEY CLUSTERED ([ag_use_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

