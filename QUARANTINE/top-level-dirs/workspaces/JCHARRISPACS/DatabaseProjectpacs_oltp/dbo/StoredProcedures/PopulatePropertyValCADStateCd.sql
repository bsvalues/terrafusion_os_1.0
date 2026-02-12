

create procedure PopulatePropertyValCADStateCd
	@input_yr	    numeric(4),
	@input_sup_num	    int,
	@input_prop_id	    int = 0,
	@input_pacs_user_id int = 0,
	@input_query	    varchar(2000) = ''
with recompile
as

set quoted_identifier off

declare @delete_state_cd        		varchar(4096)
declare @delete_state_cd_detail		varchar(4096)
declare @delete_state_cd_summary 	varchar(4096)
declare @delete_state_cd_errors		varchar(4096)
declare @insert_cmd			varchar(4096)
declare @select_cmd			varchar(4096)
declare @strSQL			varchar(4096)
declare @error_type			varchar(5)
declare @error				varchar(100)
declare @ptd_error_type			varchar(5)
declare @ptd_error			varchar(100)
declare @delete_ptd_list		varchar(100)

select @error_type = 'PTDRV'
select @error      = 'The PTD Value does not match the Property Value'

select @ptd_error_type = 'PTDRD'

/******************************************************************************/
/* property_val_cad_state_cd */
/******************************************************************************/
if @input_pacs_user_id <> 0
begin
	delete property_val_cad_state_cd
	from property_val_cad_state_cd as pvsc
	join recalc_ptd_list as rpl on
		rpl.prop_id = pvsc.prop_id and
		rpl.sup_num = pvsc.sup_num and
		rpl.sup_yr = pvsc.prop_val_yr
	where
		pvsc.sup_num = @input_sup_num and
		pvsc.prop_val_yr = @input_yr and
		rpl.pacs_user_id = @input_pacs_user_id
end
else if @input_query <> ''
begin
	select @delete_state_cd = 'delete from property_val_cad_state_cd where sup_num = ' + cast(@input_sup_num as varchar(12)) + 
	' and prop_val_yr = ' + cast(@input_yr as varchar(4))
	select @delete_state_cd = @delete_state_cd + ' and prop_id in (' + @input_query + ')'
	exec(@delete_state_cd)
end
else if @input_prop_id <> 0
begin
	delete property_val_cad_state_cd
	from property_val_cad_state_cd as pvsc
	where
		pvsc.sup_num = @input_sup_num and
		pvsc.prop_val_yr = @input_yr and
		pvsc.prop_id = @input_prop_id
end
else
begin
	delete property_val_cad_state_cd with(tablock)
	from property_val_cad_state_cd as pvsc
	where
		pvsc.prop_val_yr = @input_yr and
		pvsc.sup_num = @input_sup_num
end

--print 'Delete property_val_cad_state_cd finished at ' + convert(varchar(64), getdate(), 109)

/******************************************************************************/
/* #property_val_cad_state_cd_detail */
/******************************************************************************/
create table #property_val_cad_state_cd_detail
(
	prop_id int NULL ,
	type char (5)NULL ,
	state_cd char (5) NULL ,
	imprv_hstd_val numeric(14, 0) NULL ,
	imprv_non_hstd_val numeric(14, 0) NULL ,
	land_hstd_val numeric(14, 0) NULL ,
	land_non_hstd_val numeric(14, 0) NULL ,
	ag_use_val numeric(14, 0) NULL ,
	ag_market numeric(14, 0) NULL ,
	timber_use numeric(14, 0) NULL ,
	timber_market numeric(14, 0) NULL ,
	mineral_val numeric(14, 0) NULL ,
	personal_val numeric(14, 0) NULL ,
	imp_new_val numeric(14, 0) NULL ,
	acres numeric(18, 4) NULL ,
	pp_new_val numeric(14, 0) NULL ,
	land_new_val numeric(14, 0) NULL ,
	ag_acres numeric(18, 4) NULL ,
	effective_front numeric(18, 2) NULL 
)

/*
if @input_pacs_user_id <> 0
begin
	delete property_val_cad_state_cd_detail
	from property_val_cad_state_cd_detail as pvscd
	join recalc_ptd_list as rpl on
		rpl.prop_id = pvscd.prop_id and
		rpl.sup_num = pvscd.sup_num and
		rpl.sup_yr = pvscd.prop_val_yr
	where
		pvscd.sup_num = @input_sup_num and
		pvscd.prop_val_yr = @input_yr and
		rpl.pacs_user_id = @input_pacs_user_id
end
else if @input_query <> ''
begin
	select @delete_state_cd_detail = 'delete from property_val_cad_state_cd_detail where sup_num = ' + cast(@input_sup_num as varchar(12)) +
	' and prop_val_yr = ' + cast(@input_yr as varchar(4))
	select @delete_state_cd_detail = @delete_state_cd_detail + ' and prop_id in (' + @input_query + ')'
	exec(@delete_state_cd_detail)
end
else if @input_prop_id <> 0
begin
	delete property_val_cad_state_cd_detail
	from property_val_cad_state_cd_detail as pvscd
	where
		pvscd.sup_num = @input_sup_num and
		pvscd.prop_val_yr = @input_yr and
		pvscd.prop_id = @input_prop_id
end
else
begin
	delete property_val_cad_state_cd_detail
	from property_val_cad_state_cd_detail as pvscd
	where
		pvscd.sup_num = @input_sup_num and
		pvscd.prop_val_yr = @input_yr
end
*/

/******************************************************************************/
/* #property_val_cad_state_cd_summary */
/******************************************************************************/
create table #property_val_cad_state_cd_summary
(
	prop_id int NULL ,
	imprv_hstd_val numeric(14, 0) NULL ,
	imprv_non_hstd_val numeric(14, 0) NULL ,
	land_hstd_val numeric(14, 0) NULL ,
	land_non_hstd_val numeric(14, 0) NULL ,
	ag_use_val numeric(14, 0) NULL ,
	ag_market numeric(14, 0) NULL ,
	timber_use numeric(14, 0) NULL ,
	timber_market numeric(14, 0) NULL ,
	appraised_val numeric(14, 0) NULL ,
	ten_percent_cap numeric(14, 0) NULL ,
	assessed_val numeric(14, 0) NULL ,
	market_val numeric(14, 0) NULL 
)

/*
if @input_pacs_user_id <> 0
begin
	delete property_val_cad_state_cd_summary
	from property_val_cad_state_cd_summary as pvscs
	join recalc_ptd_list as rpl on
		rpl.prop_id = pvscs.prop_id and
		rpl.sup_num = pvscs.sup_num and
		rpl.sup_yr = pvscs.prop_val_yr
	where
		pvscs.sup_num = @input_sup_num and
		pvscs.prop_val_yr = @input_yr and
		rpl.pacs_user_id = @input_pacs_user_id
end
else if @input_query <> ''
begin
	select @delete_state_cd_summary = 'delete from property_val_cad_state_cd_summary where sup_num = ' + cast(@input_sup_num as varchar(12)) +
	' and prop_val_yr = ' + cast(@input_yr as varchar(4))
	select @delete_state_cd_summary = @delete_state_cd_summary + ' and prop_id in (' + @input_query + ')'
	exec(@delete_state_cd_summary)
end
else if @input_prop_id <> 0
begin
	delete property_val_cad_state_cd_summary
	from property_val_cad_state_cd_summary as pvscs
	where
		pvscs.sup_num = @input_sup_num and
		pvscs.prop_val_yr = @input_yr and
		pvscs.prop_id = @input_prop_id
end
else
begin
	delete property_val_cad_state_cd_summary
	from property_val_cad_state_cd_summary as pvscs
	where
		pvscs.sup_num = @input_sup_num and
		pvscs.prop_val_yr = @input_yr
end
*/

