

CREATE PROCEDURE PopulatePropertyValStateCd_Test

	@input_yr	    	numeric(4),
	@input_sup_num	    int,
	@input_prop_id	    int = 0,
	@input_pacs_user_id int = 0,
	@input_query	    varchar(2000) = ''

as

set quoted_identifier off
SET NOCOUNT ON

declare @delete_state_cd        	varchar(4096)
declare @delete_state_cd_detail		varchar(4096)
declare @delete_state_cd_summary 	varchar(4096)
declare @delete_state_cd_errors		varchar(4096)
declare @insert_cmd					varchar(4096)
declare @select_cmd					varchar(4096)
declare @strSQL						varchar(4096)
declare @error_type					varchar(5)
declare @error						varchar(100)
declare @ptd_error_type				varchar(5)
declare @ptd_error					varchar(100)
declare @delete_ptd_list			varchar(100)

SET @error_type = 'PTDRV'
SET @error      = 'The PTD Value does not match the Property Value'

SET @ptd_error_type = 'PTDRD'

SET @delete_state_cd = 'delete from property_val_state_cd '

IF @input_pacs_user_id <> 0
BEGIN
	SET @delete_state_cd = @delete_state_cd + 'FROM property_val_state_cd as pvsc '
	SET @delete_state_cd = @delete_state_cd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @delete_state_cd = @delete_state_cd + 'ON pvsc.prop_id = rpl.prop_id '
	SET @delete_state_cd = @delete_state_cd + 'AND pvsc.sup_num = rpl.sup_num '
	SET @delete_state_cd = @delete_state_cd + 'AND pvsc.prop_val_yr = rpl.sup_yr '
	SET @delete_state_cd = @delete_state_cd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @delete_state_cd = @delete_state_cd + ' where pvsc.sup_num = ' + cast(@input_sup_num as varchar(12)) + ' and pvsc.prop_val_yr = ' + cast(@input_yr as varchar(4))

if (@input_pacs_user_id <> 0)
begin
	SET @delete_state_cd = @delete_state_cd + ' '
end
else if (@input_query <> '')
begin
	SET @delete_state_cd = @delete_state_cd + ' and pvsc.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @delete_state_cd = @delete_state_cd + ' and pvsc.prop_id = ' + cast(@input_prop_id as varchar(20))
end


SET @delete_state_cd_detail = 'delete from property_val_state_cd_detail '

IF @input_pacs_user_id <> 0
BEGIN
	SET @delete_state_cd_detail = @delete_state_cd_detail + 'FROM property_val_state_cd_detail as pvscd '
	SET @delete_state_cd_detail = @delete_state_cd_detail + 'INNER JOIN recalc_ptd_list as rpl '
	SET @delete_state_cd_detail = @delete_state_cd_detail + 'ON pvscd.prop_id = rpl.prop_id '
	SET @delete_state_cd_detail = @delete_state_cd_detail + 'AND pvscd.sup_num = rpl.sup_num '
	SET @delete_state_cd_detail = @delete_state_cd_detail + 'AND pvscd.prop_val_yr = rpl.sup_yr '
	SET @delete_state_cd_detail = @delete_state_cd_detail + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @delete_state_cd_detail = @delete_state_cd_detail + ' where pvscd.sup_num = ' + cast(@input_sup_num as varchar(12)) + ' and pvscd.prop_val_yr = ' + cast(@input_yr as varchar(4))

if (@input_pacs_user_id <> 0)
begin
	SET @delete_state_cd_detail = @delete_state_cd_detail + ' '
end
else if (@input_query <> '')
begin
	SET @delete_state_cd_detail = @delete_state_cd_detail + ' and pvscd.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @delete_state_cd_detail = @delete_state_cd_detail + ' and pvscd.prop_id = ' + cast(@input_prop_id as varchar(20))
end



SET @delete_state_cd_summary = 'delete from property_val_state_cd_summary '

IF @input_pacs_user_id <> 0
BEGIN
	SET @delete_state_cd_summary = @delete_state_cd_summary + 'FROM property_val_state_cd_summary as pvscs '
	SET @delete_state_cd_summary = @delete_state_cd_summary + 'INNER JOIN recalc_ptd_list as rpl '
	SET @delete_state_cd_summary = @delete_state_cd_summary + 'ON pvscs.prop_id = rpl.prop_id '
	SET @delete_state_cd_summary = @delete_state_cd_summary + 'AND pvscs.sup_num = rpl.sup_num '
	SET @delete_state_cd_summary = @delete_state_cd_summary + 'AND pvscs.prop_val_yr = rpl.sup_yr '
	SET @delete_state_cd_summary = @delete_state_cd_summary + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @delete_state_cd_summary = @delete_state_cd_summary + ' where pvscs.sup_num = ' + cast(@input_sup_num as varchar(12)) + ' and pvscs.prop_val_yr = ' + cast(@input_yr as varchar(4))

if (@input_pacs_user_id <> 0)
begin
	SET @delete_state_cd_summary = @delete_state_cd_summary + ' '
end
else if (@input_query <> '')
begin
	SET @delete_state_cd_summary = @delete_state_cd_summary + ' and pvscs.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @delete_state_cd_summary = @delete_state_cd_summary + ' and pvscs.prop_id = ' + cast(@input_prop_id as varchar(20))
end


SET @delete_state_cd_errors = 'delete from prop_recalc_errors '

IF @input_pacs_user_id <> 0
BEGIN
	SET @delete_state_cd_errors = @delete_state_cd_errors + 'FROM prop_recalc_errors as pre '
	SET @delete_state_cd_errors = @delete_state_cd_errors + 'INNER JOIN recalc_ptd_list as rpl '
	SET @delete_state_cd_errors = @delete_state_cd_errors + 'ON pre.prop_id = rpl.prop_id '
	SET @delete_state_cd_errors = @delete_state_cd_errors + 'AND pre.sup_num = rpl.sup_num '
	SET @delete_state_cd_errors = @delete_state_cd_errors + 'AND pre.sup_yr = rpl.sup_yr '
	SET @delete_state_cd_errors = @delete_state_cd_errors + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @delete_state_cd_errors = @delete_state_cd_errors + ' where pre.sup_num = ' + cast(@input_sup_num as varchar(12)) + ' and pre.sup_yr = ' + cast(@input_yr as varchar(4)) 

