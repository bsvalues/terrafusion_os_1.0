

create procedure PenpadGetSpecialCaseKeyValue_land_adj
	@szKeys varchar(512) output
as

set nocount on

	select
		@szKeys =
			rtrim(ld.land_type_cd) + ' - ' +
			rtrim(isnull(ld.land_seg_desc, '')) + ' - ' +
			rtrim(ld.state_cd) + ' - ' +
			convert(varchar(12), la.land_seg_adj_seq) + ' - ' +
			rtrim(isnull(la.land_seg_adj_type, ''))
	from #trigger_table as la
	join land_detail as ld on
		ld.prop_id = la.prop_id and
		ld.prop_val_yr = la.prop_val_yr and
		ld.land_seg_id = la.land_seg_id and
		ld.sup_num = la.sup_num and
		ld.sale_id = la.sale_id

set nocount off

GO