/******************************************************************************/
/* property_recalc_errors */
/******************************************************************************/
if @input_pacs_user_id <> 0
begin
	delete prop_recalc_errors
	from prop_recalc_errors as pre
	join recalc_ptd_list as rpl on
		rpl.prop_id = pre.prop_id and
		rpl.sup_num = pre.sup_num and
		rpl.sup_yr = pre.sup_yr
	where
		pre.sup_num = @input_sup_num and
		pre.sup_yr = @input_yr and
		rpl.pacs_user_id = @input_pacs_user_id and
		(
			pre.error_type = ('''' + @error_type + '''')
			or
			pre.error_type = ('''' + @ptd_error_type + '''')
		)
end
else if @input_query <> ''
begin
	select @delete_state_cd_errors = 'delete from prop_recalc_errors where  sup_num = ' + cast(@input_sup_num as varchar(12)) +
	' and sup_yr = ' + cast(@input_yr as varchar(4)) 
	select @delete_state_cd_errors = @delete_state_cd_errors + ' and prop_id in (' + @input_query + ')'
	select @delete_state_cd_errors = @delete_state_cd_errors + ' and (error_type = ''' + @error_type +  ''' or error_type = ''' + @ptd_error_type + ''')' 
	exec(@delete_state_cd_errors)
end
else if @input_prop_id <> 0
begin
	delete prop_recalc_errors
	from prop_recalc_errors as pre
	where
		pre.sup_num = @input_sup_num and
		pre.sup_yr = @input_yr and
		pre.prop_id = @input_prop_id and
		(
			pre.error_type = ('''' + @error_type + '''')
			or
			pre.error_type = ('''' + @ptd_error_type + '''')
		)
end
else
begin
	delete prop_recalc_errors with(tablock)
	from prop_recalc_errors as pre
	where
		pre.sup_yr = @input_yr and
		pre.sup_num = @input_sup_num and
		(
			pre.error_type = ('''' + @error_type + '''')
			or
			pre.error_type = ('''' + @ptd_error_type + '''')
		)
end

--print 'Delete prop_recalc_errors finished at ' + convert(varchar(64), getdate(), 109)

select @insert_cmd = 'insert into #property_val_cad_state_cd_detail (
prop_id,     
type,  
state_cd, 
imprv_hstd_val,   
imprv_non_hstd_val, 
land_hstd_val,    
land_non_hstd_val, 
ag_use_val,       
ag_market, 
timber_use,
timber_market,       
mineral_val,     
personal_val,
imp_new_val,
ag_acres,
pp_new_val,
land_new_val,
effective_front,
acres )'
/***************/
/* improvement */
/***************/
if @input_pacs_user_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		i.prop_id,
		'I',
		sc.state_cd,
		case i.imprv_homesite
			when 'Y' then sum(isnull(imprv_val,0))
			else 0
		end as imprv_hs_val,
		case i.imprv_homesite
			when 'N' then sum(isnull(imprv_val,0))
			else 0
		end as imprv_non_hs_val,
		0, 0, 0, 0,
		0, 0, 0, 0,
		sum(
			case
				when imp_new_val_override in ('C', 'D', 'O') then IsNull(imp_new_val, 0)
				else 0
			end
		) as imp_new_val,
		0, 0, 0, 0, 0
	from property_val as pv
	join imprv as i on
		pv.prop_id = i.prop_id and
		pv.sup_num = i.sup_num and
		pv.prop_val_yr = i.prop_val_yr
	join state_code as sc on
		i.imprv_state_cd = sc.state_cd
	join recalc_ptd_list as rpl on
		pv.prop_id = rpl.prop_id and
		pv.sup_num = rpl.sup_num and
		pv.prop_val_yr = rpl.sup_yr
	where
		pv.prop_inactive_dt is null and
		i.sale_id = 0 and
		pv.appr_method = 'C' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num and
		rpl.pacs_user_id = @input_pacs_user_id
	group by i.prop_id, sc.state_cd, i.imprv_homesite
end
else if @input_query <> ''
begin
	select @select_cmd = ' select  imprv.prop_id, ''I'', 
	state_code.ptd_state_cd , 
	case imprv.imprv_homesite when ''Y'' then sum(isnull(imprv_val,0)) else 0 end as imprv_hs_val,
	case imprv.imprv_homesite when ''N'' then sum(isnull(imprv_val,0))  else 0 end as imprv_non_hs_val,
	0, 0, 0, 0, 0, 0, 0, 0, 
	sum(case when imp_new_val_override in (''C'', ''D'', ''O'') then IsNull(imp_new_val, 0) else 0 end) as imp_new_val, 0, 0, 0, 0, 0

	from property_val pv, 
		 imprv,
		 state_code
	where pv.prop_id     = imprv.prop_id
	and   pv.sup_num     = imprv.sup_num
	and   pv.prop_val_yr = imprv.prop_val_yr
	and   pv.prop_inactive_dt is null
	and   imprv.imprv_state_cd = state_code.state_cd
	and   imprv.sale_id  = 0 
	and   pv.appr_method  = ''C''
	and   pv.prop_val_yr =  ' + cast(@input_yr as varchar(4))

	select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
	select @select_cmd = @select_cmd + ' group by imprv.prop_id, state_code.ptd_state_cd, imprv.imprv_homesite'   
	exec (@insert_cmd + @select_cmd)
end
else if @input_prop_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		i.prop_id,
		'I',
		sc.state_cd,
		case i.imprv_homesite
			when 'Y' then sum(isnull(imprv_val,0))
			else 0
		end as imprv_hs_val,
		case i.imprv_homesite
			when 'N' then sum(isnull(imprv_val,0))
			else 0
		end as imprv_non_hs_val,
		0, 0, 0, 0,
		0, 0, 0, 0,
		sum(
			case
				when imp_new_val_override in ('C', 'D', 'O') then IsNull(imp_new_val, 0)
				else 0
			end
		) as imp_new_val,
		0, 0, 0, 0, 0
	from property_val as pv
	join imprv as i on
		pv.prop_id = i.prop_id and
		pv.sup_num = i.sup_num and
		pv.prop_val_yr = i.prop_val_yr
	join state_code as sc on
		i.imprv_state_cd = sc.state_cd
	where
		pv.prop_id = @input_prop_id and
		pv.prop_inactive_dt is null and
		i.sale_id  = 0 and
		pv.appr_method  = 'C' and
		pv.prop_val_yr =  @input_yr and
		pv.sup_num = @input_sup_num

	group by i.prop_id, sc.state_cd, i.imprv_homesite
end
else
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		i.prop_id,
		'I',
		sc.state_cd,
		case i.imprv_homesite
			when 'Y' then sum(isnull(imprv_val,0))
			else 0
		end as imprv_hs_val,
		case i.imprv_homesite
			when 'N' then sum(isnull(imprv_val,0))
			else 0
		end as imprv_non_hs_val,
		0, 0, 0, 0,
		0, 0, 0, 0,
		sum(
			case
				when imp_new_val_override in ('C', 'D', 'O') then IsNull(imp_new_val, 0)
				else 0
			end
		) as imp_new_val,
		0, 0, 0, 0, 0
	from property_val as pv
	join imprv as i on
		pv.prop_id = i.prop_id and
		pv.sup_num = i.sup_num and
		pv.prop_val_yr = i.prop_val_yr
	join state_code as sc on
		i.imprv_state_cd = sc.state_cd
	where
		pv.prop_inactive_dt is null and
		i.sale_id  = 0 and
		pv.appr_method  = 'C' and
		pv.prop_val_yr =  @input_yr and
		pv.sup_num = @input_sup_num
	group by i.prop_id, sc.state_cd, i.imprv_homesite
end


/********/
/* land */
/********/
if @input_pacs_user_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		land_detail.prop_id,
		'L',
		state_code.ptd_state_cd,
		0,
		0,
		case
			when land_seg_homesite = 'T' and isnull(ag_apply, 'F') <> 'T'
			then isnull(land_seg_mkt_val,0)
			else 0
		end as land_hs_val,
		case
			when land_seg_homesite = 'F' and isnull(ag_apply, 'F') <> 'T'
			then isnull(land_seg_mkt_val,0)
			else 0
		end as land_non_hs_val,
		case
			when
				ag_apply = 'T' and
				ag_use_cd in ('1D','1D1') and
				ag_val <= land_seg_mkt_val
			then
				isnull(ag_val,0)
			when
				ag_apply = 'T' and
				ag_use_cd in ('1D','1D1') and
				ag_val > land_seg_mkt_val
			then
				isnull(land_seg_mkt_val,0)
			else
				0
		end as ag_use_val,
		case
			when
				ag_apply = 'T' and
				ag_use_cd in ('1D','1D1')
			then
				isnull(land_seg_mkt_val,0)
			else
				0
		end as ag_market,
		case
			when
				ag_apply = 'T' and
				ag_use_cd = 'TIM' and
				ag_val <= land_seg_mkt_val
			then
				isnull(ag_val,0)
			when
				ag_apply = 'T' and
				ag_use_cd = 'TIM' and
				ag_val > land_seg_mkt_val
			then
				isnull(land_seg_mkt_val,0)
			else
				0
		end as timber_use,
		case
			when
				ag_apply = 'T' and
				ag_use_cd = 'TIM'
			then
				isnull(land_seg_mkt_val,0)
			else
				0
		end as timber_market,
		0, 0, 0,
		case
			when
				state_code.ptd_state_cd like 'D%'
			then
				isnull(size_acres, 0)
			else
				0
		end as acres,
		0,
		case
			when
				isnull(land_detail.effective_tax_year, 0) =  @input_yr
			then
				isnull(land_new_val, 0)
			else
				0
		end as new_land_val,
		isnull(effective_front, 0) as effective_front,
		isnull(size_acres, 0) as acres
	from property_val pv
	join land_detail on
		pv.prop_id = land_detail.prop_id and
		pv.sup_num = land_detail.sup_num and
		pv.prop_val_yr = land_detail.prop_val_yr
	join state_code on
		land_detail.state_cd = state_code.state_cd
	join recalc_ptd_list as rpl on
		pv.prop_id = rpl.prop_id and
		pv.sup_num = rpl.sup_num and
		pv.prop_val_yr = rpl.sup_yr
	where
		pv.prop_inactive_dt is null and
		pv.appr_method  = 'C' and
		land_detail.sale_id = 0  and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num and
		rpl.pacs_user_id = @input_pacs_user_id
end
else if @input_query <> ''
begin
	select @select_cmd = 'select  land_detail.prop_id,
		''L'',
		state_code.ptd_state_cd,
		0,
			0,
		case when land_seg_homesite = ''T'' and isnull(ag_apply, ''F'') <> ''T'' then (isnull(land_seg_mkt_val,0)) else 0 end as land_hs_val,
		case when land_seg_homesite = ''F'' and isnull(ag_apply, ''F'') <> ''T''  then (isnull(land_seg_mkt_val,0)) else 0 end as land_non_hs_val,
		case when isnull(ag_apply, ''F'') = ''T'' and ((isnull(ag_use_cd,'''') = ''1D'' or isnull(ag_use_cd,'''') = ''1D1'') 
							  and  (ag_val <= land_seg_mkt_val)) then (isnull(ag_val,0)) 
			 when isnull(ag_apply, ''F'') = ''T'' and ((isnull(ag_use_cd,'''') = ''1D'' or isnull(ag_use_cd,'''') = ''1D1'') 
							  and  (ag_val > land_seg_mkt_val)) then (isnull(land_seg_mkt_val,0)) 
				 else 0 end as ag_use_val,
			case when isnull(ag_apply, ''F'') = ''T'' and (isnull(ag_use_cd,'''') = ''1D'' or isnull(ag_use_cd,'''') = ''1D1'')  
							 then (isnull(land_seg_mkt_val,0)) else 0 end as ag_market,
		case when isnull(ag_apply, ''F'') = ''T'' and ((isnull(ag_use_cd,'''') = ''TIM'') 
							  and  (ag_val <= land_seg_mkt_val)) then (isnull(ag_val,0)) 
			 when isnull(ag_apply, ''F'') = ''T'' and ((isnull(ag_use_cd,'''') = ''TIM'') 
							  and  (ag_val > land_seg_mkt_val)) then (isnull(land_seg_mkt_val,0)) 
				 else 0 end as timber_use,
		case when isnull(ag_apply, ''F'') = ''T'' and isnull(ag_use_cd,'''') = ''TIM'' 
				 then (isnull(land_seg_mkt_val,0)) else 0 end as timber_market,
		0,
		0,
		0,
		case when state_code.ptd_state_cd like ''D%'' then (isnull(size_acres, 0)) else 0 end as acres,

		0,
		case when isnull(land_detail.effective_tax_year, 0) =  ' + cast(@input_yr as varchar(4)) + ' then isnull(land_new_val, 0) else 0  end as new_land_val,
		IsNull(effective_front, 0) as effective_front,
		IsNull(size_acres, 0) as acres

	from property_val pv, 
		 land_detail,
		 state_code
	where pv.prop_id     = land_detail.prop_id
	and   pv.sup_num     = land_detail.sup_num
	and   pv.prop_val_yr = land_detail.prop_val_yr
	and   land_detail.state_cd = state_code.state_cd
	and   pv.prop_inactive_dt is null
	and   pv.appr_method  = ''C''
	and   land_detail.sale_id  = 0 
	and   pv.prop_val_yr =  ' + cast(@input_yr as varchar(4))


	select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
	exec (@insert_cmd + @select_cmd)
end
else if @input_prop_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		land_detail.prop_id,
		'L',
		state_code.ptd_state_cd,
		0,
		0,
		case
			when land_seg_homesite = 'T' and isnull(ag_apply, 'F') <> 'T'
			then isnull(land_seg_mkt_val,0)
			else 0
		end as land_hs_val,
		case
			when land_seg_homesite = 'F' and isnull(ag_apply, 'F') <> 'T'
			then isnull(land_seg_mkt_val,0)
			else 0
		end as land_non_hs_val,
		case
			when
				ag_apply = 'T' and
				ag_use_cd in ('1D','1D1') and
				ag_val <= land_seg_mkt_val
			then
				isnull(ag_val,0)
			when
				ag_apply = 'T' and
				ag_use_cd in ('1D','1D1') and
				ag_val > land_seg_mkt_val
			then
				isnull(land_seg_mkt_val,0)
			else
				0
		end as ag_use_val,
		case
			when
				ag_apply = 'T' and
				ag_use_cd in ('1D','1D1')
			then
				isnull(land_seg_mkt_val,0)
			else
				0
		end as ag_market,
		case
			when
				ag_apply = 'T' and
				ag_use_cd = 'TIM' and
				ag_val <= land_seg_mkt_val
			then
				isnull(ag_val,0)
			when
				ag_apply = 'T' and
				ag_use_cd = 'TIM' and
				ag_val > land_seg_mkt_val
			then
				isnull(land_seg_mkt_val,0)
			else
				0
		end as timber_use,
		case
			when
				ag_apply = 'T' and
				ag_use_cd = 'TIM'
			then
				isnull(land_seg_mkt_val,0)
			else
				0
		end as timber_market,
		0, 0, 0,
		case
			when
				state_code.ptd_state_cd like 'D%'
			then
				isnull(size_acres, 0)
			else
				0
		end as acres,
		0,
		case
			when
				isnull(land_detail.effective_tax_year, 0) =  @input_yr
			then
				isnull(land_new_val, 0)
			else
				0
		end as new_land_val,
		isnull(effective_front, 0) as effective_front,
		isnull(size_acres, 0) as acres
	from property_val pv
	join land_detail on
		pv.prop_id = land_detail.prop_id and
		pv.sup_num = land_detail.sup_num and
		pv.prop_val_yr = land_detail.prop_val_yr
	join state_code on
		land_detail.state_cd = state_code.state_cd
	where
		pv.prop_id = @input_prop_id and
		pv.prop_inactive_dt is null and
		pv.appr_method  = 'C' and
		land_detail.sale_id = 0  and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num
end
else
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		land_detail.prop_id,
		'L',
		state_code.ptd_state_cd,
		0,
		0,
		case
			when land_seg_homesite = 'T' and isnull(ag_apply, 'F') <> 'T'
			then isnull(land_seg_mkt_val,0)
			else 0
		end as land_hs_val,
		case
			when land_seg_homesite = 'F' and isnull(ag_apply, 'F') <> 'T'
			then isnull(land_seg_mkt_val,0)
			else 0
		end as land_non_hs_val,
		case
			when
				ag_apply = 'T' and
				ag_use_cd in ('1D','1D1') and
				ag_val <= land_seg_mkt_val
			then
				isnull(ag_val,0)
			when
				ag_apply = 'T' and
				ag_use_cd in ('1D','1D1') and
				ag_val > land_seg_mkt_val
			then
				isnull(land_seg_mkt_val,0)
			else
				0
		end as ag_use_val,
		case
			when
				ag_apply = 'T' and
				ag_use_cd in ('1D','1D1')
			then
				isnull(land_seg_mkt_val,0)
			else
				0
		end as ag_market,
		case
			when
				ag_apply = 'T' and
				ag_use_cd = 'TIM' and
				ag_val <= land_seg_mkt_val
			then
				isnull(ag_val,0)
			when
				ag_apply = 'T' and
				ag_use_cd = 'TIM' and
				ag_val > land_seg_mkt_val
			then
				isnull(land_seg_mkt_val,0)
			else
				0
		end as timber_use,
		case
			when
				ag_apply = 'T' and
				ag_use_cd = 'TIM'
			then
				isnull(land_seg_mkt_val,0)
			else
				0
		end as timber_market,
		0, 0, 0,
		case
			when
				state_code.ptd_state_cd like 'D%'
			then
				isnull(size_acres, 0)
			else
				0
		end as acres,
		0,
		case
			when
				isnull(land_detail.effective_tax_year, 0) =  @input_yr
			then
				isnull(land_new_val, 0)
			else
				0
		end as new_land_val,
		isnull(effective_front, 0) as effective_front,
		isnull(size_acres, 0) as acres
	from property_val pv
	join land_detail on
		pv.prop_id = land_detail.prop_id and
		pv.sup_num = land_detail.sup_num and
		pv.prop_val_yr = land_detail.prop_val_yr
	join state_code on
		land_detail.state_cd = state_code.state_cd
	where
		pv.prop_inactive_dt is null and
		pv.appr_method  = 'C' and
		land_detail.sale_id = 0  and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num
end

/******************************/
/* personal property segments */
/******************************/
if @input_pacs_user_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pers_prop_seg.prop_id, 
		'P',
		state_code.ptd_state_cd,
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		sum(
			isnull(pers_prop_seg.pp_mkt_val,0)
		),
		0,
		0,
		0,
		case
			when
				isnull(pers_prop_seg.pp_new_val_yr, 0) = @input_yr
			then
				sum(
					isnull(pp_new_val, 0)
				)
			else
				0
		end as pp_new_val,
		0,0
	from property_val pv
	join pers_prop_seg on
		pv.prop_id = pers_prop_seg.prop_id and
		pv.sup_num = pers_prop_seg.sup_num and
		pv.prop_val_yr = pers_prop_seg.prop_val_yr
	join state_code on
		pers_prop_seg.pp_state_cd = state_code.state_cd
	join recalc_ptd_list as rpl on
		pv.prop_id = rpl.prop_id and
		pv.sup_num = rpl.sup_num and
		pv.prop_val_yr = rpl.sup_yr
	where
		pv.prop_inactive_dt is null and
		pv.appr_method  = 'C' and
		pv.sup_num = @input_sup_num and
		pers_prop_seg.sale_id = 0 and
		pers_prop_seg.pp_active_flag = 'T' and
		pers_prop_seg.pp_mkt_val > 0 and
		pers_prop_seg.prop_val_yr = @input_yr and
		rpl.pacs_user_id = @input_pacs_user_id
	group by
		pers_prop_seg.prop_id, state_code.ptd_state_cd,
		pers_prop_seg.pp_new_val_yr
end
else if @input_query <> ''
begin
	select @select_cmd = 'select  pers_prop_seg.prop_id, 
		''P'',
 		state_code.ptd_state_cd ,
		0, 0, 0, 0, 0, 0, 0, 0, 0,
		sum(isnull(pers_prop_seg.pp_mkt_val,0)),
		0,
		0,
		0,
		case when isnull(pers_prop_seg.pp_new_val_yr, 0) =  ' + cast(@input_yr as varchar(4)) + ' then sum(isnull(pp_new_val, 0)) else 0  end as pp_new_val , 0, 0
	from property_val pv, 
		 pers_prop_seg,
		 state_code
	where pv.prop_id     = pers_prop_seg.prop_id
	and   pv.sup_num     = pers_prop_seg.sup_num
	and   pv.prop_val_yr = pers_prop_seg.prop_val_yr
	and   pers_prop_seg.pp_state_cd = state_code.state_cd
	and   pv.prop_inactive_dt is null
	and   pv.appr_method  = ''C''
	and pers_prop_seg.sale_id = 0
	and pers_prop_seg.pp_active_flag = ''T''
	and pers_prop_seg.pp_mkt_val > 0
	and pers_prop_seg.prop_val_yr ='  + cast(@input_yr as varchar(4)) 


	select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
	select @select_cmd = @select_cmd + ' group by pers_prop_seg.prop_id, 
 		state_code.ptd_state_cd ,
		pers_prop_seg.pp_new_val_yr'

	exec (@insert_cmd + @select_cmd)

end
else if @input_prop_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pers_prop_seg.prop_id, 
		'P',
		state_code.ptd_state_cd,
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		sum(
			isnull(pers_prop_seg.pp_mkt_val,0)
		),
		0,
		0,
		0,
		case
			when
				isnull(pers_prop_seg.pp_new_val_yr, 0) = @input_yr
			then
				sum(
					isnull(pp_new_val, 0)
				)
			else
				0
		end as pp_new_val,
		0,0
	from property_val pv
	join pers_prop_seg on
		pv.prop_id = pers_prop_seg.prop_id and
		pv.sup_num = pers_prop_seg.sup_num and
		pv.prop_val_yr = pers_prop_seg.prop_val_yr
	join state_code on
		pers_prop_seg.pp_state_cd = state_code.state_cd
	where
		pv.prop_id = @input_prop_id and
		pv.prop_inactive_dt is null and
		pv.appr_method  = 'C' and
		pv.sup_num = @input_sup_num and
		pers_prop_seg.sale_id = 0 and
		pers_prop_seg.pp_active_flag = 'T' and
		pers_prop_seg.pp_mkt_val > 0 and
		pers_prop_seg.prop_val_yr = @input_yr
	group by
		pers_prop_seg.prop_id, state_code.ptd_state_cd,
		pers_prop_seg.pp_new_val_yr
end
else
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pers_prop_seg.prop_id, 
		'P',
		state_code.ptd_state_cd,
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		sum(
			isnull(pers_prop_seg.pp_mkt_val,0)
		),
		0,
		0,
		0,
		case
			when
				isnull(pers_prop_seg.pp_new_val_yr, 0) = @input_yr
			then
				sum(
					isnull(pp_new_val, 0)
				)
			else
				0
		end as pp_new_val,
		0,0
	from property_val pv
	join pers_prop_seg on
		pv.prop_id = pers_prop_seg.prop_id and
		pv.sup_num = pers_prop_seg.sup_num and
		pv.prop_val_yr = pers_prop_seg.prop_val_yr
	join state_code on
		pers_prop_seg.pp_state_cd = state_code.state_cd
	where
		pv.prop_inactive_dt is null and
		pv.appr_method  = 'C' and
		pv.sup_num = @input_sup_num and
		pers_prop_seg.sale_id = 0 and
		pers_prop_seg.pp_active_flag = 'T' and
		pers_prop_seg.pp_mkt_val > 0 and
		pers_prop_seg.prop_val_yr = @input_yr
	group by
		pers_prop_seg.prop_id, state_code.ptd_state_cd,
		pers_prop_seg.pp_new_val_yr
end


/**********************************/
/* personal property vit segments */
/**********************************/

if @input_pacs_user_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pers_prop_seg.prop_id, 
		'V',
		'S',
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		pv.appraised_val - case
			when
				pers_prop_seg.pp_active_flag = 'T'
			then
				sum(
					isnull(pers_prop_seg.pp_mkt_val,0)
				)
			else 0
		end as market,
		0, 0, 0,
		case
			when
				isnull(pers_prop_seg.pp_new_val_yr, 0) =  @input_yr
			then
				sum(
					isnull(pp_new_val, 0)
				)
			else
				0
		end as pp_new_val,
		0, 0
	from property_val pv
	join pers_prop_seg on
		pv.prop_id = pers_prop_seg.prop_id and
		pv.sup_num = pers_prop_seg.sup_num and
		pv.prop_val_yr = pers_prop_seg.prop_val_yr
	join state_code on
		pers_prop_seg.pp_state_cd = state_code.state_cd
	join recalc_ptd_list as rpl on
		pv.prop_id = rpl.prop_id and
		pv.sup_num = rpl.sup_num and
		pv.prop_val_yr = rpl.sup_yr
	where
		pv.prop_inactive_dt is null and
		pv.vit_flag = 'T' and
		pv.appr_method = 'C' and
		pers_prop_seg.sale_id = 0 and
		pers_prop_seg.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num and
		rpl.pacs_user_id = @input_pacs_user_id
	group by
		pers_prop_seg.prop_id, pv.appraised_val,
		pp_active_flag, pers_prop_seg.pp_new_val_yr
end
else if @input_query <> ''
begin
	select @select_cmd = 'select  pers_prop_seg.prop_id, 
		''V'',
		''S'',
		0, 0, 0, 0,
		0, 0, 0, 0, 0,   
				  pv.appraised_val - case when pers_prop_seg.pp_active_flag = ''T'' then sum(isnull(pers_prop_seg.pp_mkt_val,0)) else 0 end as market,
		0,
		0,
		0,
		case when isnull(pers_prop_seg.pp_new_val_yr, 0) =  ' + cast(@input_yr as varchar(4)) + ' then sum(isnull(pp_new_val, 0)) else 0  end as pp_new_val, 0, 0

	from  property_val pv,
		  pers_prop_seg,
		  state_code
	where pv.prop_id     = pers_prop_seg.prop_id
	and   pv.sup_num     = pers_prop_seg.sup_num
	and   pv.prop_val_yr = pers_prop_seg.prop_val_yr
	and   pers_prop_seg.pp_state_cd = state_code.state_cd
	and   pv.prop_inactive_dt is null
	and   pv.vit_flag = ''T''
	and   pv.appr_method  = ''C''
	and   pers_prop_seg.sale_id = 0


	and pers_prop_seg.prop_val_yr = '  + cast(@input_yr as varchar(4)) 


	select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
	select @select_cmd = @select_cmd + ' group by pers_prop_seg.prop_id, 
		pv.appraised_val,
		pp_active_flag,
		pp_new_val_yr'

	exec (@insert_cmd + @select_cmd)
end
else if @input_prop_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pers_prop_seg.prop_id, 
		'V',
		'S',
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		pv.appraised_val - case
			when
				pers_prop_seg.pp_active_flag = 'T'
			then
				sum(
					isnull(pers_prop_seg.pp_mkt_val,0)
				)
			else 0
		end as market,
		0, 0, 0,
		case
			when
				isnull(pers_prop_seg.pp_new_val_yr, 0) =  @input_yr
			then
				sum(
					isnull(pp_new_val, 0)
				)
			else
				0
		end as pp_new_val,
		0, 0
	from property_val pv
	join pers_prop_seg on
		pv.prop_id = pers_prop_seg.prop_id and
		pv.sup_num = pers_prop_seg.sup_num and
		pv.prop_val_yr = pers_prop_seg.prop_val_yr
	join state_code on
		pers_prop_seg.pp_state_cd = state_code.state_cd
	where
		pv.prop_id = @input_prop_id and
		pv.prop_inactive_dt is null and
		pv.vit_flag = 'T' and
		pv.appr_method = 'C' and
		pers_prop_seg.sale_id = 0 and
		pers_prop_seg.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num

	group by
		pers_prop_seg.prop_id, pv.appraised_val,
		pp_active_flag, pers_prop_seg.pp_new_val_yr
end
else
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pers_prop_seg.prop_id, 
		'V',
		'S',
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		pv.appraised_val - case
			when
				pers_prop_seg.pp_active_flag = 'T'
			then
				sum(
					isnull(pers_prop_seg.pp_mkt_val,0)
				)
			else 0
		end as market,
		0, 0, 0,
		case
			when
				isnull(pers_prop_seg.pp_new_val_yr, 0) =  @input_yr
			then
				sum(
					isnull(pp_new_val, 0)
				)
			else
				0
		end as pp_new_val,
		0, 0
	from property_val pv
	join pers_prop_seg on
		pv.prop_id = pers_prop_seg.prop_id and
		pv.sup_num = pers_prop_seg.sup_num and
		pv.prop_val_yr = pers_prop_seg.prop_val_yr
	join state_code on
		pers_prop_seg.pp_state_cd = state_code.state_cd
	where
		pv.prop_inactive_dt is null and
		pv.vit_flag = 'T' and
		pv.appr_method = 'C' and
		pers_prop_seg.sale_id = 0 and
		pers_prop_seg.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num

	group by
		pers_prop_seg.prop_id, pv.appraised_val,
		pp_active_flag, pers_prop_seg.pp_new_val_yr
end


/******************************************************************/
/* Now handle the VIT property that doesn't have pers_prop_segs...*/
/******************************************************************/

if @input_pacs_user_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pv.prop_id,
		'V',
		'S',
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		sum(
			isnull(appraised_val,0)
		),
		0, 0, 0,
		0, 0, 0
	from property_val pv
	join property on
		pv.prop_id = property.prop_id
	join recalc_ptd_list as rpl on
		pv.prop_id = rpl.prop_id and
		pv.sup_num = rpl.sup_num and
		pv.prop_val_yr = rpl.sup_yr
	left outer join pers_prop_seg as pps on
		pv.prop_id = pps.prop_id and
		pv.sup_num = pps.sup_num and
		pv.prop_val_yr = pps.prop_val_yr
	where
		pv.prop_inactive_dt is null and
		pv.vit_flag = 'T' and
		property.prop_type_cd = 'P' and
		pv.appr_method  = 'C' and
		pps.sale_id is null and
		pps.prop_id is null and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num and
		rpl.pacs_user_id = @input_pacs_user_id
	group by
		pv.prop_id
end
else if @input_query <> ''
begin
	select @select_cmd = 'select  pv.prop_id, 
		''V'',
		''S'',
		0, 0, 0, 0,
		0, 0, 0, 0, 0, 
		sum(isnull(appraised_val,0)),
		0,
		0,
		0,
		0, 0, 0

	from  property_val pv,
		  property
	where pv.prop_inactive_dt is null
	and   pv.vit_flag           = ''T''
	and   pv.prop_id            = property.prop_id
	and   property.prop_type_cd = ''P''
	and   pv.appr_method  = ''C''
	and   not exists (select * 
			from pers_prop_seg
			where prop_id = pv.prop_id
			and   sup_num = pv.sup_num
			and   prop_val_yr = pv.prop_val_yr
			and   sale_id     = 0)
	and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) 


	select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
	select @select_cmd = @select_cmd + ' group by pv.prop_id'

	exec (@insert_cmd + @select_cmd)
end
else if @input_prop_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pv.prop_id,
		'V',
		'S',
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		sum(
			isnull(appraised_val,0)
		),
		0, 0, 0,
		0, 0, 0
	from property_val pv
	join property on
		pv.prop_id = property.prop_id
	left outer join pers_prop_seg as pps on
		pv.prop_id = pps.prop_id and
		pv.sup_num = pps.sup_num and
		pv.prop_val_yr = pps.prop_val_yr
	where
		pv.prop_id = @input_prop_id and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num and
		pv.prop_inactive_dt is null and
		pv.vit_flag = 'T' and
		property.prop_type_cd = 'P' and
		pv.appr_method  = 'C' and
		pps.sale_id is null and
		pps.prop_id is null
	group by
		pv.prop_id
end
else
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pv.prop_id,
		'V',
		'S',
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		sum(
			isnull(appraised_val,0)
		),
		0, 0, 0,
		0, 0, 0
	from property_val pv
	join property on
		pv.prop_id = property.prop_id
	left outer join pers_prop_seg as pps on
		pv.prop_id = pps.prop_id and
		pv.sup_num = pps.sup_num and
		pv.prop_val_yr = pps.prop_val_yr
	where
		pv.prop_inactive_dt is null and
		pv.vit_flag = 'T' and
		property.prop_type_cd = 'P' and
		pv.appr_method  = 'C' and
		pps.sale_id is null and
		pps.prop_id is null and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num
	group by
		pv.prop_id
end

/************************************************************************/
/* Personal Properties that are classified as Mineral, but ARE personal */
/************************************************************************/

if @input_pacs_user_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pv.prop_id,
		'MNP',
		state_code.ptd_state_cd,
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		sum(
			isnull(appraised_val,0)
		),
		0, 0, 0,
		0, 0, 0
	from property_val as pv
	join property on
		pv.prop_id = property.prop_id
	join state_code on
		property.state_cd = state_code.state_cd
	join recalc_ptd_list as rpl on
		pv.prop_id = rpl.prop_id and
		pv.sup_num = rpl.sup_num and
		pv.prop_val_yr = rpl.sup_yr
	where
		pv.prop_inactive_dt is null and
		property.prop_type_cd = 'MN' and
		left(property.state_cd, 1) <> 'G' and
		pv.appr_method  = 'C' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num and
		rpl.pacs_user_id = @input_pacs_user_id
	group by
		pv.prop_id, state_code.ptd_state_cd

end
else if @input_query <> ''
begin
	select @select_cmd = 'select  pv.prop_id, 
		''MNP'',

		state_code.ptd_state_cd,
		0, 0, 0, 0,
		0, 0, 0, 0, 0, 
		sum(isnull(appraised_val,0)),
		0,
		0,
		0,
		0, 0, 0

	from  property_val pv,
		  property,
		  state_code
	where pv.prop_inactive_dt is null
	and   pv.prop_id            = property.prop_id
	and   property.prop_type_cd = ''MN''
	and   property.state_cd     = state_code.state_cd
	and   left(property.state_cd, 1) <> ''G''
	and   pv.appr_method  = ''C''
	and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) 


	select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
	select @select_cmd = @select_cmd + ' group by  pv.prop_id, 
		  state_code.ptd_state_cd'

	exec (@insert_cmd + @select_cmd)
end
else if @input_prop_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pv.prop_id,
		'MNP',
		state_code.ptd_state_cd,
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		sum(
			isnull(appraised_val,0)
		),
		0, 0, 0,
		0, 0, 0
	from property_val as pv
	join property on
		pv.prop_id = property.prop_id
	join state_code on
		property.state_cd = state_code.state_cd
	where
		pv.prop_id = @input_prop_id and
		pv.prop_inactive_dt is null and
		property.prop_type_cd = 'MN' and
		left(property.state_cd, 1) <> 'G' and
		pv.appr_method  = 'C' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num
	group by
		pv.prop_id, state_code.ptd_state_cd
end
else
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pv.prop_id,
		'MNP',
		state_code.ptd_state_cd,
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		sum(
			isnull(appraised_val,0)
		),
		0, 0, 0,
		0, 0, 0
	from property_val as pv
	join property on
		pv.prop_id = property.prop_id
	join state_code on
		property.state_cd = state_code.state_cd
	where
		pv.prop_inactive_dt is null and
		property.prop_type_cd = 'MN' and
		left(property.state_cd, 1) <> 'G' and
		pv.appr_method  = 'C' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num
	group by
		pv.prop_id, state_code.ptd_state_cd
end

/**********************/
/* Mineral Properties */
/**********************/

if @input_pacs_user_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pv.prop_id, 
		'MNP',
		state_code.ptd_state_cd,
		0, 0, 0, 0,
		0, 0, 0, 0, 
		sum(
			isnull(appraised_val,0)
		),
		0,
		0, 0, 0,
		0, 0, 0
	from property_val pv
	join property on
		pv.prop_id = property.prop_id
	join state_code on
		property.state_cd = state_code.state_cd
	join recalc_ptd_list as rpl on
		pv.prop_id = rpl.prop_id and
		pv.sup_num = rpl.sup_num and
		pv.prop_val_yr = rpl.sup_yr
	where
		pv.prop_inactive_dt is null and
		property.prop_type_cd = 'MN' and
		left(property.state_cd, 1) = 'G' and
		pv.appr_method  = 'C' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num and
		rpl.pacs_user_id = @input_pacs_user_id
	group by
		pv.prop_id, state_code.ptd_state_cd

end
else if @input_query <> ''
begin
	select @select_cmd = 'select  pv.prop_id, 
		''MNP'',
		state_code.ptd_state_cd,
		0, 0, 0, 0,
		0, 0, 0, 0, 
		sum(isnull(appraised_val,0)),
			0,
		0,
		0,
		0,
		0, 0, 0

	from  property_val pv,
		  property,
		  state_code
	where pv.prop_inactive_dt is null
	and   pv.prop_id            = property.prop_id
	and   property.prop_type_cd = ''MN''
	and   property.state_cd     = state_code.state_cd
	and   left(property.state_cd, 1) = ''G''
	and   pv.appr_method  = ''C''
	and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) 


	select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
	select @select_cmd = @select_cmd + ' group by  pv.prop_id, 
		  state_code.ptd_state_cd'

	exec (@insert_cmd + @select_cmd)
end
else if @input_prop_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pv.prop_id, 
		'MNP',
		state_code.ptd_state_cd,
		0, 0, 0, 0,
		0, 0, 0, 0, 
		sum(
			isnull(appraised_val,0)
		),
		0,
		0, 0, 0,
		0, 0, 0
	from property_val pv
	join property on
		pv.prop_id = property.prop_id
	join state_code on
		property.state_cd = state_code.state_cd
	where
		pv.prop_id = @input_prop_id and
		pv.prop_inactive_dt is null and
		property.prop_type_cd = 'MN' and
		left(property.state_cd, 1) = 'G' and
		pv.appr_method  = 'C' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num
	group by
		pv.prop_id, state_code.ptd_state_cd
end
else
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pv.prop_id, 
		'MNP',
		state_code.ptd_state_cd,
		0, 0, 0, 0,
		0, 0, 0, 0, 
		sum(
			isnull(appraised_val,0)
		),
		0,
		0, 0, 0,
		0, 0, 0
	from property_val pv
	join property on
		pv.prop_id = property.prop_id
	join state_code on
		property.state_cd = state_code.state_cd
	where
		pv.prop_inactive_dt is null and
		property.prop_type_cd = 'MN' and
		left(property.state_cd, 1) = 'G' and
		pv.appr_method  = 'C' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num
	group by
		pv.prop_id, state_code.ptd_state_cd
end

/**********************************/

/** now populate shared property **/
/**********************************/

if @input_pacs_user_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pv.prop_id,
		'SHA',
		state_code.ptd_state_cd,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'I' and
				homesite_flag = 'T'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'I' and
				isnull(homesite_flag, 'F') = 'F'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				homesite_flag = 'T' and
				ag_use_code is null
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code is null
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code = '1D1'
			then
				isnull(ag_use_val, 0)
			else
				0
		end as ag_use_val,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code = '1D1'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code = 'TIM'
			then
				isnull(ag_use_val, 0)
			else
				0
		end as ag_use_val,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code = 'TIM'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd = 'P'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd = 'MN'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		0,
		case
			when
				state_code.ptd_state_cd like 'D%'
			then
				isnull(acres, 0)
			else
				0
		end as acres,
		0, 0, 0,
		isnull(acres, 0) as acres
	from property_val as pv
	join shared_prop_value on
		pv.prop_id = shared_prop_value.pacs_prop_id and
		pv.prop_val_yr = shared_prop_value.shared_year and
		pv.sup_num = shared_prop_value.sup_num  /*  RK 02042004  */
	join state_code on
		shared_prop_value.state_code = state_code.state_cd
	join property as p on
		pv.prop_id = p.prop_id
	join recalc_ptd_list as rpl on
		pv.prop_id = rpl.prop_id and
		pv.sup_num = rpl.sup_num and
		pv.prop_val_yr = rpl.sup_yr
	where
		pv.prop_inactive_dt is null and
		pv.appr_method  = 'S' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num and
		rpl.pacs_user_id = @input_pacs_user_id
end
else if @input_query <> ''
begin
	select @select_cmd = 'select  pv.prop_id, ''SHA'',
		state_code.ptd_state_cd ,
		case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''I'' and isnull(homesite_flag, ''F'') = ''T'' then (isnull(shared_prop_value.shared_value,0)) else 0 end as shared_value,

		case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''I'' and isnull(homesite_flag, ''F'') = ''F'' then (isnull(shared_prop_value.shared_value,0)) else 0 end as shared_value,
		case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''L'' and isnull(homesite_flag, ''F'') = ''T''  and ag_use_code is null then (isnull(shared_prop_value.shared_value,0)) else 0 end as shared_value,
		case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''L'' and isnull(homesite_flag, ''F'') = ''F''  and ag_use_code is null then (isnull(shared_prop_value.shared_value,0)) else 0 end as shared_value,
		case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''L'' and isnull(homesite_flag, ''F'') = ''F'' and ag_use_code is not null and (ag_use_code = ''1D1'' or ag_use_code = ''1D1'')
										 then (isnull(ag_use_val,0)) else 0 end as ag_use_val,
		case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''L'' and isnull(homesite_flag, ''F'') = ''F'' and (ag_use_code = ''1D1'' or ag_use_code = ''1D1'') then (isnull(shared_prop_value.shared_value,0)) else 0 end as shared_value,







 
		case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''L'' and isnull(homesite_flag, ''F'') = ''F'' and ag_use_code is not null and (ag_use_code = ''TIM'')
										 then (isnull(ag_use_val,0)) else 0 end as ag_use_val,
		case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''L'' and isnull(homesite_flag, ''F'') = ''F'' and (ag_use_code = ''TIM'') then (isnull(shared_prop_value.shared_value,0)) else 0 end as shared_value,
		case when prop_type_cd = ''P'' then (isnull(shared_prop_value.shared_value,0)) else 0 end as shared_value,
		case when prop_type_cd = ''MN''then (isnull(shared_prop_value.shared_value,0)) else 0 end as shared_value,
		0,
		case when state_code.ptd_state_cd like ''D%'' then (isnull(acres, 0)) else 0 end as acres,
		0,
		0, 0, isnull(acres, 0) as acres
	from property_val pv, 
		 shared_prop_value,
		 state_code,
		 property p
	where pv.prop_id     = shared_prop_value.pacs_prop_id
	and   pv.prop_val_yr = shared_prop_value.shared_year
	and   pv.sup_num	 = shared_prop_value.sup_num
	and   pv.prop_inactive_dt is null
	and   pv.appr_method  = ''S''
	and   shared_prop_value.state_code = state_code.state_cd
	and   pv.prop_id = p.prop_id
	and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) 


	select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
	exec (@insert_cmd + @select_cmd)