if (@input_pacs_user_id <> 0)
begin
	SET @delete_state_cd_errors = @delete_state_cd_errors + ' '
end
else if (@input_query <> '')
begin
	SET @delete_state_cd_errors = @delete_state_cd_errors + ' and pre.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @delete_state_cd_errors = @delete_state_cd_errors + ' and pre.prop_id = ' + cast(@input_prop_id as varchar(20))
end

SET @delete_state_cd_errors = @delete_state_cd_errors + ' and (pre.error_type = ''' + @error_type +  ''' or pre.error_type = ''' + @ptd_error_type + ''')' 

exec(@delete_state_cd)        	
exec(@delete_state_cd_detail)		
exec(@delete_state_cd_summary) 
exec(@delete_state_cd_errors)		



/***************/
/* improvement */
/***************/

SET @insert_cmd = 'insert into property_val_state_cd_detail (
prop_id,     
sup_num,     
prop_val_yr, 
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
    

SET @select_cmd = ' select  i.prop_id, i.sup_num, i.prop_val_yr, ''I'', 
sc.ptd_state_cd , 
case i.imprv_homesite when ''Y'' then sum(isnull(imprv_val,0)) else 0 end as imprv_hs_val,
case i.imprv_homesite when ''N'' then sum(isnull(imprv_val,0))  else 0 end as imprv_non_hs_val,
0, 0, 0, 0, 0, 0, 0, 0, 
sum(case when imp_new_val_override in (''C'', ''D'', ''O'') then IsNull(imp_new_val, 0) else 0 end) as imp_new_val, 0, 0, 0, 0, 0 '

SET @select_cmd = @select_cmd + 'from property_val as pv '
SET @select_cmd = @select_cmd + 'INNER JOIN imprv as i '
SET @select_cmd = @select_cmd + 'ON pv.prop_id = i.prop_id '
SET @select_cmd = @select_cmd + 'AND pv.sup_num = i.sup_num '
SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = i.prop_val_yr '
SET @select_cmd = @select_cmd + 'AND i.sale_id = 0 '
SET @select_cmd = @select_cmd + 'INNER JOIN state_code as sc '
SET @select_cmd = @select_cmd + 'ON i.imprv_state_cd = sc.state_cd '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' WHERE pv.prop_inactive_dt is null
and   pv.appr_method  = ''C''
and   pv.prop_val_yr =  ' + cast(@input_yr as varchar(4))

SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end



SET @select_cmd = @select_cmd + ' group by i.prop_id, i.sup_num, i.prop_val_yr, sc.ptd_state_cd, i.imprv_homesite'
exec (@insert_cmd + @select_cmd)

IF @@ERROR <> 0
BEGIN
	print '1'
END

/********/
/* land */
/********/

SET @select_cmd = 'select ld.prop_id,
	ld.sup_num,
	ld.prop_val_yr,
	''L'',
	sc.ptd_state_cd,
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
	case when sc.ptd_state_cd like ''D%'' then (isnull(size_acres, 0)) else 0 end as acres,

	0,
	case when isnull(ld.effective_tax_year, 0) =  ' + cast(@input_yr as varchar(4)) + ' then isnull(land_new_val, 0) else 0  end as new_land_val,
	IsNull(effective_front, 0) as effective_front,
	IsNull(size_acres, 0) as acres '

SET @select_cmd = @select_cmd + 'from property_val as pv '
SET @select_cmd = @select_cmd + 'INNER JOIN land_detail as ld '
SET @select_cmd = @select_cmd + 'ON pv.prop_id = ld.prop_id '
SET @select_cmd = @select_cmd + 'AND pv.sup_num = ld.sup_num '
SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = ld.prop_val_yr '
SET @select_cmd = @select_cmd + 'AND ld.sale_id = 0 '
SET @select_cmd = @select_cmd + 'INNER JOIN state_code as sc '
SET @select_cmd = @select_cmd + 'ON ld.state_cd = sc.state_cd '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.appr_method  = ''C'''
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr =  ' + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@insert_cmd + @select_cmd)
IF @@ERROR <> 0
BEGIN
	print '2'
END

/******************************/
/* personal property segments */
/******************************/

SET @select_cmd = 'select pps.prop_id, 
	pps.sup_num, 
	pps.prop_val_yr, 
	''P'',
 	sc.ptd_state_cd ,
	0, 0, 0, 0, 0, 0, 0, 0, 0,
	sum(isnull(pps.pp_mkt_val,0)),
	0,
	0,
	0,
	case when isnull(pps.pp_new_val_yr, 0) =  ' + cast(@input_yr as varchar(4)) + ' then sum(isnull(pp_new_val, 0)) else 0  end as pp_new_val ,0, 0 '

SET @select_cmd = @select_cmd + 'from property_val as pv '
SET @select_cmd = @select_cmd + 'INNER JOIN pers_prop_seg as pps '
SET @select_cmd = @select_cmd + 'ON pv.prop_id = pps.prop_id '
SET @select_cmd = @select_cmd + 'AND pv.sup_num = pps.sup_num '
SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = pps.prop_val_yr '
SET @select_cmd = @select_cmd + 'AND pps.sale_id = 0 '
SET @select_cmd = @select_cmd + 'AND pps.pp_active_flag = ''T'' '
SET @select_cmd = @select_cmd + 'AND pps.pp_mkt_val > 0 '
SET @select_cmd = @select_cmd + 'INNER JOIN state_code as sc '
SET @select_cmd = @select_cmd + 'ON pps.pp_state_cd = sc.state_cd '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.appr_method  = ''C'''
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = ' + cast(@input_yr as varchar(4)) 
SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

SET @select_cmd = @select_cmd + ' group by pps.prop_id, pps.sup_num, pps.prop_val_yr, sc.ptd_state_cd, pps.pp_new_val_yr'

exec (@insert_cmd + @select_cmd)
IF @@ERROR <> 0
BEGIN
	print '3'
END


/**********************************/
/* personal property vit segments */
/**********************************/

SET @select_cmd = 'select pps.prop_id, 
	pps.sup_num, 
	pps.prop_val_yr, 
	''V'',
	''S'',
	0, 0, 0, 0,
	0, 0, 0, 0, 0,   
    pv.appraised_val - case when pps.pp_active_flag = ''T'' then sum(isnull(pps.pp_mkt_val,0)) else 0 end as market,
	0,
	0,
	0,
	case when isnull(pps.pp_new_val_yr, 0) =  ' + cast(@input_yr as varchar(4)) + ' then sum(isnull(pp_new_val, 0)) else 0  end as pp_new_val, 0, 0 '

SET @select_cmd = @select_cmd + 'from  property_val as pv '
SET @select_cmd = @select_cmd + 'INNER JOIN pers_prop_seg as pps '
SET @select_cmd = @select_cmd + 'ON pv.prop_id = pps.prop_id '
SET @select_cmd = @select_cmd + 'AND pv.sup_num = pps.sup_num '
SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = pps.prop_val_yr '
SET @select_cmd = @select_cmd + 'AND pps.sale_id = 0 '
SET @select_cmd = @select_cmd + 'INNER JOIN state_code as sc '
SET @select_cmd = @select_cmd + 'ON pps.pp_state_cd = sc.state_cd '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.vit_flag = ''T'''
SET @select_cmd = @select_cmd + ' and pv.appr_method  = ''C'''
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4))

