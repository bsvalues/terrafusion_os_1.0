

create procedure PenpadGetSpecialCaseKeyValue_imprv_det_adj
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
			isnull(convert(varchar(12), ida.imprv_det_adj_seq), '')
	from #trigger_table as ida
	join imprv_detail as id on
		id.prop_id = ida.prop_id and
		id.prop_val_yr = ida.prop_val_yr and
		id.imprv_id = ida.imprv_id and
		id.imprv_det_id = ida.imprv_det_id and
		id.sup_num = ida.sup_num and
		id.sale_id = ida.sale_id
	join imprv as i on
		i.prop_id = id.prop_id and
		i.prop_val_yr = id.prop_val_yr and
		i.imprv_id = id.imprv_id and
		i.sup_num = id.sup_num and
		i.sale_id = id.sale_id

set nocount off

GO