end
else if @input_prop_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pv.prop_id,
		'SHA',
		state_code.ptd_state_cd,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'I' and
				homesite_flag = 'T'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'I' and
				isnull(homesite_flag, 'F') = 'F'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				homesite_flag = 'T' and
				ag_use_code is null
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code is null
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case

			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code = '1D1'
			then
				isnull(ag_use_val, 0)
			else
				0
		end as ag_use_val,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code = '1D1'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code = 'TIM'
			then
				isnull(ag_use_val, 0)
			else
				0
		end as ag_use_val,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code = 'TIM'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd = 'P'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd = 'MN'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		0,
		case
			when
				state_code.ptd_state_cd like 'D%'
			then
				isnull(acres, 0)
			else
				0
		end as acres,
		0, 0, 0,
		isnull(acres, 0) as acres
	from property_val as pv
	join shared_prop_value on
		pv.prop_id = shared_prop_value.pacs_prop_id and
		pv.prop_val_yr = shared_prop_value.shared_year and
		pv.sup_num = shared_prop_value.sup_num 
	join state_code on
		shared_prop_value.state_code = state_code.state_cd
	join property as p on
		pv.prop_id = p.prop_id
	where
		pv.prop_id = @input_prop_id and
		pv.prop_inactive_dt is null and
		pv.appr_method  = 'S' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num