select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

SET @select_cmd = @select_cmd + ' group by pps.prop_id, pps.sup_num, pps.prop_val_yr, pv.appraised_val, pps.pp_active_flag, pps.pp_new_val_yr'

exec (@insert_cmd + @select_cmd)
IF @@ERROR <> 0
BEGIN
	print '4'
END



/******************************************************************/
/* Now handle the VIT property that doesn't have pers_prop_segs...*/
/******************************************************************/
SET @select_cmd = 'select pv.prop_id, 
	pv.sup_num,
	pv.prop_val_yr, 
	''V'',
	''S'',
	0, 0, 0, 0,
	0, 0, 0, 0, 0, 
	sum(isnull(appraised_val,0)),
	0,
	0,
	0,
	0, 0, 0'

SET @select_cmd = @select_cmd + 'from  property_val as pv '
SET @select_cmd = @select_cmd + 'INNER JOIN property as p '
SET @select_cmd = @select_cmd + 'ON pv.prop_id = p.prop_id '
SET @select_cmd = @select_cmd + 'AND p.prop_type_cd = ''P'' '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.vit_flag = ''T'''
SET @select_cmd = @select_cmd + ' and pv.appr_method  = ''C'''
SET @select_cmd = @select_cmd + ' and not exists (select pers_prop_seg.prop_id'
SET @select_cmd = @select_cmd + ' from pers_prop_seg'
SET @select_cmd = @select_cmd + ' where prop_id = pv.prop_id'
SET @select_cmd = @select_cmd + ' and sup_num = pv.sup_num'
SET @select_cmd = @select_cmd + ' and prop_val_yr = pv.prop_val_yr'
SET @select_cmd = @select_cmd + ' and sale_id = 0)'
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) 
SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

SET @select_cmd = @select_cmd + ' group by pv.prop_id, pv.sup_num, pv.prop_val_yr'

exec (@insert_cmd + @select_cmd)
IF @@ERROR <> 0
BEGIN
	print '5'
END

/************************************************************************/
/* Personal Properties that are classified as Mineral, but ARE personal */
/************************************************************************/

SET @select_cmd = 'select pv.prop_id, 
	pv.sup_num,
	pv.prop_val_yr, 
	''MNP'',
	sc.ptd_state_cd,
	0, 0, 0, 0,
	0, 0, 0, 0, 0, 
	sum(isnull(appraised_val,0)),
	0,
	0,
	0,
	0, 0, 0 '

SET @select_cmd = @select_cmd + 'from  property_val as pv '
SET @select_cmd = @select_cmd + 'INNER JOIN property as p '
SET @select_cmd = @select_cmd + 'ON pv.prop_id = p.prop_id '
SET @select_cmd = @select_cmd + 'AND p.prop_type_cd = ''MN'' '
SET @select_cmd = @select_cmd + 'AND LEFT(p.state_cd, 1) <> ''G'' '
SET @select_cmd = @select_cmd + 'INNER JOIN state_code as sc '
SET @select_cmd = @select_cmd + 'ON p.state_cd = sc.state_cd '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.appr_method  = ''C'''
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = ' + cast(@input_yr as varchar(4)) 
SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end


SET @select_cmd = @select_cmd + ' group by  pv.prop_id, pv.sup_num, pv.prop_val_yr, sc.ptd_state_cd'

exec (@insert_cmd + @select_cmd)
IF @@ERROR <> 0
BEGIN
	print '6'
END

/**********************/
/* Mineral Properties */
/**********************/

select @select_cmd = 'select pv.prop_id, 
	pv.sup_num,
	pv.prop_val_yr, 
	''MNP'',
	sc.ptd_state_cd,
	0, 0, 0, 0,
	0, 0, 0, 0, 
	sum(isnull(appraised_val,0)),
    0,
	0,
	0,
	0,
	0, 0, 0 '

SET @select_cmd = @select_cmd + 'from  property_val as pv '
SET @select_cmd = @select_cmd + 'INNER JOIN property as p '
SET @select_cmd = @select_cmd + 'ON pv.prop_id = p.prop_id '
SET @select_cmd = @select_cmd + 'AND p.prop_type_cd = ''MN'' '
SET @select_cmd = @select_cmd + 'AND LEFT(p.state_cd, 1) = ''G'' '
SET @select_cmd = @select_cmd + 'INNER JOIN state_code as sc '
SET @select_cmd = @select_cmd + 'ON p.state_cd = sc.state_cd '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.appr_method  = ''C'''
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = ' + cast(@input_yr as varchar(4)) 
SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

SET @select_cmd = @select_cmd + ' group by pv.prop_id, pv.sup_num, pv.prop_val_yr, sc.ptd_state_cd'

exec (@insert_cmd + @select_cmd)
IF @@ERROR <> 0
BEGIN
	print '7'
END
/**********************************/
/** now populate shared property **/
/**********************************/

