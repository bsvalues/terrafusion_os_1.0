CREATE TABLE [dbo].[imprv_sched_detail_comp] (
    [imprv_det_meth_cd]      VARCHAR (5)     NOT NULL,
    [imprv_seg_type_cd]      VARCHAR (10)    NOT NULL,
    [imprv_seg_quality_cd]   VARCHAR (10)    NOT NULL,
    [imprv_yr]               NUMERIC (4)     NOT NULL,
    [sqft_max]               NUMERIC (18, 1) NOT NULL,
    [system_adj_factor]      NUMERIC (14, 2) NOT NULL,
    [user_adj_factor]        NUMERIC (14, 2) NOT NULL,
    [use_system_flag]        CHAR (1)        NOT NULL,
    [adj_factor]             AS              (case when [use_system_flag]='T' then [system_adj_factor] else [user_adj_factor] end),
    [midpoint_flag]          CHAR (1)        NOT NULL,
    [szMethod]               VARCHAR (255)   NOT NULL,
    [imprv_det_sub_class_cd] VARCHAR (10)    NOT NULL,
    CONSTRAINT [CPK_imprv_sched_detail_comp] PRIMARY KEY CLUSTERED ([imprv_det_meth_cd] ASC, [imprv_seg_type_cd] ASC, [imprv_seg_quality_cd] ASC, [imprv_yr] ASC, [sqft_max] ASC, [imprv_det_sub_class_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