end
else
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		pv.prop_id,
		'SHA',
		state_code.ptd_state_cd,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'I' and
				homesite_flag = 'T'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'I' and
				isnull(homesite_flag, 'F') = 'F'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				homesite_flag = 'T' and
				ag_use_code is null
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code is null
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code = '1D1'
			then
				isnull(ag_use_val, 0)
			else
				0
		end as ag_use_val,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code = '1D1'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code = 'TIM'

			then
				isnull(ag_use_val, 0)
			else
				0
		end as ag_use_val,
		case
			when
				prop_type_cd <> 'MN' and
				prop_type_cd <> 'P' and
				record_type = 'L' and
				isnull(homesite_flag, 'F') = 'F' and
				ag_use_code = 'TIM'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd = 'P'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		case
			when
				prop_type_cd = 'MN'
			then
				isnull(shared_prop_value.shared_value, 0)
			else
				0
		end as shared_value,
		0,
		case
			when
				state_code.ptd_state_cd like 'D%'
			then
				isnull(acres, 0)
			else
				0
		end as acres,
		0, 0, 0,
		isnull(acres, 0) as acres
	from property_val as pv
	join shared_prop_value on
		pv.prop_id = shared_prop_value.pacs_prop_id and
		pv.prop_val_yr = shared_prop_value.shared_year and 
		pv.sup_num = shared_prop_value.sup_num 
	join state_code on
		shared_prop_value.state_code = state_code.state_cd
	join property as p on
		pv.prop_id = p.prop_id
	where
		pv.prop_inactive_dt is null and
		pv.appr_method  = 'S' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num