SET @select_cmd = 'select pv.prop_id, pv.sup_num, pv.prop_val_yr, ''SHA'',
	sc.ptd_state_cd ,
	case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''I'' and isnull(homesite_flag, ''F'') = ''T'' then (isnull(spv.shared_value,0)) else 0 end as shared_value,
	case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''I'' and isnull(homesite_flag, ''F'') = ''F'' then (isnull(spv.shared_value,0)) else 0 end as shared_value,
	case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''L'' and isnull(homesite_flag, ''F'') = ''T''  and ag_use_code is null then (isnull(spv.shared_value,0)) else 0 end as shared_value,
	case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''L'' and isnull(homesite_flag, ''F'') = ''F''  and ag_use_code is null then (isnull(spv.shared_value,0)) else 0 end as shared_value,
	case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''L'' and isnull(homesite_flag, ''F'') = ''F'' and ag_use_code is not null and (ag_use_code = ''1D1'' or ag_use_code = ''1D1'')
									 then (isnull(ag_use_val,0)) else 0 end as ag_use_val,
	case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''L'' and isnull(homesite_flag, ''F'') = ''F'' and (ag_use_code = ''1D1'' or ag_use_code = ''1D1'') then (isnull(spv.shared_value,0)) else 0 end as shared_value,
 	case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''L'' and isnull(homesite_flag, ''F'') = ''F'' and ag_use_code is not null and (ag_use_code = ''TIM'')
									 then (isnull(ag_use_val,0)) else 0 end as ag_use_val,
	case when prop_type_cd <> ''MN'' and prop_type_cd <> ''P'' and record_type = ''L'' and isnull(homesite_flag, ''F'') = ''F'' and (ag_use_code = ''TIM'') then (isnull(spv.shared_value,0)) else 0 end as shared_value,
	case when prop_type_cd = ''P'' then (isnull(spv.shared_value,0)) else 0 end as shared_value,
	case when prop_type_cd = ''MN''then (isnull(spv.shared_value,0)) else 0 end as shared_value,
	0,
	case when sc.ptd_state_cd like ''D%'' then (isnull(acres, 0)) else 0 end as acres,
	0,
	0, 0, isnull(acres, 0) as acres '

SET @select_cmd = @select_cmd + 'from property_val as pv '
SET @select_cmd = @select_cmd + 'INNER JOIN shared_prop_value as spv '
SET @select_cmd = @select_cmd + 'ON pv.prop_id = spv.pacs_prop_id '
SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = spv.shared_year '
SET @select_cmd = @select_cmd + 'INNER JOIN state_code as sc '
SET @select_cmd = @select_cmd + 'ON spv.state_code = sc.state_cd '
SET @select_cmd = @select_cmd + 'INNER JOIN property as p '
SET @select_cmd = @select_cmd + 'ON pv.prop_id = p.prop_id '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.appr_method  = ''S'''
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) 
SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@insert_cmd + @select_cmd)
IF @@ERROR <> 0
BEGIN
	print '8'
END


/*************************************************/
/*** now populate the income valued properties ***/
/*************************************************/


SET @insert_cmd = 'insert into property_val_state_cd_detail (
prop_id,
sup_num,
prop_val_yr,
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
acres) '
    

SET @select_cmd = 'select  ipa.prop_id, ipa.sup_num, ipa.prop_val_yr, ''INC'', 
 (select top 1 ptd_state_cd from imprv, state_code
	where imprv.imprv_state_cd = state_code.state_cd
	and   prop_id = pv.prop_id
	and   sup_num = pv.sup_num
	and   prop_val_yr = pv.prop_val_yr
	and   sale_id = 0) as state_code , 
0,
pv.imprv_non_hstd_val,
0, pv.land_non_hstd_val, 0, 0, 0, 0, 0, 0, 
0, 0, 0, 0, 0, 0 '

SET @select_cmd = @select_cmd + 'from income_prop_assoc ipa '
SET @select_cmd = @select_cmd + 'INNER JOIN property_val as pv '
SET @select_cmd = @select_cmd + 'ON ipa.prop_id = pv.prop_id '
SET @select_cmd = @select_cmd + 'AND ipa.sup_num = pv.sup_num '
SET @select_cmd = @select_cmd + 'AND ipa.prop_val_yr = pv.prop_val_yr '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
END

SET @select_cmd = @select_cmd + 'WHERE ipa.active_valuation = ''T'' '
SET @select_cmd = @select_cmd + 'AND pv.appr_method  = ''I'' '
SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = ' + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' AND pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@insert_cmd + @select_cmd)
IF @@ERROR <> 0
BEGIN
	print '9'
END

/********************************************************/
/*** set the state code to D1 for all ''D'' state codes ***/
/*** that have productivity value                     ***/
/********************************************************/ 

SET @select_cmd = 'update property_val_state_cd_detail '
SET @select_cmd = @select_cmd + 'set state_cd = ''D1'' '
SET @select_cmd = @select_cmd + 'FROM property_val_state_cd_detail as pvscd '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pvscd.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pvscd.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pvscd.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where ag_use_val + timber_use > 0'
SET @select_cmd = @select_cmd + ' and state_cd like ''D%'''
SET @select_cmd = @select_cmd + ' and pvscd.prop_val_yr = ' + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and pvscd.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pvscd.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pvscd.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '10'
END


/********************************************************/
/*** set the state code to D2 for all ''D'' state codes ***/
/*** that do not have productivity value              ***/
/********************************************************/ 

SET @select_cmd = 'update property_val_state_cd_detail set state_cd = ''D2'' '
SET @select_cmd = @select_cmd + 'FROM property_val_state_cd_detail as pvscd '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pvscd.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pvscd.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pvscd.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where ((ag_use_val + timber_use = 0) and (ag_market + timber_market = 0))'
SET @select_cmd = @select_Cmd + ' and state_cd like ''D%'''
SET @select_cmd = @select_cmd + ' and pvscd.prop_val_yr = ' + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and pvscd.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pvscd.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pvscd.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '11'
END

/***************************************************************/
/**** now propulate the property_owner_entity_state_cd table ***/
/***************************************************************/

select @select_cmd = 'insert into property_val_state_cd(
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
assessed_val,
market_val,
imp_new_val,
ag_acres,
pp_new_val,
land_new_val,
effective_front,
acres)

select pv.prop_id,
       pv.sup_num,
       pv.prop_val_yr,
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
       
from   property_val_state_cd_detail as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) 
SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

SET @select_cmd = @select_cmd + ' group by pv.prop_id, pv.sup_num, pv.prop_val_yr, state_cd'

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '12'
END

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

