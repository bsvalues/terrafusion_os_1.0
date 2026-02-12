

create procedure RecalcBuildLists
	@lPacsUserID bigint
as

set nocount on

	delete recalc_prop_list_current_division
	where pacs_user_id = @lPacsUserID

	insert recalc_prop_list_current_division (sup_yr, sup_num, prop_id, pacs_user_id)
	select sup_yr, sup_num, prop_id, @lPacsUserID
	from #recalc_prop_list
	order by 1, 2, 3
	
	truncate table #recalc_distinct_prop_list
	insert #recalc_distinct_prop_list (prop_id)
	select distinct prop_id
	from #recalc_prop_list

	truncate table #recalc_history_supp_assoc

	declare @lNumHistoryYears int
	set @lNumHistoryYears = 3

	while ( @lNumHistoryYears > 0 )
	begin
		insert #recalc_history_supp_assoc with(tablockx) (
			prop_val_yr, sup_num, prop_id
		)
		select distinct -- Dupes could happen if the same pid is in the original list more than once with different sup num
			psa.owner_tax_yr, psa.sup_num, psa.prop_id
		from #recalc_prop_list as rpl with(nolock)
		join prop_supp_assoc as psa with(nolock) on
			psa.owner_tax_yr = (rpl.sup_yr - @lNumHistoryYears) and
			psa.prop_id = rpl.prop_id
		/*where not exists ( -- Dupes could happen if the same pid is in the original list more than once with different years
			select rsa.prop_val_yr
			from #recalc_history_supp_assoc as rsa with(tablockx)
			where
				rsa.prop_val_yr = psa.owner_tax_yr and
				rsa.sup_num = psa.sup_num and
				rsa.prop_id = psa.prop_id
		)*/
		order by 1, 2, 3

		set @lNumHistoryYears = @lNumHistoryYears - 1
	end

GO

