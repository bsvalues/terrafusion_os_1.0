CREATE TABLE [dbo].[permanent_crop_trellis_type] (
    [trellis_cd]   VARCHAR (15) NOT NULL,
    [trellis_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_permanent_crop_trellis_type] PRIMARY KEY CLUSTERED ([trellis_cd] ASC)
);


GO