set @strSQL = 'declare ten_percent_cap cursor fast_forward '
set @strSQL = @strSQL + ' for select pv.prop_id,'
set @strSQL = @strSQL + ' pv.sup_num,'
set @strSQL = @strSQL + ' pv.prop_val_yr,'
set @strSQL = @strSQL + ' pv.ten_percent_cap,'
set @strSQL = @strSQL + ' poes.state_cd,'
set @strSQL = @strSQL + ' poes.imprv_hstd_val,'
set @strSQL = @strSQL + ' poes.land_hstd_val,'
set @strSQL = @strSQL + ' pv.imprv_hstd_val,'
set @strSQL = @strSQL + ' pv.land_hstd_val'
set @strSQL = @strSQL + ' from property_val as pv '
set @strSQL = @strSQL + ' INNER JOIN property_val_state_cd as poes'
set @strSQL = @strSQL + ' ON pv.prop_id = poes.prop_id'
set @strSQL = @strSQL + ' and pv.sup_num = poes.sup_num'
set @strSQL = @strSQL + ' and pv.prop_val_yr = poes.prop_val_yr '

IF @input_pacs_user_id <> 0
BEGIN
	SET @strSQL = @strSQL + 'INNER JOIN recalc_ptd_list as rpl '
	SET @strSQL = @strSQL + 'ON pv.prop_id = rpl.prop_id '
	SET @strSQL = @strSQL + 'AND pv.sup_num = rpl.sup_num '
	SET @strSQL = @strSQL + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @strSQL = @strSQL + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

set @strSQL = @strSQL + ' where  pv.prop_inactive_dt is null'
set @strSQL = @strSQL + ' and    pv.ten_percent_cap is not null'
set @strSQL = @strSQL + ' and    pv.ten_percent_cap > 0'
set @strSQL = @strSQL + ' and    pv.prop_val_yr = ' + convert(varchar(4), @input_yr)
set @strSQL = @strSQL + ' and    pv.sup_num = ' + convert(varchar(12), @input_sup_num)

if (@input_pacs_user_id <> 0)
begin
	SET @strSQL = @strSQL + ' '
end
else if (@input_query <> '')
begin
	 set @strSQL = @strSQL + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	 set @strSQL = @strSQL + ' and pv.prop_id     = ' + convert(varchar(12), @input_prop_id)
end

set @strSQL = @strSQL + ' order by pv.prop_id, poes.state_cd '

exec (@strSQL)
IF @@ERROR <> 0
BEGIN
	print '13'
END

open ten_percent_cap
fetch next from ten_percent_cap into @prop_id, @sup_num, @prop_val_yr, @ten_percent_cap,
				     @state_cd, @imprv_hstd_val, @land_hstd_val, @pv_imprv_hstd_val, @pv_land_hstd_val

while (@@FETCH_STATUS = 0)
begin
	if (@prev_prop_id <> @prop_id) 
	begin
		select @num_records = count(prop_id)
		from property_val_state_cd
		where prop_id = @prop_id
		and    sup_num = @sup_num
		and    prop_val_yr = @prop_val_yr

		set @pos = 1
		set @prop_cap_amt = @ten_percent_cap
		set @prev_prop_id = @prop_id
	end
	
	if (@prop_cap_amt > 0)
	begin
		if ((@land_hstd_val + @imprv_hstd_val) >= @prop_cap_amt and (@pos = @num_records))
		begin
			set @state_cd_cap_amt = @prop_cap_amt
			set @prop_cap_amt     = 0
		end
		else
		begin 
			/* figure out the percentage for the state code */
			if ((@pv_imprv_hstd_val + @pv_land_hstd_val) > 0)
			begin
				set @state_cd_cap_amt =  (@ten_percent_cap) * ( (@land_hstd_val + @imprv_hstd_val)/(@pv_imprv_hstd_val + @pv_land_hstd_val))
			end
			else
			begin
				set @state_cd_cap_amt = @ten_percent_cap
			end
				
			set @prop_cap_amt     = @prop_cap_amt - @state_cd_cap_amt
		end
		
		update property_val_state_cd set ten_percent_cap = @state_cd_cap_amt
		where prop_id = @prop_id
		and   sup_num = @sup_num
		and   prop_val_yr = @prop_val_yr
		and   state_cd    = @state_cd
	end
			
	select @pos = @pos + 1

	fetch next from ten_percent_cap into @prop_id, @sup_num, @prop_val_yr, @ten_percent_cap,
				             @state_cd, @imprv_hstd_val, @land_hstd_val, @pv_imprv_hstd_val, @pv_land_hstd_val

end

close ten_percent_cap
deallocate ten_percent_cap

-- update the assessed


set @strSQL = 'update property_val_state_cd '
set @strSQL = @strSQL + 'set assessed_val = appraised_val - ten_percent_cap '
set @strSQL = @strSQL + 'FROM property_val_state_cd as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @strSQL = @strSQL + 'INNER JOIN recalc_ptd_list as rpl '
	SET @strSQL = @strSQL + 'ON pv.prop_id = rpl.prop_id '
	SET @strSQL = @strSQL + 'AND pv.sup_num = rpl.sup_num '
	SET @strSQL = @strSQL + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @strSQL = @strSQL + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

set @strSQL = @strSQL + ' where pv.prop_val_yr = ' + convert(varchar(4),  @input_yr) 
set @strSQL = @strSQL + ' and pv.sup_num     = ' + convert(varchar(12), @input_sup_num)


if (@input_pacs_user_id <> 0)
begin
	SET @strSQL = @strSQL + ' '
end
else if (@input_query <> '')
begin
	set @strSQL = @strSQL + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	set @strSQL = @strSQL + ' and pv.prop_id = ' + convert(varchar(12), @input_prop_id)
end

exec (@strSQL)
IF @@ERROR <> 0
BEGIN
	print '14'
END
/**************************************************/
/*** now validate the data and make sure that *****/
/*** state codes add up to property val table *****/
/**************************************************/

