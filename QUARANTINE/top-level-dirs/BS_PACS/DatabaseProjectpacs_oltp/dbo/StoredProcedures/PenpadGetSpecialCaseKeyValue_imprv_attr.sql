

create procedure PenpadGetSpecialCaseKeyValue_imprv_attr
	@szKeys varchar(512) output
as

set nocount on

	select
		@szKeys =
			rtrim(isnull(i.imprv_type_cd, '')) + ' - ' +
			rtrim(isnull(i.imprv_state_cd, '')) + ' - ' +
			rtrim(isnull(i.imprv_desc, '')) + ' - ' +
			rtrim(id.imprv_det_class_cd) + ' - ' +
			rtrim(id.imprv_det_meth_cd) + ' - ' +
			rtrim(id.imprv_det_type_cd) + ' - ' +
			isnull(convert(varchar(12), id.seq_num), '') + ' - ' +
			isnull(iattr.i_attr_val_cd, '')
	from #trigger_table as iattr
	join imprv_detail as id on
		id.imprv_id = iattr.imprv_id and
		id.prop_id = iattr.prop_id and
		id.imprv_det_id = iattr.imprv_det_id and
		id.prop_val_yr = iattr.prop_val_yr and
		id.sup_num = iattr.sup_num and
		id.sale_id = iattr.sale_id
	join imprv as i on
		i.prop_id = id.prop_id and
		i.prop_val_yr = id.prop_val_yr and
		i.imprv_id = id.imprv_id and
		i.sup_num = id.sup_num and
		i.sale_id = id.sale_id

set nocount off

GO