end


/*************************************************/
/*** now populate the income valued properties ***/
/*************************************************/

if @input_pacs_user_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		ipa.prop_id,
		'INC',
		(
			select top 1 ptd_state_cd
			from imprv
			join state_code on
				imprv.imprv_state_cd = state_code.state_cd
			where
				prop_id = pv.prop_id
				and   sup_num = pv.sup_num
				and   prop_val_yr = pv.prop_val_yr
				and   sale_id = 0
		) as state_code,
		0, pv.imprv_non_hstd_val,
		0, pv.land_non_hstd_val,
		0, 0, 0, 0, 0, 0, 
		pv.new_val_hs + pv.new_val_nhs, 0, pv.new_val_p, 0, 0, 0
	from income_prop_assoc as ipa
	join property_val as pv on
		ipa.prop_id = pv.prop_id and
		ipa.sup_num = pv.sup_num and
		ipa.prop_val_yr = pv.prop_val_yr
	join recalc_ptd_list as rpl on
		pv.prop_id = rpl.prop_id and
		pv.sup_num = rpl.sup_num and
		pv.prop_val_yr = rpl.sup_yr
	where
		ipa.active_valuation = 'T' and
		pv.appr_method  = 'I' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num and
		rpl.pacs_user_id = @input_pacs_user_id
end
else if @input_query <> ''
begin
	select @select_cmd = ' select  ipa.prop_id, ''INC'', 
	 (select top 1 ptd_state_cd from imprv, state_code
		where imprv.imprv_state_cd = state_code.state_cd
		and   prop_id = pv.prop_id
		and   sup_num = pv.sup_num
		and   prop_val_yr = pv.prop_val_yr
		and   sale_id = 0) as state_code , 
	0,
	pv.imprv_non_hstd_val,
	0, pv.land_non_hstd_val, 0, 0, 0, 0, 0, 0, 
	pv.new_val_hs + pv.new_val_nhs, 0, pv.new_val_p, 0, 0, 0
	from income_prop_assoc ipa, 
		 property_val pv
	where ipa.prop_id = pv.prop_id
	and   ipa.sup_num = pv.sup_num
	and   ipa.prop_val_yr = pv.prop_val_yr
	and   ipa.active_valuation = ''T''
	and   pv.appr_method  = ''I''
	and   pv.prop_val_yr =  ' + cast(@input_yr as varchar(4))

	select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'

	exec(@insert_cmd + @select_cmd)
end
else if @input_prop_id <> 0
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		ipa.prop_id,
		'INC',
		(
			select top 1 ptd_state_cd
			from imprv
			join state_code on
				imprv.imprv_state_cd = state_code.state_cd
			where
				prop_id = pv.prop_id
				and   sup_num = pv.sup_num
				and   prop_val_yr = pv.prop_val_yr
				and   sale_id = 0
		) as state_code,
		0, pv.imprv_non_hstd_val,
		0, pv.land_non_hstd_val,
		0, 0, 0, 0, 0, 0, 
		pv.new_val_hs + pv.new_val_nhs, 0, pv.new_val_p, 0, 0, 0
	from income_prop_assoc as ipa
	join property_val as pv on
		ipa.prop_id = pv.prop_id and
		ipa.sup_num = pv.sup_num and
		ipa.prop_val_yr = pv.prop_val_yr
	where
		ipa.prop_id = @input_prop_id and
		ipa.active_valuation = 'T' and
		pv.appr_method  = 'I' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num
end
else
begin
	insert into #property_val_cad_state_cd_detail
	(
		prop_id,
		type,
		state_cd,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		timber_use,
		timber_market,
		mineral_val,
		personal_val,
		imp_new_val,
		ag_acres,
		pp_new_val,
		land_new_val,
		effective_front,
		acres 
	)
	select
		ipa.prop_id,
		'INC',
		(
			select top 1 ptd_state_cd
			from imprv
			join state_code on
				imprv.imprv_state_cd = state_code.state_cd
			where
				prop_id = pv.prop_id
				and   sup_num = pv.sup_num
				and   prop_val_yr = pv.prop_val_yr
				and   sale_id = 0
		) as state_code,
		0, pv.imprv_non_hstd_val,
		0, pv.land_non_hstd_val,
		0, 0, 0, 0, 0, 0, 
		pv.new_val_hs + pv.new_val_nhs, 0, pv.new_val_p, 0, 0, 0
	from income_prop_assoc as ipa
	join property_val as pv on
		ipa.prop_id = pv.prop_id and
		ipa.sup_num = pv.sup_num and
		ipa.prop_val_yr = pv.prop_val_yr
	where
		ipa.active_valuation = 'T' and
		pv.appr_method  = 'I' and
		pv.prop_val_yr = @input_yr and
		pv.sup_num = @input_sup_num
end

--print 'Finished populating detail at ' + convert(varchar(64), getdate(), 109)

/* Indexes for #property_val_cad_state_cd_detail */
if ( @input_prop_id = 0 )
begin
	/*
		I know, I know ... it shouldn't matter if the index is created for only an individual property ...
		However, I have seen the D to D1 state code update take up to *4.6* seconds on *2* rows
		in the #property_val_cad_state_cd_detail when an individual property is sent to this procedure.
		Without the index, the update takes a few milliseconds.
		- James
	*/
	create nonclustered index idx_state_cd on #property_val_cad_state_cd_detail(state_cd)
end

--print 'Finished creating detail index at ' + convert(varchar(64), getdate(), 109)

/********************************************************/
/*** set the state code to D1 for all ''D'' state codes ***/
/*** that have productivity value                     ***/
/********************************************************/ 

if @input_pacs_user_id <> 0
begin
	update #property_val_cad_state_cd_detail set
		state_cd = 'D1' 
	from #property_val_cad_state_cd_detail
	join recalc_ptd_list as rpl on
		#property_val_cad_state_cd_detail.prop_id = rpl.prop_id and
		rpl.sup_yr = @input_yr and
		rpl.sup_num = @input_sup_num
	where
		ag_use_val + timber_use > 0
		and   state_cd like 'D%'
		and rpl.pacs_user_id = @input_pacs_user_id