select @select_cmd = 'insert into property_val_state_cd_summary
(
prop_id,
sup_num,
prop_val_yr,
imprv_hstd_val,
imprv_non_hstd_val,
land_hstd_val,
land_non_hstd_val,
ag_use_val,
ag_market,
timber_use,
timber_market,
appraised_val,
ten_percent_cap,
assessed_val,
market_val)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr,
	sum(imprv_hstd_val) as imprv_hstd_val,
	sum(imprv_non_hstd_val) as imprv_non_hstd_val,
	sum(land_hstd_val) as land_hstd_val,                    
 	sum(land_non_hstd_val) as land_non_hstd_val,
 	sum(ag_use_val) as ag_use_val,
	sum(ag_market) as ag_market,
	sum(timber_use) as timber_use,
	sum(timber_market) as timber_market,
	sum(appraised_val) as appraised_val,
	sum(ten_percent_cap) as ten_percent_cap,
	sum(assessed_val) as assessed_val,
	sum(market_val) as market_val

from property_val_state_cd as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_val_yr = '  + cast(@input_yr as varchar(4)) 
SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

SET @select_cmd = @select_cmd + ' group by pv.prop_id, pv.sup_num, pv.prop_val_yr'

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '15'
END

/*******************************************************/
/******** Now look for errors and log them in the ******/
/******** prop_recalc_errors tables ********************/
/*******************************************************/



select @select_cmd = 'insert into prop_recalc_errors
(prop_id,
sup_num,
sup_yr,
ptd_imprv_hstd_val,
pv_imprv_hstd_val,
ptd_imprv_non_hstd_val,
pv_imprv_non_hstd_val,
ptd_land_hstd_val,
pv_land_hstd_val,
ptd_land_non_hstd_val,
pv_land_non_hstd_val,
ptd_ag_use_val,
pv_ag_use_val,
ptd_ag_market,
pv_ag_market,
ptd_timber_use,
pv_timber_use,
ptd_timber_market,
pv_timber_market,
ptd_appraised_val,
pv_appraised_val,
ptd_ten_percent_cap,
pv_ten_percent_cap,
ptd_assessed_val,
pv_assessed_val,
ptd_market_val,
pv_market_val,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr,
	psc.imprv_hstd_val,
	pv.imprv_hstd_val,
	psc.imprv_non_hstd_val,
	pv.imprv_non_hstd_val,
	psc.land_hstd_val,
	pv.land_hstd_val,
 	psc.land_non_hstd_val,
	pv.land_non_hstd_val,
 	psc.ag_use_val,
	pv.ag_use_val,
	psc.timber_use,
	pv.timber_use,
	psc.ag_market,
	pv.ag_market,
	psc.timber_market,
	pv.timber_market,
	psc.appraised_val,
	pv.appraised_val,
	psc.ten_percent_cap,
	pv.ten_percent_cap,
	psc.assessed_val,
	pv.assessed_val,
	psc.market_val,
	pv.market, '
+ '''' +  @error_type  + ''', ' + 
'''' +  @error + ''' 
from property_val_state_cd_summary as psc '
SET @select_cmd = @select_cmd + 'INNER JOIN property_val as pv '
SET @select_cmd = @select_cmd + 'ON psc.prop_id = pv.prop_id '
SET @select_cmd = @select_cmd + 'and psc.sup_num = pv.sup_num '
SET @select_cmd = @select_cmd + 'and psc.prop_val_yr = pv.prop_val_yr '
SET @select_cmd = @select_cmd + 'and ((psc.imprv_hstd_val <> pv.imprv_hstd_val)
or    (                          
	psc.imprv_non_hstd_val <>        
	pv.imprv_non_hstd_val )
or    (                   
	psc.land_hstd_val     <>    
	pv.land_hstd_val       )               
or    (	psc.land_non_hstd_val  <>    
	pv.land_non_hstd_val)
or    (	psc.ag_use_val  <>      
	pv.ag_use_val )
or    ( psc.timber_use  <>     
	pv.timber_use )
or    (	psc.ag_market   <>          
	pv.ag_market   )
or    (	psc.timber_market <>     
	pv.timber_market )                          
or    (	psc.appraised_val <>   
	pv.appraised_val )
or    ( psc.ten_percent_cap <>

	pv.ten_percent_cap )
or    (	psc.assessed_val <>
	pv.assessed_val)     
or  (psc.market_val <>
      pv.market) )'

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.appr_method  = ''C''  
and   pv.prop_val_yr = ' + cast(@input_yr as varchar(4)) 


select @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '16'
END



select @select_cmd =  'insert into prop_recalc_errors
(prop_id,
sup_num,
sup_yr,
ptd_imprv_hstd_val,
pv_imprv_hstd_val,
ptd_imprv_non_hstd_val,
pv_imprv_non_hstd_val,
ptd_land_hstd_val,
pv_land_hstd_val,
ptd_land_non_hstd_val,
pv_land_non_hstd_val,
ptd_ag_use_val,
pv_ag_use_val,
ptd_ag_market,
pv_ag_market,
ptd_timber_use,
pv_timber_use,
ptd_timber_market,
pv_timber_market,
ptd_appraised_val,
pv_appraised_val,
ptd_ten_percent_cap,
pv_ten_percent_cap,
ptd_assessed_val,
pv_assessed_val,
error_type,
error)

select pv.prop_id,
	pv.sup_num ,   
	pv.prop_val_yr,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	psc.assessed_val,
	pv.shared_prop_val,  ' 
+ ''''  + @error_type  + ''', ' + 
'''' +  @error + ''' 
from property_val_state_cd_summary as psc '
SET @select_cmd = @select_cmd + 'INNER JOIN property_val as pv '
SET @select_cmd = @select_cmd + 'ON psc.prop_id = pv.prop_id '

