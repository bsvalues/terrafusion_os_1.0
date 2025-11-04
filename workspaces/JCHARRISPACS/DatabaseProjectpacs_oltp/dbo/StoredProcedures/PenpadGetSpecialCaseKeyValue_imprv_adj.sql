

create procedure PenpadGetSpecialCaseKeyValue_imprv_adj
	@szKeys varchar(512) output
as

set nocount on

	select
		@szKeys =
			rtrim(isnull(i.imprv_type_cd, '')) + ' - ' +
			rtrim(isnull(i.imprv_state_cd, '')) + ' - ' +
			rtrim(isnull(i.imprv_desc, '')) + ' - ' +
			isnull(convert(varchar(12), ia.imprv_adj_seq), '')
	from #trigger_table as ia
	join imprv as i on
		i.prop_id = ia.prop_id and
		i.prop_val_yr = ia.prop_val_yr and
		i.imprv_id = ia.imprv_id and
		i.sup_num = ia.sup_num and
		i.sale_id = ia.sale_id

set nocount off

GO

