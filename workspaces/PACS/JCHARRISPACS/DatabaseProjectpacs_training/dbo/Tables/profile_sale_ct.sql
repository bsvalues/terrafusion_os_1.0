CREATE TABLE [dbo].[profile_sale_ct] (
    [run_id]       INT         NOT NULL,
    [detail_id]    INT         NOT NULL,
    [type]         VARCHAR (5) NOT NULL,
    [ratio_50]     INT         NULL,
    [ratio_55]     INT         NULL,
    [ratio_60]     INT         NULL,
    [ratio_65]     INT         NULL,
    [ratio_70]     INT         NULL,
    [ratio_75]     INT         NULL,
    [ratio_80]     INT         NULL,
    [ratio_85]     INT         NULL,
    [ratio_90]     INT         NULL,
    [ratio_95]     INT         NULL,
    [ratio_100]    INT         NULL,
    [ratio_105]    INT         NULL,
    [ratio_110]    INT         NULL,
    [ratio_115]    INT         NULL,
    [ratio_120]    INT         NULL,
    [ratio_125]    INT         NULL,
    [ratio_130]    INT         NULL,
    [ratio_135]    INT         NULL,
    [ratio_135_up] INT         NULL,
    CONSTRAINT [CPK_profile_sale_ct] PRIMARY KEY CLUSTERED ([run_id] ASC, [detail_id] ASC, [type] ASC) WITH (FILLFACTOR = 100)
);


GO