SET @select_cmd = @select_cmd + 'and psc.sup_num = pv.sup_num '
SET @select_cmd = @select_cmd + 'and psc.prop_val_yr = pv.prop_val_yr '
SET @select_cmd = @select_cmd + 'and (psc.market_val <> pv.market) '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.appr_method  = ''S'''
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = ' + cast(@input_yr as varchar(4)) 
SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)   
IF @@ERROR <> 0
BEGIN
	print '17'
END

/****************************************************************************************************/
/** also need to make entries for those properties that didn't have any entries in the state code  **/
/**   table, this would indicate that they had null state code values on all segments              **/
/****************************************************************************************************/

SET @select_cmd = 'insert into  prop_recalc_errors
(prop_id,
sup_num,
sup_yr,
ptd_imprv_hstd_val,
pv_imprv_hstd_val,
ptd_imprv_non_hstd_val,
pv_imprv_non_hstd_val,
ptd_land_hstd_val,
pv_land_hstd_val,
ptd_land_non_hstd_val,
pv_land_non_hstd_val,
ptd_ag_use_val,
pv_ag_use_val,
ptd_ag_market,
pv_ag_market,
ptd_timber_use,
pv_timber_use,
ptd_timber_market,
pv_timber_market,
ptd_appraised_val,
pv_appraised_val,
ptd_ten_percent_cap,
pv_ten_percent_cap,
ptd_assessed_val,
pv_assessed_val,
ptd_market_val,
pv_market_val,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr,
	0,
	pv.imprv_hstd_val,
	0,
	pv.imprv_non_hstd_val,
	0,
	pv.land_hstd_val,
 	0,
	pv.land_non_hstd_val,
 	0,
	pv.ag_use_val,
	0,
	pv.timber_use,
	0,
	pv.ag_market,
	0,
	pv.timber_market,
	0,
	pv.appraised_val,
	0,
	pv.ten_percent_cap,
	0,
	pv.assessed_val,
 	0,
	pv.market, ' 
+ '''' +  @error_type  + ''', ' + 
'''' +  @error + ''' 
	
from property_val as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.assessed_val <> 0'

SET @select_cmd = @select_cmd + ' and not exists (select psc.prop_id from property_val_state_cd_summary psc'
SET @select_cmd = @select_cmd + ' where psc.prop_id = pv.prop_id'
SET @select_cmd = @select_cmd + ' and psc.sup_num = pv.sup_num'
SET @select_cmd = @select_cmd + ' and psc.prop_val_yr = pv.prop_val_yr)'

SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = ' + cast(@input_yr as varchar(4)) 
SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '18'
END



/******************************************************************/
/******* now do some preliminary checks to make sure the user *****/
/******* has entered the proper state codes on the propery    *****/
/******************************************************************/

SET @ptd_error = 'Properties with HS, OV65, DP must have HOMESITE value > 0 with A, B,  E, F or M state category codes'
SET @select_cmd = 'insert into  prop_recalc_errors
(prop_id,
sup_num,
sup_yr,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = ' + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and exists (select property_exemption.prop_id from property_exemption where prop_id = pv.prop_id'
SET @select_cmd = @select_cmd + ' and sup_num = pv.sup_num'
SET @select_cmd = @select_cmd + ' and owner_tax_yr = pv.prop_val_yr'
SET @select_cmd = @select_cmd + ' and (exmpt_type_cd = ''HS'''
SET @select_cmd = @select_cmd + ' or exmpt_type_cd = ''OV65'''
SET @select_cmd = @select_cmd + ' or exmpt_type_cd = ''OV65S'''
SET @select_cmd = @select_cmd + ' or exmpt_type_cd = ''DP'') )'
SET @select_cmd = @select_cmd + ' and ( ((pv.imprv_hstd_val + pv.land_hstd_val) = 0) or not exists (select property_val_state_cd.prop_id from property_val_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					               and   prop_val_yr = pv.prop_val_yr
						       and  (state_cd like ''A%''
						       or    state_cd like ''B%''
						       or    state_cd like ''E%''
						       or    state_cd like ''F%''
						       or    state_cd like ''M%''
						       or    state_cd like ''X%'')))'

SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '19'
END


/*************************************
 ***************** new stuff *********
 *************************************/

