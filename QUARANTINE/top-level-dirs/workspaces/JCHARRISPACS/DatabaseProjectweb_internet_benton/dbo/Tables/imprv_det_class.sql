CREATE TABLE [dbo].[imprv_det_class] (
    [imprv_det_class_cd]       CHAR (10)    NOT NULL,
    [imprv_det_cls_desc]       VARCHAR (50) NULL,
    [sys_flag]                 VARCHAR (1)  NULL,
    [is_permanent_crop_detail] BIT          NOT NULL,
    [rc_type]                  CHAR (1)     NULL,
    CONSTRAINT [CPK_imprv_det_class] PRIMARY KEY CLUSTERED ([imprv_det_class_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

