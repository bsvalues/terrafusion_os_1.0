CREATE TABLE [dbo].[imprv_det_type] (
    [imprv_det_type_cd]             CHAR (10)    NOT NULL,
    [imprv_det_typ_desc]            VARCHAR (50) NULL,
    [main_area]                     CHAR (1)     NULL,
    [sys_flag]                      CHAR (1)     NULL,
    [comp_sales_main_area_flag]     CHAR (1)     NOT NULL,
    [comp_sales_the_main_area_flag] CHAR (1)     NOT NULL,
    [bUseBaseMAMethod]              BIT          NOT NULL,
    [bUseBaseMAClass]               BIT          NOT NULL,
    [bUseBaseMASubclass]            BIT          NOT NULL,
    [sketch_area_fill_color]        INT          NULL,
    [is_permanent_crop_detail]      BIT          NOT NULL,
    [is_irrigation_detail]          BIT          NOT NULL,
    [is_mchy_n_equip]               BIT          NULL,
    [rc_type]                       CHAR (1)     NULL,
    [bPool]                         BIT          NULL,
    CONSTRAINT [CPK_imprv_det_type] PRIMARY KEY CLUSTERED ([imprv_det_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_comp_sales_main_area_flag]
    ON [dbo].[imprv_det_type]([comp_sales_main_area_flag] ASC) WITH (FILLFACTOR = 90);


GO

