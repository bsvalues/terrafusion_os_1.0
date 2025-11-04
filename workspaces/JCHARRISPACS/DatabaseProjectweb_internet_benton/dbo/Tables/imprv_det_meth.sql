CREATE TABLE [dbo].[imprv_det_meth] (
    [imprv_det_meth_cd]        CHAR (5)     NOT NULL,
    [imprv_det_meth_dsc]       VARCHAR (50) NULL,
    [sys_flag]                 CHAR (1)     NULL,
    [is_permanent_crop_detail] BIT          NOT NULL,
    [rc_type]                  CHAR (1)     NULL,
    CONSTRAINT [CPK_imprv_det_meth] PRIMARY KEY CLUSTERED ([imprv_det_meth_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

