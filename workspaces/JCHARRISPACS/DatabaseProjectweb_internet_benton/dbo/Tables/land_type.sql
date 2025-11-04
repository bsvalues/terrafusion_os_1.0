CREATE TABLE [dbo].[land_type] (
    [land_type_cd]         CHAR (10)    NOT NULL,
    [land_type_desc]       VARCHAR (50) NULL,
    [sys_flag]             CHAR (1)     NULL,
    [ag_or_wild_or_timber] CHAR (1)     NULL,
    [state_land_type_desc] VARCHAR (30) NULL,
    [is_permanent_crop]    BIT          NOT NULL,
    [rc_type]              CHAR (1)     NULL,
    CONSTRAINT [CPK_land_type] PRIMARY KEY CLUSTERED ([land_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

