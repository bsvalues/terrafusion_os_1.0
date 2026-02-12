CREATE TABLE [dbo].[imprv_sched_attr] (
    [imprv_det_meth_cd]      CHAR (5)     NOT NULL,
    [imprv_det_type_cd]      CHAR (10)    NOT NULL,
    [imprv_det_class_cd]     CHAR (10)    NOT NULL,
    [imprv_yr]               NUMERIC (4)  NOT NULL,
    [imprv_attr_id]          INT          NOT NULL,
    [use_up_for_pct_base]    CHAR (1)     NULL,
    [imprv_det_sub_class_cd] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_imprv_sched_attr] PRIMARY KEY CLUSTERED ([imprv_yr] ASC, [imprv_det_meth_cd] ASC, [imprv_det_type_cd] ASC, [imprv_det_class_cd] ASC, [imprv_det_sub_class_cd] ASC, [imprv_attr_id] ASC) WITH (FILLFACTOR = 90)
);


GO

