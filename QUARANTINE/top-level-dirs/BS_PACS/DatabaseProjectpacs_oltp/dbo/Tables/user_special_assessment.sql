CREATE TABLE [dbo].[user_special_assessment] (
    [year]                     NUMERIC (4)     NOT NULL,
    [agency_id]                INT             NOT NULL,
    [nwa_nonforestparcel_rate] DECIMAL (18, 4) NULL,
    [nwa_nonforestacre_rate]   DECIMAL (18, 4) NULL,
    [nwa_forestparcel_rate]    DECIMAL (18, 4) NULL,
    [nwa_forestacre_rate]      DECIMAL (18, 4) NULL,
    PRIMARY KEY CLUSTERED ([year] ASC, [agency_id] ASC)
);


GO

