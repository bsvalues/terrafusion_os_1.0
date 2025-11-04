
create procedure ProfileRecalcProperty
	@input_query varchar(2000),
	@input_sup_num int,
	@input_yr numeric(4),
	@input_hood_cd varchar(10),
	@input_pacs_user_id int
as

	declare @strSQL	varchar(4098)

	/* first take care of the neighborhood. This includes clearing out the existing 
	   neighborhood code, and then placing the new one on it. */
	update property_val
	set hood_cd = null
	where hood_cd = @input_hood_cd
	and   prop_val_yr = @input_yr
	and   sup_num = @input_sup_num

	set @strSQL = 'update property_val set hood_cd = ''' + @input_hood_cd + ''''
	set @strSQL = @strSQL + ' where prop_val_yr = ' + convert(varchar(4), @input_yr)
	set @strSQL = @strSQL + ' and   sup_num     = ' + convert(varchar(12), @input_sup_num)
	set @strSQL = @strSQL + ' and   prop_id in (' + @input_query + ')'

	exec(@strSQL)

	delete recalc_prop_list
	where pacs_user_id = convert(bigint, @input_pacs_user_id)

	insert recalc_prop_list (pacs_user_id, prop_id, sup_yr, sup_num)
	select convert(bigint, @input_pacs_user_id), prop_id, @input_yr, @input_sup_num
	from property_val with(nolock)
	where
		prop_val_yr = @input_yr and
		sup_num = @input_sup_num and
		hood_cd = @input_hood_cd

GO

