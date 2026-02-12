
CREATE PROCEDURE PrepARBListing

@input_user_id		int,
@input_year		numeric(4,0),
@input_date_sql		varchar(500),
@input_status_cd_sql	varchar(255),
@input_appraiser_sql	varchar(255),
@input_arb_board_sql	varchar(255),
@input_prior_value	varchar(1),
@input_state		varchar(1),
@input_sort_sql		varchar(500)

AS

--Echo off...
set NOCOUNT ON

--Declare variables
declare @exec_sql	varchar(5000)
declare @prop_id	int
declare @owner_id	int
declare @sup_num	int
declare @case_id	int
declare @appr_year	numeric(4,0)
declare @exmpt_type_cd  varchar(5)
declare @entity_cd	varchar(5)
declare @str_exemption	varchar(50)
declare @str_entity	varchar(50)
declare @found_flag	varchar(1)

--Set variables
set @found_flag = 'F'

--Remove all records for this user first...
delete from arb_listing where pacs_user_id = @input_user_id

--Build SQL to be exec'd...
set @exec_sql = '
insert into arb_listing
(
	pacs_user_id,
	case_id,
	appr_year,
	prop_id,
	sup_num,
	owner_id,
	pct_ownership,
	geo_id,
	prop_type_cd,
	arb_board_cd,
	arb_hearing_date,
	taxpayer_comment,
	curr_other,
	curr_ag_mkt,
	curr_ag_use,
	curr_land,
	curr_imprv,
	curr_appraised,
	curr_cap,
	curr_assessed,
	prev_other,
	prev_ag_mkt,
	prev_ag_use,
	prev_land,
	prev_imprv,
	prev_appraised,
	prev_cap,
	prev_assessed,
	diff_other,
	diff_ag_mkt,
	diff_ag_use,
	diff_land,
	diff_imprv,
	diff_appraised,
	diff_cap,
	diff_assessed,
	legal_desc,
	situs,
	entities,
	exemption,
	inquiry_type_cd
)
select
	' + cast(@input_user_id as varchar(10)) + ',
	case_id,
	' + case when @input_year > 0 then cast(@input_year as varchar(4)) else 'appr_year' end + ',
	prop_id,
	sup_num,
	owner_id,
	pct_ownership,
	geo_id,
	prop_type_cd,
	arb_board,
	arb_hearing_date,
	inquiry_taxpayer_comment,
	IsNull(assessed_val, 0),
	IsNull(ag_market, 0) + IsNull(timber_market, 0),
	IsNull(ag_use_val, 0) + IsNull(timber_use, 0),
	IsNull(land_hstd_val, 0) + IsNull(land_non_hstd_val, 0),
	IsNull(imprv_hstd_val, 0) + IsNull(imprv_non_hstd_val, 0),
	IsNull(appraised_val, 0),
	IsNull(ten_percent_cap, 0),
	IsNull(assessed_val, 0),
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,	                                                                                                                                                                                                                              
	legal_desc,
	'''',
	'''',
	'''',
	inquiry_type_cd
from ARB_LISTING_VW'

--Add on all the rest from the GUI...
if ((@input_year is not null) and (@input_year > 0))
begin
	if (@found_flag = 'F')
	begin
		set @exec_sql = @exec_sql + ' WHERE '
	end
	else
	begin
		set @exec_sql = @exec_sql + ' AND '
	end

	set @exec_sql = @exec_sql + 'appr_year = ' + cast(@input_year as varchar(4))

	set @found_flag = 'T'
end

if ((@input_date_sql is not null) and (len(@input_date_sql) > 0))
begin
	if (@found_flag = 'F')
	begin
		set @exec_sql = @exec_sql + ' WHERE '
	end
	else
	begin
		set @exec_sql = @exec_sql + ' AND '
	end

	set @exec_sql = @exec_sql + @input_date_sql

	set @found_flag = 'T'
end

if ((@input_status_cd_sql is not null) and (len(@input_status_cd_sql) > 0))
begin
	if (@found_flag = 'F')
	begin
		set @exec_sql = @exec_sql + ' WHERE '
	end
	else
	begin
		set @exec_sql = @exec_sql + ' AND '
	end

	set @exec_sql = @exec_sql + @input_status_cd_sql

	set @found_flag = 'T'
end

if ((@input_appraiser_sql is not null) and (len(@input_appraiser_sql) > 0))
begin
	if (@found_flag = 'F')
	begin
		set @exec_sql = @exec_sql + ' WHERE '
	end
	else
	begin
		set @exec_sql = @exec_sql + ' AND '
	end

	set @exec_sql = @exec_sql + @input_appraiser_sql

	set @found_flag = 'T'
end

if ((@input_arb_board_sql is not null) and (len(@input_arb_board_sql) > 0))
begin
	if (@found_flag = 'F')
	begin
		set @exec_sql = @exec_sql + ' WHERE '
	end
	else
	begin
		set @exec_sql = @exec_sql + ' AND '
	end

	set @exec_sql = @exec_sql + @input_arb_board_sql

	set @found_flag = 'T'
end

if ((@input_state is not null) and (len(@input_state) > 0) and (@input_state <> 'B'))
begin
	if (@found_flag = 'F')
	begin
		set @exec_sql = @exec_sql + ' WHERE '
	end
	else
	begin
		set @exec_sql = @exec_sql + ' AND '
	end

	if (@input_state = 'C')
	begin
		set @exec_sql = @exec_sql + 'close_by_id > 0'
	end
	else if (@input_state = 'A')
	begin
		set @exec_sql = @exec_sql + 'close_by_id = 0'
	end

	set @found_flag = 'T'
end

if ((@input_sort_sql is not null) and (len(@input_sort_sql) > 0))
begin
	set @exec_sql = @exec_sql + ' ORDER BY ' + @input_sort_sql
end

--Execute the SQL that has been created...
exec(@exec_sql)

--Set prior value
--'L' -> Last Year's Appraised Value
--'T' -> This Year's Notice Value
if (@input_prior_value = 'L')
begin
	update arb_listing
	set 	prev_other     = IsNull(assessed_val, 0),
    		prev_ag_mkt    = IsNull(ag_market, 0) + IsNull(timber_market, 0),
		prev_ag_use    = IsNull(ag_use_val, 0) + IsNull(timber_use, 0),
		prev_land      = IsNull(land_hstd_val, 0) + IsNull(land_non_hstd_val, 0),
		prev_imprv     = IsNull(imprv_hstd_val, 0) + IsNull(imprv_non_hstd_val, 0),
		prev_appraised = IsNull(appraised_val, 0),
		prev_cap       = IsNull(ten_percent_cap, 0),
		prev_assessed  = IsNull(assessed_val, 0)
	from property_val, prop_supp_assoc
	where prop_supp_assoc.prop_id 		= property_val.prop_id
	and   prop_supp_assoc.sup_num 		= property_val.sup_num
	and   prop_supp_assoc.owner_tax_yr 	= property_val.prop_val_yr
	and   prop_supp_assoc.prop_id 		= arb_listing.prop_id
	and   prop_supp_assoc.owner_tax_yr	= (arb_listing.appr_year - 1)
end
else if (@input_prior_value = 'T')
begin
	update arb_listing
	set 	prev_other     = IsNull(begin_assessed, 0),
	    	prev_ag_mkt    = IsNull(begin_ag_mkt, 0) + IsNull(begin_timb_mkt, 0),
		prev_ag_use    = IsNull(begin_ag_use, 0) + IsNull(begin_timb_use, 0),	
		prev_land      = IsNull(begin_land_hstd, 0) + IsNull(begin_land_non_hstd, 0),
		prev_imprv     = IsNull(begin_imprv_hstd, 0) + IsNull(begin_imprv_non_hstd, 0),
		prev_appraised = IsNull(begin_appraised, 0),
		prev_cap       = IsNull(begin_ten_percent_cap, 0),
		prev_assessed  = IsNull(begin_assessed, 0)
	from arb_protest
	where arb_protest.appr_year = arb_listing.appr_year
	and arb_protest.prop_id = arb_listing.prop_id
	and arb_protest.case_id = arb_listing.case_id
	and arb_protest.sup_num = arb_listing.sup_num
	and arb_listing.pacs_user_id = @input_user_id
end

--Set diff_* fields in the arb_listing table...
update arb_listing
set 	diff_other 	= IsNull(curr_other - prev_other, 0),
    	diff_ag_mkt 	= IsNull(curr_ag_mkt - prev_ag_mkt, 0),
	diff_ag_use	= IsNull(curr_ag_use - prev_ag_use, 0),
	diff_land	= IsNull(curr_land - prev_land, 0),
	diff_imprv	= IsNull(curr_imprv - prev_imprv, 0),
	diff_appraised	= IsNull(curr_appraised - prev_appraised, 0),
	diff_cap	= IsNull(curr_cap - prev_cap, 0),
	diff_assessed	= IsNull(curr_assessed - prev_assessed, 0)
where arb_listing.pacs_user_id = @input_user_id

--Set *_other fields in the arb_listing table...
update arb_listing
set curr_other = 0,
    prev_other = 0,
    diff_other = 0
where pacs_user_id = @input_user_id

--Set situs information for the arb_listing records...
update arb_listing
set    situs = 	REPLACE(isnull(situs_display, ''), CHAR(13) + CHAR(10), ' ')
from situs
where arb_listing.prop_id = situs.prop_id
and   situs.primary_situs = 'Y'
and arb_listing.pacs_user_id = @input_user_id


--Build list of exemptions
DECLARE PROPERTY_EXEMPTION SCROLL CURSOR
FOR select arb_listing.prop_id,
	   arb_listing.owner_id,
	   arb_listing.sup_num,
	   arb_listing.case_id,
	   arb_listing.appr_year,
	   property_exemption.exmpt_type_cd
    from  property_exemption, arb_listing
    where property_exemption.prop_id = arb_listing.prop_id
    and   property_exemption.owner_id = arb_listing.owner_id
    and   property_exemption.sup_num  = arb_listing.sup_num
    and   property_exemption.owner_tax_yr = arb_listing.appr_year
    and   arb_listing.pacs_user_id = @input_user_id
    order by exmpt_type_cd
  
OPEN PROPERTY_EXEMPTION
FETCH NEXT from PROPERTY_EXEMPTION into @prop_id, @owner_id, @sup_num, @case_id, @appr_year, @exmpt_type_cd

while (@@FETCH_STATUS = 0)
begin
	select @str_exemption = exemption from arb_listing
	where prop_id   = @prop_id
	and   owner_id  = @owner_id
	and   sup_num   = @sup_num
	and   case_id	= @case_id
	and   appr_year = @appr_year
	and   pacs_user_id = @input_user_id

	if (Len(@str_exemption) = 0)
	begin
		set @str_exemption = RTRIM(@exmpt_type_cd)
	end
	else
	begin
		set @str_exemption = @str_exemption + ', ' + RTRIM(@exmpt_type_cd)
	end

	update arb_listing
	set exemption = @str_exemption
	where prop_id   = @prop_id
	and   owner_id  = @owner_id
	and   sup_num   = @sup_num
	and   case_id	= @case_id
	and   appr_year = @appr_year
	and   pacs_user_id = @input_user_id
	
	FETCH NEXT from PROPERTY_EXEMPTION into @prop_id, @owner_id, @sup_num, @case_id, @appr_year, @exmpt_type_cd
end

CLOSE PROPERTY_EXEMPTION
DEALLOCATE PROPERTY_EXEMPTION

/* Build list of entities */

DECLARE PROPERTY_ENTITY SCROLL CURSOR
FOR select arb_listing.prop_id,
	   arb_listing.owner_id,
	   arb_listing.sup_num,
	   arb_listing.case_id,
	   arb_listing.appr_year,
	   entity_cd
    from  entity_prop_assoc, entity, arb_listing
    where entity_prop_assoc.prop_id = arb_listing.prop_id
    and   entity_prop_assoc.sup_num  = arb_listing.sup_num
    and   entity_prop_assoc.tax_yr = arb_listing.appr_year
    and   arb_listing.pacs_user_id = @input_user_id
    and   entity_prop_assoc.entity_id = entity.entity_id
    order by entity_cd
  
OPEN PROPERTY_ENTITY
FETCH NEXT from PROPERTY_ENTITY into @prop_id, @owner_id, @sup_num, @case_id, @appr_year, @entity_cd

while (@@FETCH_STATUS = 0)
begin
	select @str_entity = entities from arb_listing
	where prop_id   = @prop_id
	and   owner_id  = @owner_id
	and   sup_num   = @sup_num
	and   case_id	= @case_id
	and   appr_year = @input_year
	and   pacs_user_id = @input_user_id

	if (Len(@str_entity) = 0)
	begin
		set @str_entity = RTRIM(@entity_cd)
	end
	else
	begin
		set @str_entity = @str_entity + ', ' + RTRIM(@entity_cd)
	end

	update arb_listing
	set entities = @str_entity
	where prop_id   = @prop_id
	and   owner_id  = @owner_id
	and   sup_num   = @sup_num
	and   case_id	= @case_id
	and   appr_year = @appr_year
	and   pacs_user_id = @input_user_id

	FETCH NEXT from PROPERTY_ENTITY into @prop_id, @owner_id, @sup_num, @case_id, @appr_year, @entity_cd

end

CLOSE PROPERTY_ENTITY
DEALLOCATE PROPERTY_ENTITY

GO