end
else if @input_query <> ''
begin
	select @select_cmd = 'update #property_val_cad_state_cd_detail set state_cd = ''D1'' 
		      where prop_id in (' + @input_query + ') and ag_use_val + timber_use > 0
		      and   state_cd like ''D%''

		      '
	exec (@select_cmd)
end
else if @input_prop_id <> 0
begin
	update #property_val_cad_state_cd_detail set
		state_cd = 'D1' 
	where
		prop_id = @input_prop_id and
		ag_use_val + timber_use > 0 and
		state_cd like 'D%'
end
else
begin
	update #property_val_cad_state_cd_detail set
		state_cd = 'D1' 
	where
		ag_use_val + timber_use > 0 and
		state_cd like 'D%'
end

--print 'Finished D to D1 state code update at ' + convert(varchar(64), getdate(), 109)

/********************************************************/
/*** set the state code to D2 for all ''D'' state codes ***/
/*** that do not have productivity value              ***/
/********************************************************/ 
if @input_pacs_user_id <> 0
begin
	update #property_val_cad_state_cd_detail set
		state_cd = 'D2'
	from #property_val_cad_state_cd_detail
	join recalc_ptd_list as rpl on
		#property_val_cad_state_cd_detail.prop_id = rpl.prop_id and
		rpl.sup_yr = @input_yr and
		rpl.sup_num = @input_sup_num
	where
		ag_use_val + timber_use = 0 and
		ag_market + timber_market = 0 and
		state_cd like 'D%' and
		rpl.pacs_user_id = @input_pacs_user_id
end
else if @input_query <> ''
begin
	select @select_cmd = 'update #property_val_cad_state_cd_detail set state_cd = ''D2'' 
			      where ((ag_use_val + timber_use = 0) and (ag_market + timber_market = 0))
			      and   state_cd like ''D%''
					and #property_val_cad_state_cd_detail.prop_id in (' + @input_query + ')'
	exec(@select_cmd)
end
else if @input_prop_id <> 0
begin
	update #property_val_cad_state_cd_detail set
		state_cd = 'D2' 
	where
		#property_val_cad_state_cd_detail.prop_id = @input_prop_id and
		ag_use_val + timber_use = 0 and
		ag_market + timber_market = 0 and
		state_cd like 'D%'
end
else
begin
	update #property_val_cad_state_cd_detail set
		state_cd = 'D2' 
	where
		ag_use_val + timber_use = 0 and
		ag_market + timber_market = 0 and
		state_cd like 'D%'
end

--print 'Finished D to D2 state code update at ' + convert(varchar(64), getdate(), 109)

/***************************************************************/
/**** now propulate the property_owner_entity_state_cd table ***/
/***************************************************************/
if @input_pacs_user_id <> 0
begin
	insert into property_val_cad_state_cd(
	prop_id,     
	sup_num,     
	prop_val_yr,  
	state_cd, 
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	land_hstd_val,    
	land_non_hstd_val, 
	ag_use_val,       
	ag_market,        
	timber_use,
	timber_market,
	mineral_val,     
	personal_val,
	appraised_val,
	ten_percent_cap,
	assessed_val ,
	market_val,
	imp_new_val,
	ag_acres,
	pp_new_val,
	land_new_val,
	effective_front,
	acres
	)
	select pv.prop_id,
	       @input_sup_num,
	       @input_yr,
	       state_cd,
	       sum(imprv_hstd_val),   
	       sum(imprv_non_hstd_val), 
	       sum(land_hstd_val),    
	       sum(land_non_hstd_val), 
	       sum(ag_use_val),       
	       sum(ag_market),        
	       sum(timber_use),
	       sum(timber_market),
	       sum(mineral_val),     
	       sum(personal_val),
	       sum(imprv_hstd_val + imprv_non_hstd_val + 
		    land_hstd_val  + land_non_hstd_val + 
		    ag_use_val + timber_use + 
		    personal_val + mineral_val),
	       0, 0 ,
	        sum(imprv_hstd_val + imprv_non_hstd_val + 
		    land_hstd_val  + land_non_hstd_val + 
		    ag_market + timber_market + 
		    personal_val + mineral_val),
		sum(imp_new_val),
		sum(ag_acres),
		sum(pp_new_val),
		sum(land_new_val),
		sum(effective_front),
		sum(acres)
	       
	from   #property_val_cad_state_cd_detail pv
	join recalc_ptd_list as rpl on
		pv.prop_id = rpl.prop_id and
		rpl.sup_num = @input_sup_num and
		rpl.sup_yr = @input_yr
	where
		rpl.pacs_user_id = @input_pacs_user_id
	group by
		pv.prop_id, state_cd
	order by state_cd, pv.prop_id
end
else if @input_query <> ''
begin
	select @select_cmd = 'insert into property_val_cad_state_cd(
	prop_id,     
	sup_num,     
	prop_val_yr,  
	state_cd, 
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	land_hstd_val,    
	land_non_hstd_val, 
	
	
	ag_use_val,       
	ag_market,        
	timber_use,
	timber_market,
	mineral_val,     
	personal_val,
	appraised_val,
	ten_percent_cap,
	
	assessed_val ,
	market_val,
	imp_new_val,
	ag_acres,
	pp_new_val,
	land_new_val,
	effective_front,
	acres
	)
	select prop_id,
	       ' + convert(varchar(12), @input_sup_num) + ',
	       ' + convert(varchar(4), @input_yr) + ',
	       state_cd,
	       sum(imprv_hstd_val),   
	       sum(imprv_non_hstd_val), 
	       sum(land_hstd_val),    
	       sum(land_non_hstd_val), 
	       sum(ag_use_val),       
	       sum(ag_market),        
	       sum(timber_use),
	       sum(timber_market),
	       sum(mineral_val),     
	       sum(personal_val),
	       sum(imprv_hstd_val + imprv_non_hstd_val + 
		    land_hstd_val  + land_non_hstd_val + 
		    ag_use_val + timber_use + 
		    personal_val + mineral_val),
	       0, 0 ,
	        sum(imprv_hstd_val + imprv_non_hstd_val + 
		    land_hstd_val  + land_non_hstd_val + 
		    ag_market + timber_market + 
		    personal_val + mineral_val),
		sum(imp_new_val),
		sum(ag_acres),
		sum(pp_new_val),
		sum(land_new_val),
		sum(effective_front),
		sum(acres)
	       
	from   #property_val_cad_state_cd_detail pv
	where pv.prop_id in (' + @input_query + ')
	group by prop_id, state_cd
	order by state_cd, prop_id'

	exec (@select_cmd)
end
else if @input_prop_id <> 0
begin
	insert into property_val_cad_state_cd(
	prop_id,     
	sup_num,     
	prop_val_yr,  
	state_cd, 
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	land_hstd_val,    
	land_non_hstd_val, 
	ag_use_val,       
	ag_market,        
	timber_use,
	timber_market,
	mineral_val,     
	personal_val,
	appraised_val,
	ten_percent_cap,
	assessed_val ,
	market_val,
	imp_new_val,
	ag_acres,
	pp_new_val,
	land_new_val,
	effective_front,
	acres
	)
	select prop_id,
	       @input_sup_num,
	       @input_yr,
	       state_cd,
	       sum(imprv_hstd_val),   
	       sum(imprv_non_hstd_val), 
	       sum(land_hstd_val),    
	       sum(land_non_hstd_val), 
	       sum(ag_use_val),       
	       sum(ag_market),        
	       sum(timber_use),
	       sum(timber_market),
	       sum(mineral_val),     
	       sum(personal_val),
	       sum(imprv_hstd_val + imprv_non_hstd_val + 
		    land_hstd_val  + land_non_hstd_val + 
		    ag_use_val + timber_use + 
		    personal_val + mineral_val),
	       0, 0 ,
	        sum(imprv_hstd_val + imprv_non_hstd_val + 
		    land_hstd_val  + land_non_hstd_val + 
		    ag_market + timber_market + 
		    personal_val + mineral_val),
		sum(imp_new_val),
		sum(ag_acres),
		sum(pp_new_val),
		sum(land_new_val),
		sum(effective_front),
		sum(acres)
	       
	from   #property_val_cad_state_cd_detail pv
	where
		pv.prop_id = @input_prop_id
	group by
		prop_id, state_cd
	order by
		state_cd, prop_id
end
else
begin
	insert into property_val_cad_state_cd(
	prop_id,     
	sup_num,     
	prop_val_yr,  
	state_cd, 
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	land_hstd_val,    
	land_non_hstd_val, 
	ag_use_val,       
	ag_market,        
	timber_use,
	timber_market,
	mineral_val,     
	personal_val,
	appraised_val,
	ten_percent_cap,
	assessed_val ,
	market_val,
	imp_new_val,
	ag_acres,
	pp_new_val,
	land_new_val,
	effective_front,
	acres
	)
	select prop_id,
	       @input_sup_num,
	       @input_yr,
	       state_cd,
	       sum(imprv_hstd_val),   
	       sum(imprv_non_hstd_val), 
	       sum(land_hstd_val),    
	       sum(land_non_hstd_val), 
	       sum(ag_use_val),       
	       sum(ag_market),        
	       sum(timber_use),
	       sum(timber_market),
	       sum(mineral_val),     
	       sum(personal_val),
	       sum(imprv_hstd_val + imprv_non_hstd_val + 
		    land_hstd_val  + land_non_hstd_val + 
		    ag_use_val + timber_use + 
		    personal_val + mineral_val),
	       0, 0 ,
	        sum(imprv_hstd_val + imprv_non_hstd_val + 
		    land_hstd_val  + land_non_hstd_val + 
		    ag_market + timber_market + 
		    personal_val + mineral_val),
		sum(imp_new_val),
		sum(ag_acres),
		sum(pp_new_val),
		sum(land_new_val),
		sum(effective_front),
		sum(acres)
	       
	from   #property_val_cad_state_cd_detail pv
	group by

		prop_id, state_cd
	order by
		state_cd, prop_id
end

--print 'Finished populating property_val_cad_state_cd at ' + convert(varchar(64), getdate(), 109)

/****************************************************/
/*** now calculate the 10% cap & the assessed val ***/
/*** for each state code			  ***/
/****************************************************/

declare @prop_id	 	int
declare @sup_num	 	int
declare @prop_val_yr	 	numeric(4)
declare @state_cd	 	char(5)
declare @ten_percent_cap	numeric(14)
declare @imprv_hstd_val		numeric(14)
declare @land_hstd_val		numeric(14)
declare @prev_prop_id		int
declare @prop_cap_amt		numeric(14)

declare @state_cd_cap_amt	numeric(14)
declare @pv_imprv_hstd_val	numeric(14)
declare @pv_land_hstd_val	numeric(14)
declare @num_records		int
declare @pos			int

select @prev_prop_id = 0 

set @strSQL = '
declare ten_percent_cap scroll cursor
for
	select
		pv.prop_id,
		pv.sup_num,
		pv.prop_val_yr,
		pv.ten_percent_cap,
		poes.state_cd,
		poes.imprv_hstd_val,
		poes.land_hstd_val,
		pv.imprv_hstd_val,
		pv.land_hstd_val
	from property_val as pv
	join property_val_cad_state_cd as poes on
		pv.prop_id = poes.prop_id and
		pv.prop_val_yr = poes.prop_val_yr and
		pv.sup_num = poes.sup_num
	where pv.prop_val_yr = ' + convert(varchar(4), @input_yr) + '
	and pv.sup_num = '    + convert(varchar(12), @input_sup_num) + '
	and pv.prop_inactive_dt is null
	and pv.ten_percent_cap > 0
	'

if (@input_pacs_user_id <> 0)
begin
	 set @strSQL = @strSQL + ' and    exists (select * from recalc_ptd_list'
	 set @strSQL = @strSQL + ' where prop_id = pv.prop_id'
	 set @strSQL = @strSQL + ' and   sup_num = pv.sup_num'
	 set @strSQL = @strSQL + ' and   sup_yr  = pv.prop_val_yr'
	 set @strSQL = @strSQL + ' and   pacs_user_id = ' + convert(varchar(12), @input_pacs_user_id) + ')'