SET @ptd_error = 'Segments with HOMESITE value > 0 must have an A, B, E, F or M state category codes'
SET @select_cmd = 'insert into  prop_recalc_errors
(prop_id,
sup_num,
sup_yr,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and exists (select property_exemption.prop_id from property_exemption where prop_id = pv.prop_id
					       and   sup_num = pv.sup_num
					       and   owner_tax_yr = pv.prop_val_yr
					       and   (exmpt_type_cd = ''HS'')  )
and   exists (select property_val_state_cd.prop_id from property_val_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					               and   prop_val_yr = pv.prop_val_yr
						       and  (state_cd not like ''A%''
						       and   state_cd not like ''B%''
						       and   state_cd not like ''E%''
						       and   state_cd not like ''F%''
						       and   state_cd not like ''M%''
						       and   state_cd not like ''X%'')
						       and   imprv_hstd_val + land_hstd_val > 0)'


SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '20'
END


SET @ptd_error = 'Properties with X state codes must have an EX or EX366 exemptions'
SET @select_cmd = 'insert into  prop_recalc_errors
(prop_id,
sup_num,
sup_yr,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and   not exists (select property_exemption.prop_id from property_exemption where prop_id = pv.prop_id
					       and   sup_num = pv.sup_num
					       and   owner_tax_yr = pv.prop_val_yr
					       and   (exmpt_type_cd = ''EX''
					       or    exmpt_type_cd = ''EX366''))
and  exists (select property_val_state_cd.prop_id from property_val_state_cd  where prop_id = pv.prop_id
						       and   sup_num = pv.sup_num
					               and   prop_val_yr = pv.prop_val_yr
						       and  (state_cd like ''X%''))'


SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '21'
END
/************************************/
/******************end new stuff ****/
/************************************/


SET @ptd_error = 'Properties with an A state code that has land value, must also have improvement value on the A state code'
SET @select_cmd = 'insert into  prop_recalc_errors
(prop_id,
sup_num,
sup_yr,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '

	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and exists (select property_val_state_cd.prop_id from property_val_state_cd  where prop_id = pv.prop_id
						       and sup_num = pv.sup_num
	  		                   and prop_val_yr = pv.prop_val_yr
						       and state_cd like ''A%''
						       and land_hstd_val + land_non_hstd_val  > 0 )
and not exists (select property_val_state_cd.prop_id from property_val_state_cd  where prop_id = pv.prop_id
						       and sup_num = pv.sup_num
					           and prop_val_yr = pv.prop_val_yr
						       and state_cd like ''A%''
						       and land_hstd_val + land_non_hstd_val  > 0)'


SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
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
IF @@ERROR <> 0
BEGIN
	print '22'
END

SET @ptd_error = 'Properties with an E state code that has land value, must also have improvement value on the E state code'
SET @select_cmd = 'insert into  prop_recalc_errors
(
prop_id,
sup_num,
sup_yr,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and exists (select property_val_state_cd.prop_id from property_val_state_cd  where prop_id = pv.prop_id
						       and sup_num = pv.sup_num
					           and prop_val_yr = pv.prop_val_yr
						       and state_cd like ''E%''
						       and land_hstd_val + land_non_hstd_val  > 0 )
and not exists (select property_val_state_cd.prop_id from property_val_state_cd  where prop_id = pv.prop_id
						       and sup_num = pv.sup_num
					           and prop_val_yr = pv.prop_val_yr
						       and state_cd like ''E%''
						       and land_hstd_val + land_non_hstd_val  > 0)'


SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '23'
END


SET @ptd_error = 'Properties with Improvement Value must also have a state code of A, B, E, F1, F2, J1-J9, M1, N, O'
SET @select_cmd = 'insert into  prop_recalc_errors
(
prop_id,
sup_num,
sup_yr,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and exists (select property_val_state_cd.prop_id from property_val_state_cd  where prop_id = pv.prop_id
									and sup_num = pv.sup_num
									and prop_val_yr = pv.prop_val_yr
									and imprv_hstd_val + imprv_non_hstd_val > 0 
									and state_cd not in (''A'', ''B'', ''E'', ''F1'', ''F2'', ''J1'', ''J2'', ''J3'', ''J4'', ''J5'', ''J6'', ''J7'', ''J8'', ''J9'', ''M1'', ''N'', ''O'', ''X''))'

SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '24'
END



SET @ptd_error = 'Properties with Personal Property Value must also have a state code of H, F2,  J1-J9, L1, L2, M2, N or S'
SET @select_cmd = 'insert into  prop_recalc_errors
(prop_id,
sup_num,
sup_yr,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and exists (select property_val_state_cd.prop_id from property_val_state_cd  where prop_id = pv.prop_id
									and sup_num = pv.sup_num
									and prop_val_yr = pv.prop_val_yr
									and personal_val > 0 
									and state_cd not in (''H'', ''F2'', ''J1'', ''J2'', ''J3'', ''J4'', ''J5'', ''J6'', ''J7'', ''J8'', ''J9'', ''L1'', ''L2'', ''M2'', ''N'', ''S'', ''X''))'

SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '25'
END


SET @ptd_error = 'Properties with Mineral Value must also have a state code of G1, G2, or G3'
SET @select_cmd = 'insert into  prop_recalc_errors
(prop_id,
sup_num,
sup_yr,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and exists (select property_val_state_cd.prop_id from property_val_state_cd  where prop_id = pv.prop_id
									and sup_num = pv.sup_num
									and prop_val_yr = pv.prop_val_yr
									and mineral_val > 0 
									and state_cd not in (''G1'', ''G2'', ''G3'', ''X''))'

SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '26'
END

SET @ptd_error = 'Properties with Land Value must also have a state code of A, B, C, D1, D2, E, F1, F2, J1-J9, N, or O'
SET @select_cmd = 'insert into  prop_recalc_errors
(prop_id,
sup_num,
sup_yr,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and exists (select * from property_val_state_cd  where prop_id = pv.prop_id
									and sup_num = pv.sup_num
									and prop_val_yr = pv.prop_val_yr
									and land_hstd_val + land_non_hstd_val > 0 
									and state_cd not in (''A'', ''B'', ''C'', ''D1'', ''D2'', ''E'', ''F1'', ''F2'', ''J1'', ''J2'', ''J3'', ''J4'', ''J5'', ''J6'', ''J7'', ''J8'', ''J9'', ''N'', ''O'', ''X''))'

SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '27'
END

SET @ptd_error = 'Properties with state code of D1 must have a productivity value > 0'
SET @select_cmd = 'insert into  prop_recalc_errors
(prop_id,
sup_num,
sup_yr,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 

from property_val as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and exists (select property_val_state_cd.prop_id from property_val_state_cd  where prop_id = pv.prop_id
									and sup_num = pv.sup_num
									and prop_val_yr = pv.prop_val_yr
									and ag_use_val + timber_use = 0 
									and state_cd = ''D1'')'

SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '28'
END

SET @ptd_error = 'Properties with productivity value > 0 must have a state code of D1'
SET @select_cmd = 'insert into  prop_recalc_errors
(prop_id,
sup_num,
sup_yr,
error_type,
error)

select pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr ,' +
	'''' +  @ptd_error_type  + ''', ' + 
'''' +  @ptd_error + ''' 
	
from property_val as pv '

IF @input_pacs_user_id <> 0
BEGIN
	SET @select_cmd = @select_cmd + 'INNER JOIN recalc_ptd_list as rpl '
	SET @select_cmd = @select_cmd + 'ON pv.prop_id = rpl.prop_id '
	SET @select_cmd = @select_cmd + 'AND pv.sup_num = rpl.sup_num '
	SET @select_cmd = @select_cmd + 'AND pv.prop_val_yr = rpl.sup_yr '
	SET @select_cmd = @select_cmd + 'AND rpl.pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
END

SET @select_cmd = @select_cmd + ' where pv.prop_inactive_dt is null'
SET @select_cmd = @select_cmd + ' and pv.prop_val_yr = '  + cast(@input_yr as varchar(4))
SET @select_cmd = @select_cmd + ' and exists (select property_val_state_cd.prop_id from property_val_state_cd  where prop_id = pv.prop_id
									and sup_num = pv.sup_num
									and prop_val_yr = pv.prop_val_yr
									and ag_use_val + timber_use > 0 
									and state_cd <> ''D1'')'

SET @select_cmd = @select_cmd + ' and pv.sup_num = ' + cast(@input_sup_num as varchar(12))

if (@input_pacs_user_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' '
end
else if (@input_query <> '')
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id in (' + @input_query + ')'
end
else if (@input_prop_id <> 0)
begin
	SET @select_cmd = @select_cmd + ' and pv.prop_id = ' + cast(@input_prop_id as varchar(20))
end

exec (@select_cmd)
IF @@ERROR <> 0
BEGIN
	print '29'
END

if (@input_pacs_user_id <> 0)
begin
	SET @delete_ptd_list = 'delete from recalc_ptd_list where pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20))
	exec (@delete_ptd_list)
end

GO

