

create procedure dbo.PPRenditionReport

@lYear		numeric(4),
@lSupNum	int,
@cOption	char(1),	  -- 'A' as of; 'I' individual
@cSort		char(2)		  -- 'A' alpha, 'G' geo, 'R1' refid1, 'R2' refid2
as

declare @strSQL		varchar(1024)


truncate table pp_rendition_penalty_report

create table #temp_list
(
prop_id		int,
prop_val_yr	numeric(4),
sup_num		int
)

set @strSQL = 'insert into #temp_list (prop_id, prop_val_yr, sup_num)'
set @strSQL = @strSQL + ' select property_Val.prop_id, property_Val.prop_val_yr, max(property_Val.sup_num) as sup_Num'
set @strSQL = @strSQL + ' from property_val, property'
set @strSQL = @strSQL + ' where property.prop_id = property_Val.prop_id '
set @strSQL = @strSQL + ' and property.prop_type_cd = ''P'''
set @strSQL = @strSQL + ' and property_Val.prop_val_yr  =' + convert(varchar(4),  @lYear)

if (@cOption = 'A')
begin
	set @strSQL = @strSQL + ' and   property_Val.sup_num     <=' + convert(varchar(10),  @lSupNum)
end
else
begin
	set @strSQL = @strSQL + ' and   property_Val.sup_num     =' + convert(varchar(10),  @lSupNum)
end

set @strSQL = @strSQL + ' group by property_Val.prop_id, property_Val.prop_val_yr '


exec (@strSQL)
	


set @strSQL = 'insert into pp_rendition_penalty_report (prop_id, owner_id, rendition_year, owner_name, legal_desc, situs_address, market_value, geo_id, '
set @strSQL = @strSQL + ' ref_id1, ref_id2 )'
set @strSQL = @strSQL + 'select' 
set @strSQL = @strSQL + ' pp.prop_id, '
set @strSQL = @strSQL + ' pp.owner_id, '
set @strSQL = @strSQL + ' pp.rendition_year, '
set @strSQL = @strSQL + ' pp.owner_name, '
set @strSQL = @strSQL + ' pp.legal_desc, '
set @strSQL = @strSQL + ' pp.situs_address,' 
set @strSQL = @strSQL + ' pp.market_value, '
set @strSQL = @strSQL + ' pp.geo_id, '
set @strSQL = @strSQL + ' pp.ref_id1, '
set @strSQL = @strSQL + ' pp.ref_id2 '
set @strSQL = @strSQL + ' from pp_rendition_prop_penalty pp, #temp_list tl '
set @strSQL = @strSQL + ' where pp.prop_id = tl.prop_id '
set @strSQL = @strSQL + ' and   pp.sup_num = tl.sup_num '
set @strSQL = @strSQL + ' and   pp.rendition_year = tl.prop_val_yr ' 
set @strSQL = @strSQL + ' and	pp.late_rendition_penalty_flag = 1 '

if (@cSort = 'A')
begin
	set @strSQL = @strSQL + ' order by pp.owner_name, pp.geo_id, pp.ref_id1, pp.ref_id2 '
end
else if (@cSort = 'G')
begin
	set @strSQL = @strSQL + ' order by pp.geo_id, pp.owner_name, pp.ref_id1, pp.ref_id2 '
end
else if (@cSort = 'R1')
begin
	set @strSQL = @strSQL + ' order by pp.ref_id1, pp.owner_name, pp.geo_id, pp.ref_id2 '
end
else if (@cSort = 'R2')
begin
	set @strSQL = @strSQL + ' order by pp.ref_id2, pp.owner_name, pp.geo_id, pp.ref_id1 '
end

exec (@strSQL)


drop table #temp_list

GO