end
else if (@input_query <> '')
begin

	 set @strSQL = @strSQL + ' and    pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	 set @strSQL = @strSQL + ' and    pv.prop_id     = ' + convert(varchar(12), @input_prop_id)
end

set @strSQL = @strSQL + ' order  by pv.prop_id, poes.state_cd '
--set @strSQL = @strSQL + ' for update of poes.ten_percent_cap'

exec (@strSQL)

open ten_percent_cap
fetch next from ten_percent_cap into @prop_id, @sup_num, @prop_val_yr, @ten_percent_cap,
				     @state_cd, @imprv_hstd_val, @land_hstd_val, @pv_imprv_hstd_val, @pv_land_hstd_val

while (@@FETCH_STATUS = 0)
begin
	if (@prev_prop_id <> @prop_id) 
	begin
		select @num_records = count(*)
		from property_val_cad_state_cd
		where prop_id = @prop_id
		and    sup_num = @sup_num
		and    prop_val_yr = @prop_val_yr

		select @pos = 1
		select @prop_cap_amt = @ten_percent_cap
		select @prev_prop_id = @prop_id
	end
	
	if (@prop_cap_amt > 0)
	begin
		if ((@land_hstd_val + @imprv_hstd_val) >= @prop_cap_amt and (@pos = @num_records))
		begin
			select @state_cd_cap_amt = @prop_cap_amt
			select @prop_cap_amt     = 0
		end
		else
		begin 
			/* figure out the percentage for the state code */
			if ((@pv_imprv_hstd_val + @pv_land_hstd_val) > 0)
			begin
				select @state_cd_cap_amt =  (@ten_percent_cap) * ( (@land_hstd_val + @imprv_hstd_val)/(@pv_imprv_hstd_val + @pv_land_hstd_val))
			end
			else
			begin
				select @state_cd_cap_amt = @ten_percent_cap
			end
				
			select @prop_cap_amt     = @prop_cap_amt - @state_cd_cap_amt
		end
		
		update property_val_cad_state_cd set ten_percent_cap = @state_cd_cap_amt
		where
			--current of ten_percent_cap
			prop_id = @prop_id and
			prop_val_yr = @prop_val_yr and
			sup_num = @sup_num and
			state_cd = @state_cd
	end
			
	select @pos = @pos + 1

	fetch next from ten_percent_cap into @prop_id, @sup_num, @prop_val_yr, @ten_percent_cap,
				             @state_cd, @imprv_hstd_val, @land_hstd_val, @pv_imprv_hstd_val, @pv_land_hstd_val

end

close ten_percent_cap
deallocate ten_percent_cap

--print 'Finished ten_percent_cap at ' + convert(varchar(64), getdate(), 109)
-- update the assessed


set @strSQL = 'update property_val_cad_state_cd set assessed_val = appraised_val - ten_percent_cap'
set @strSQL = @strSQL + ' where prop_val_yr = ' + convert(varchar(4),  @input_yr) 
set @strSQL = @strSQL + ' and   sup_num     = ' + convert(varchar(12), @input_sup_num)


if (@input_pacs_user_id <> 0)
begin
	set @strSQL = @strSQL + ' and   exists (select * from recalc_ptd_list'
	set @strSQL = @strSQL + ' where prop_id = property_val_cad_state_cd.prop_id'
	set @strSQL = @strSQL + ' and   sup_num = property_val_cad_state_cd.sup_num'
	set @strSQL = @strSQL + ' and   sup_yr  = property_val_cad_state_cd.prop_val_yr'
	set @strSQL = @strSQL + ' and   pacs_user_id = ' + convert(varchar(12), @input_pacs_user_id) + ')'
end
else if (@input_query <> '')
begin
	set @strSQL = @strSQL + ' and   prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	set @strSQL = @strSQL + ' and prop_id = ' + convert(varchar(12), @input_prop_id)
end

exec (@strSQL)

--print 'Finished updating assessed at ' + convert(varchar(64), getdate(), 109)

/**************************************************/
/*** now validate the data and make sure that *****/
/*** state codes add up to property val table *****/
/**************************************************/

select @select_cmd = 'insert into  #property_val_cad_state_cd_summary
(
prop_id ,    
imprv_hstd_val,   
imprv_non_hstd_val, 
land_hstd_val ,   
land_non_hstd_val, 
ag_use_val,       
ag_market  ,      
timber_use  ,     
timber_market,    
appraised_val,
ten_percent_cap,
assessed_val,
market_val
)

select 	prop_id ,    
	sum(imprv_hstd_val) as imprv_hstd_val ,                          
	sum(imprv_non_hstd_val) as imprv_non_hstd_val ,                      
	sum(land_hstd_val) as land_hstd_val       ,                    
 	sum(land_non_hstd_val) as land_non_hstd_val    ,                   
 	sum(ag_use_val) as ag_use_val ,                              
	sum(ag_market) as ag_market   ,      
	sum(timber_use) as timber_use  ,                        
	sum(timber_market) as timber_market ,                           
	sum(appraised_val) as appraised_val ,
	sum(ten_percent_cap) as ten_percent_cap,
	sum(assessed_val) as assessed_val,
	sum(market_val) as market_val
                            

from property_val_cad_state_cd pv
where  pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) 

select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

select @select_cmd = @select_cmd + ' group by prop_id'

exec (@select_cmd)

--print 'Finished populating summary at ' + convert(varchar(64), getdate(), 109)

/* Indexes for #property_val_cad_state_cd_summary */
declare @lSQLVersion int
exec @lSQLVersion = GetServerVersion
set @select_cmd = '
create nonclustered index idx_prop_id on #property_val_cad_state_cd_summary(
	prop_id, market_val, imprv_hstd_val, imprv_non_hstd_val, land_hstd_val, land_non_hstd_val, ag_use_val, timber_use, ag_market, timber_market, appraised_val, ten_percent_cap, assessed_val
) with fillfactor = 100'
if @lSQLVersion = 2000
begin
	set @select_cmd = @select_cmd + ', sort_in_tempdb'
end

exec(@select_cmd)

--print 'Finished creating summary index at ' + convert(varchar(64), getdate(), 109)


/*******************************************************/
/******** Now look for errors and log them in the ******/
/******** prop_recalc_errors tables ********************/
/*******************************************************/



select @select_cmd = 'insert into  prop_recalc_errors with(tablock)
(
prop_id  ,   
sup_num   ,  
sup_yr, 
ptd_imprv_hstd_val, 
pv_imprv_hstd_val ,
ptd_imprv_non_hstd_val, 
pv_imprv_non_hstd_val, 
ptd_land_hstd_val ,
pv_land_hstd_val, 
ptd_land_non_hstd_val, 
pv_land_non_hstd_val ,
ptd_ag_use_val  , 
pv_ag_use_val   , 
ptd_ag_market   , 
pv_ag_market    , 
ptd_timber_use   ,
pv_timber_use   , 
ptd_timber_market, 
pv_timber_market ,
ptd_appraised_val ,
pv_appraised_val,
ptd_ten_percent_cap,
pv_ten_percent_cap,
ptd_assessed_val,
pv_assessed_val,
ptd_market_val,
pv_market_val,
error_type,
error
)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,
	psc.imprv_hstd_val ,     
	pv.imprv_hstd_val ,                           
	psc.imprv_non_hstd_val ,        
	pv.imprv_non_hstd_val ,                   
	psc.land_hstd_val       ,    
	pv.land_hstd_val       ,                 
 	psc.land_non_hstd_val    ,    
	pv.land_non_hstd_val    ,                   
 	psc.ag_use_val ,  
	pv.ag_use_val ,                             
	psc.timber_use  ,     
	pv.timber_use  ,                             
	psc.ag_market   ,          
	pv.ag_market   ,                       
	psc.timber_market ,     

	pv.timber_market ,                           
	psc.appraised_val   ,
	pv.appraised_val,
	psc.ten_percent_cap,
	pv.ten_percent_cap,
	psc.assessed_val,
	pv.assessed_val,
	psc.market_val,
	pv.market, ' 
+ '''' +  @error_type  + ''', ' + 
'''' +  @error + ''' 
from #property_val_cad_state_cd_summary as psc with(index(idx_prop_id), nolock)
join property_val as pv on
	psc.prop_id = pv.prop_id
	and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4))  + '
	and   pv.sup_num = ' + cast(@input_sup_num as varchar(12)) + '
	and   pv.appr_method  = ''C''
where 
psc.imprv_hstd_val <>     
	pv.imprv_hstd_val 
or                              
	psc.imprv_non_hstd_val <>        
	pv.imprv_non_hstd_val 
or                       
	psc.land_hstd_val     <>    
	pv.land_hstd_val                      
or    	psc.land_non_hstd_val  <>    
	pv.land_non_hstd_val
or    	psc.ag_use_val  <>      
	pv.ag_use_val 
or     psc.timber_use  <>     
	pv.timber_use 
or    	psc.ag_market   <>          
	pv.ag_market   
or    	psc.timber_market <>     
	pv.timber_market                           
or    	psc.appraised_val <>   
	pv.appraised_val 
or     psc.ten_percent_cap <>

	pv.ten_percent_cap 
or    	psc.assessed_val <>
	pv.assessed_val     
or  psc.market_val <>
      pv.market
'

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
 
--print '1 - Finished error insert at ' + convert(varchar(64), getdate(), 109)



select @select_cmd =  'insert into prop_recalc_errors with(tablock)
(
prop_id  ,   
sup_num   ,  
sup_yr, 


ptd_imprv_hstd_val, 
pv_imprv_hstd_val ,
ptd_imprv_non_hstd_val, 
pv_imprv_non_hstd_val, 
ptd_land_hstd_val ,
pv_land_hstd_val, 
ptd_land_non_hstd_val, 
pv_land_non_hstd_val ,
ptd_ag_use_val  , 
pv_ag_use_val   , 
ptd_ag_market   , 
pv_ag_market    , 
ptd_timber_use   ,
pv_timber_use   , 
ptd_timber_market, 
pv_timber_market ,
ptd_appraised_val ,
pv_appraised_val,
ptd_ten_percent_cap,
pv_ten_percent_cap,
ptd_assessed_val,
pv_assessed_val, 
error_type,
error

)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	psc.assessed_val,
	pv.shared_prop_val,  ' 
+ ''''  + @error_type  + ''', ' + 
'''' +  @error + '''
from property_val as pv
join #property_val_cad_state_cd_summary as psc with(index(idx_prop_id), nolock) on
	pv.prop_id = psc.prop_id
where 
pv.appr_method  = ''S''
and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
and   pv.sup_num = ' + cast(@input_sup_num as varchar(12)) + '
and  (psc.market_val <>     
	pv.market  )
'

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list

								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))

end


exec (@select_cmd)

      
--print '2 - Finished error insert at ' + convert(varchar(64), getdate(), 109)


/****************************************************************************************************/
/** also need to make entries for those properties that didn't have any entries in the state code  **/
/**   table, this would indicate that they had null state code values on all segments              **/
/****************************************************************************************************/

select @select_cmd = 'insert into  prop_recalc_errors with(tablock)
(
prop_id  ,   
sup_num   ,  
sup_yr, 
ptd_imprv_hstd_val, 
pv_imprv_hstd_val ,
ptd_imprv_non_hstd_val, 
pv_imprv_non_hstd_val, 
ptd_land_hstd_val ,
pv_land_hstd_val, 
ptd_land_non_hstd_val, 
pv_land_non_hstd_val ,
ptd_ag_use_val  , 
pv_ag_use_val   , 
ptd_ag_market   , 
pv_ag_market    , 
ptd_timber_use   ,
pv_timber_use   , 
ptd_timber_market, 
pv_timber_market ,
ptd_appraised_val ,
pv_appraised_val,
ptd_ten_percent_cap,
pv_ten_percent_cap,
ptd_assessed_val,
pv_assessed_val,
ptd_market_val,
pv_market_val,
error_type,
error


)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,
	0 ,     

	pv.imprv_hstd_val ,                           
	0 ,        
	pv.imprv_non_hstd_val ,                   
	0,    
	pv.land_hstd_val       ,                 
 	0,    
	pv.land_non_hstd_val    ,                   
 	0,      
	pv.ag_use_val ,              
	0,     
	pv.timber_use  ,                             
	0,          

	pv.ag_market   ,                       
	0,     
	pv.timber_market ,                           
	0 ,
	pv.appraised_val,
	0,
	pv.ten_percent_cap,

	0,
	pv.assessed_val ,
 	0,
	pv.market,  ' 
+ '''' +  @error_type  + ''', ' + 
'''' +  @error + ''' 
	
from property_val pv
where   pv.prop_inactive_dt is null
and       pv.assessed_val <> 0
and   not exists (select * from #property_val_cad_state_cd_summary psc
		  where psc.prop_id = pv.prop_id
		)
and   pv.prop_val_yr = ' + cast(@input_yr as varchar(4)) + '
and   pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)

--print '3 - Finished error insert at ' + convert(varchar(64), getdate(), 109)



/******************************************************************/
/******* now do some preliminary checks to make sure the user *****/
/******* has entered the proper state codes on the propery    *****/
/******************************************************************/

select @ptd_error = 'Properties with HS, OV65, DP must have HOMESITE value > 0 with A, B,  E, F or M state category codes'
select @select_cmd = 'insert into  prop_recalc_errors
(
prop_id  ,   
sup_num   ,  
sup_yr, 
error_type,
error
)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val pv
where   pv.prop_inactive_dt is null
and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
and   exists (select * from property_exemption where prop_id = pv.prop_id
					       and   sup_num = pv.sup_num
					       and   owner_tax_yr = pv.prop_val_yr
					       and   (exmpt_type_cd = ''HS''
					       or    exmpt_type_cd = ''OV65''
					       or    exmpt_type_cd = ''OV65S''
					       or exmpt_type_cd = ''DP'')  )
and  ( ((pv.imprv_hstd_val + pv.land_hstd_val) = 0 ) or not exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					               and   prop_val_yr = pv.prop_val_yr
						       and  (state_cd like ''A%''
						       or    state_cd like ''B%''
						       or    state_cd like ''E%''
						       or    state_cd like ''F%''
						       or    state_cd like ''M%''
						       or    state_cd like ''X%'')))'

select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)



/*************************************
 ***************** new stuff *********
 *************************************/

select @ptd_error = 'Segments with HOMESITE value > 0 must have an A, B, E, F or M state category codes'
select @select_cmd = 'insert into  prop_recalc_errors
(
prop_id  ,   
sup_num   ,  
sup_yr, 
error_type,
error
)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val pv
where   pv.prop_inactive_dt is null
and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
and   exists (select * from property_exemption where prop_id = pv.prop_id
					       and   sup_num = pv.sup_num
					       and   owner_tax_yr = pv.prop_val_yr
					       and   (exmpt_type_cd = ''HS'')  )
and   exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					               and   prop_val_yr = pv.prop_val_yr
						       and  (state_cd not like ''A%''
						       and   state_cd not like ''B%''
						       and   state_cd not like ''E%''
						       and   state_cd not like ''F%''
						       and   state_cd not like ''M%''
						       and   state_cd not like ''X%'')
						       and   imprv_hstd_val + land_hstd_val > 0)'


select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)



select @ptd_error = 'Properties with X state codes must have an EX or EX366 exemptions'
select @select_cmd = 'insert into  prop_recalc_errors
(
prop_id  ,   
sup_num   ,  
sup_yr, 
error_type,
error
)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val pv
where   pv.prop_inactive_dt is null
and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
and   not exists (select * from property_exemption where prop_id = pv.prop_id
					       and   sup_num = pv.sup_num
					       and   owner_tax_yr = pv.prop_val_yr
					       and   (exmpt_type_cd = ''EX''
					       or    exmpt_type_cd = ''EX366''))
and  exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					               and   prop_val_yr = pv.prop_val_yr
						       and  (state_cd like ''X%''))'


select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)

/************************************/
/******************end new stuff ****/
/************************************/

/*  Dean called the state on the below and they confirmed that below 2 checks for A state code and E state code are
    not valid. 06/19/2003  - jcoco

select @ptd_error = 'Properties with an A state code that has land value, must also have improvement value on the A state code'
select @select_cmd = 'insert into  prop_recalc_errors
(
prop_id  ,   
sup_num   ,  
sup_yr, 
error_type,
error
)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val pv
where   pv.prop_inactive_dt is null
and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
and   exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					                  and   prop_val_yr = pv.prop_val_yr
						       and  state_cd like ''A%''
						       and  land_hstd_val + land_non_hstd_val  > 0 )
and   not exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					                     and   prop_val_yr = pv.prop_val_yr
						       and  state_cd like ''A%''
						       and  imprv_hstd_val + imprv_non_hstd_val  > 0)'


select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)






select @ptd_error = 'Properties with an E state code that has land value, must also have improvement value on the E state code'
select @select_cmd = 'insert into  prop_recalc_errors
(
prop_id  ,   
sup_num   ,  
sup_yr, 
error_type,
error
)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val pv
where   pv.prop_inactive_dt is null
and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
and   exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					                  and   prop_val_yr = pv.prop_val_yr
						       and  state_cd like ''E%''
						       and  land_hstd_val + land_non_hstd_val  > 0 )
and   not exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					                     and   prop_val_yr = pv.prop_val_yr
						       and  state_cd like ''E%''
						       and  imprv_hstd_val + imprv_non_hstd_val  > 0)'


select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)

*/

select @ptd_error = 'Properties with Improvement Value must also have a state code of A, B, E, F1, F2, J1-J9, M1, N, O'
select @select_cmd = 'insert into  prop_recalc_errors
(
prop_id  ,   
sup_num   ,  
sup_yr, 
error_type,
error
)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val pv
where   pv.prop_inactive_dt is null
and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
and   exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					               and   prop_val_yr = pv.prop_val_yr
						       and  imprv_hstd_val + imprv_non_hstd_val > 0 
						       and  state_cd not in (''A'', ''B'', ''E'', ''F1'', ''F2'', ''J1'', ''J2'', ''J3'', ''J4'', ''J5'', ''J6'', ''J7'', ''J8'', ''J9'', ''M1'', ''N'', ''O'', ''X''))'



select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id


								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)




select @ptd_error = 'Properties with Personal Property Value must also have a state code of H, F2,  J1-J9, L1, L2, M2, N or S'
select @select_cmd = 'insert into  prop_recalc_errors
(
prop_id  ,   
sup_num   ,  
sup_yr, 
error_type,
error
)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val pv
where   pv.prop_inactive_dt is null
and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
and   exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					               and   prop_val_yr = pv.prop_val_yr
						       and  personal_val > 0 
						       and  state_cd not in (''H'', ''F2'', ''J1'', ''J2'', ''J3'', ''J4'', ''J5'', ''J6'', ''J7'', ''J8'', ''J9'', ''L1'', ''L2'', ''M2'', ''N'', ''S'', ''X''))'



select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)



select @ptd_error = 'Properties with Mineral Value must also have a state code of G1, G2, or G3'
select @select_cmd = 'insert into  prop_recalc_errors
(
prop_id  ,   
sup_num   ,  
sup_yr, 
error_type,
error
)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 

'''' +  @ptd_error + ''' 
	
from property_val pv
where   pv.prop_inactive_dt is null
and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
and   exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					               and   prop_val_yr = pv.prop_val_yr
						       and  mineral_val > 0 
						       and  state_cd not in (''G1'', ''G2'', ''G3'', ''X''))'


select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)

select @ptd_error = 'Properties with Land Value must also have a state code of A, B, C, D1, D2, E, F1, F2, J1-J9, N, or O'
select @select_cmd = 'insert into  prop_recalc_errors
(
prop_id  ,   
sup_num   ,  
sup_yr, 
error_type,
error
)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val pv
where   pv.prop_inactive_dt is null
and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
and   exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					               and   prop_val_yr = pv.prop_val_yr
						       and  land_hstd_val + land_non_hstd_val > 0 
						       and  state_cd not in (''A'', ''B'', ''C'', ''D1'', ''D2'', ''E'', ''F1'', ''F2'', ''J1'', ''J2'', ''J3'', ''J4'', ''J5'', ''J6'', ''J7'', ''J8'', ''J9'', ''N'', ''O'', ''X''))'



select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id

								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end
else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)





select @ptd_error = 'Properties with state code of D1 must have a productivity value > 0'
select @select_cmd = 'insert into  prop_recalc_errors
(
prop_id  ,   
sup_num   ,  
sup_yr, 
error_type,
error
)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	

from property_val pv
where   pv.prop_inactive_dt is null
and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
and   exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					               and   prop_val_yr = pv.prop_val_yr
						       and  ag_use_val + timber_use = 0 
						       and  state_cd = ''D1'')'



select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end

else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end

else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)




select @ptd_error = 'Properties with productivity value > 0 must have a state code of D1'
select @select_cmd = 'insert into  prop_recalc_errors
(
prop_id  ,   
sup_num   ,  
sup_yr, 
error_type,
error
)
select 	pv.prop_id ,    
	pv.sup_num  ,   
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val pv
where   pv.prop_inactive_dt is null
and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
and   exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					               and   prop_val_yr = pv.prop_val_yr
						       and  ag_use_val + timber_use > 0 
						       and  state_cd <> ''D1'')'



select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and exists (select *
								   from recalc_ptd_list
								   where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
								   and   sup_yr  = pv.prop_val_yr
								   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
end

else if (@input_query <> '')
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end


else if (@input_prop_id <> 0)
begin
	select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)


if (@input_pacs_user_id <> 0)
begin
	select @delete_ptd_list = 'delete from recalc_ptd_list where pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))

	exec (@delete_ptd_list)
end

/* New EX - Prorate check */
/* Only works on SQL 2000 given the function call */
if (@lSQLVersion = 2000)
begin
	select @ptd_error = 'Properties with a prorate EX exemption cannot have an X state code'
	select @select_cmd = 'insert into  prop_recalc_errors
	(
	prop_id  ,   
	sup_num   ,  
	sup_yr, 
	error_type,
	error
	)
	select 	pv.prop_id ,    
		pv.sup_num  ,   
		pv.prop_val_yr ,' +
		'''' +  @ptd_error_type  + ''', ' + 
	'''' +  @ptd_error + ''' 
		
	from property_val pv
	where   pv.prop_inactive_dt is null
	and   pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) + '
	and   exists (select * from property_val_cad_state_cd  where prop_id = pv.prop_id
								   and   sup_num = pv.sup_num
									   and  prop_val_yr = pv.prop_val_yr
								   and  state_cd = ''X'')
	and  exists (select *
	from property_exemption pe
	where pe.prop_id = pv.prop_id
	and   pe.sup_num = pv.sup_num
	and   pe.owner_tax_yr = pv.prop_val_yr 
	and   exmpt_type_cd = ''EX''
	and   dbo.fn_GetProratePct(effective_dt, termination_dt, owner_tax_yr) <> 1)'



	select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

	if (@input_pacs_user_id <> 0)
	begin
		select @select_cmd = @select_cmd + ' and exists (select *
									   from recalc_ptd_list
									   where prop_id = pv.prop_id
									   and   sup_num = pv.sup_num
									   and   sup_yr  = pv.prop_val_yr
									   and   pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ')'
	end
	else if (@input_query <> '')
	begin
		select @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
	end
	else if (@input_prop_id <> 0)
	begin
		select @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
	end

	exec (@select_cmd)
end

/* We don't need these anymore */
drop table #property_val_cad_state_cd_detail
drop table #property_val_cad_state_cd_summary

--print 'Finished all at ' + convert(varchar(64), getdate(), 109)

GO

