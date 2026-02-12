
CREATE PROCEDURE ARBInquiryListing

@dataset_id int,
@input_year				numeric(4,0),
@input_appraiser_meeting_date_sql	varchar(1024),
@input_status_cd_sql			varchar(1024),
@input_appraiser_sql			varchar(1024),
@input_prior_value			varchar(1),
@input_state_sql			varchar(1024),
@input_last_appraiser_sql varchar(1024),
@input_meeting_appraiser_sql varchar(1024)

AS

--Echo off...
set NOCOUNT ON

--Declare variables
declare @exec_sql	varchar(8000)
declare @prop_id	int
declare @owner_id	int
declare @sup_num	int
declare @case_id	int
declare @prop_val_yr	numeric(4,0)
declare @exmpt_type_cd  varchar(5)
declare @entity_cd	varchar(5)
declare @str_exemption	varchar(50)
declare @str_entity	varchar(50)
declare @found_flag	varchar(1)

--Set variables
set @found_flag = 'F'

--Build SQL to be exec'd...
set @exec_sql = '
insert ##arb_inquiry_listing
(
	dataset_id,
	case_id,
	prop_val_yr,
	prop_id,
	sup_num,
	owner_id,
	pct_ownership,
	geo_id,
	prop_type_cd,
	inq_taxpayer_comments,
	curr_other,
	curr_ag_mkt,
	curr_ag_use,
	curr_land,
	curr_imprv,
	curr_appraised,
	curr_cap,
	curr_assessed,
	legal_desc,
	situs,
	entities,
	exemptions,
	inq_type,
	meeting_appraiser_nm,
	inq_by_name,
	inq_by_addr_line1,
	inq_by_addr_line2,
	inq_by_addr_line3,
	inq_by_addr_city,
	inq_by_addr_state,
	inq_by_addr_zip,
	inq_by_addr_country,
	inq_by_addr_is_international,
	inq_nature,
	inq_status,
	inq_appraisal_staff,
	hood_cd
)
select
	' + cast(@dataset_id as varchar(10)) + ',
	case_id,
	' + case when @input_year > 0 then cast(@input_year as varchar(4)) else 'prop_val_yr' end + ',
	prop_id,
	sup_num,
	owner_id,
	pct_ownership,
	geo_id,
	prop_type_cd,
	inq_taxpayer_comments,
	IsNull(assessed_val, 0),
	IsNull(ag_market, 0) + IsNull(timber_market, 0),
	IsNull(ag_use_val, 0) + IsNull(timber_use, 0),
	IsNull(land_hstd_val, 0) + IsNull(land_non_hstd_val, 0),
	IsNull(imprv_hstd_val, 0) + IsNull(imprv_non_hstd_val, 0),
	IsNull(appraised_val, 0),
	IsNull(ten_percent_cap, 0),
	IsNull(assessed_val, 0),
	legal_desc,
	'''',
	'''',
	'''',
	inq_type,
	appraiser_nm,
	file_as_name,
	isnull(addr_line1,''''),
	isnull(addr_line2,''''),
	isnull(addr_line3,''''),
	isnull(addr_city,''''),
	isnull(addr_state,''''),
	isnull(addr_zip,''''),
	isnull(country_name,''''),
	isnull(is_international, 0),
	inq_nature,
	inq_status,
	inq_appraisal_staff_name,
	hood_cd
from ARB_INQUIRY_LISTING_VW'

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

	set @exec_sql = @exec_sql + 'prop_val_yr = ' + cast(@input_year as varchar(4))

	set @found_flag = 'T'
end

if ((@input_appraiser_meeting_date_sql is not null) and (len(@input_appraiser_meeting_date_sql) > 0))
begin
	if (@found_flag = 'F')
	begin
		set @exec_sql = @exec_sql + ' WHERE '
	end
	else
	begin
		set @exec_sql = @exec_sql + ' AND '
	end

	set @exec_sql = @exec_sql + @input_appraiser_meeting_date_sql

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

if ((@input_state_sql is not null) and (len(@input_state_sql) > 0))
begin
	if (@found_flag = 'F')
	begin
		set @exec_sql = @exec_sql + ' WHERE '
	end
	else
	begin
		set @exec_sql = @exec_sql + ' AND '
	end
	
	set @exec_sql = @exec_sql + @input_state_sql

	set @found_flag = 'T'
end

if ((@input_last_appraiser_sql is not null) and (len(@input_last_appraiser_sql) > 0))
begin
	if (@found_flag = 'F')
	begin
		set @exec_sql = @exec_sql + ' WHERE '
	end
	else
	begin
		set @exec_sql = @exec_sql + ' AND '
	end

	set @exec_sql = @exec_sql + @input_last_appraiser_sql

	set @found_flag = 'T'
end

if ((@input_meeting_appraiser_sql is not null) and (len(@input_meeting_appraiser_sql) > 0))
begin
	if (@found_flag = 'F')
	begin
		set @exec_sql = @exec_sql + ' WHERE '
	end
	else
	begin
		set @exec_sql = @exec_sql + ' AND '
	end

	set @exec_sql = @exec_sql + @input_meeting_appraiser_sql

	set @found_flag = 'T'
end

--Execute the SQL that has been created...
exec(@exec_sql)

--Set prior value
--'L' -> Last Year's Appraised Value
--'T' -> This Year's Notice Value
if (@input_prior_value = 'L')
begin
	update ##arb_inquiry_listing
	set 	prev_other     = IsNull(assessed_val, 0),
    		prev_ag_mkt    = IsNull(ag_market, 0) + IsNull(timber_market, 0),
		prev_ag_use    = IsNull(ag_use_val, 0) + IsNull(timber_use, 0),
		prev_land      = IsNull(land_hstd_val, 0) + IsNull(land_non_hstd_val, 0),
		prev_imprv     = IsNull(imprv_hstd_val, 0) + IsNull(imprv_non_hstd_val, 0),
		prev_appraised = IsNull(appraised_val, 0),
		prev_cap       = IsNull(ten_percent_cap, 0),
		prev_assessed  = IsNull(assessed_val, 0)
		
	from property_val as pv
	with (nolock)
	join prop_supp_assoc as psa
	with (nolock)
	on pv.prop_val_yr = psa.owner_tax_yr
	and pv.sup_num = psa.sup_num
	and pv.prop_id = psa.prop_id
	where pv.prop_id = ##arb_inquiry_listing.prop_id
	and psa.owner_tax_yr	= (##arb_inquiry_listing.prop_val_yr - 1)
end
else if (@input_prior_value = 'T')
begin
	update ##arb_inquiry_listing
	set 	prev_other     = IsNull(begin_assessed_val, 0),
	    	prev_ag_mkt    = IsNull(begin_ag_market, 0) + IsNull(begin_timber_market, 0),
		prev_ag_use    = IsNull(begin_ag_use_val, 0) + IsNull(begin_timber_use, 0),	
		prev_land      = IsNull(begin_land_hstd_val, 0) + IsNull(begin_land_non_hstd_val, 0),
		prev_imprv     = IsNull(begin_imprv_hstd_val, 0) + IsNull(begin_imprv_non_hstd_val, 0),
		prev_appraised = IsNull(begin_appraised_val, 0),
		prev_cap       = IsNull(begin_ten_percent_cap, 0),
		prev_assessed  = IsNull(begin_assessed_val, 0)
	from _arb_inquiry as ai
	with (nolock)
	where ai.prop_val_yr = ##arb_inquiry_listing.prop_val_yr
	and ai.prop_id = ##arb_inquiry_listing.prop_id
	and ai.case_id = ##arb_inquiry_listing.case_id
	and ##arb_inquiry_listing.dataset_id = @dataset_id
end

--Set *_other fields in the _arb_inquiry_listing table...
update ##arb_inquiry_listing
set curr_other = 0,
    prev_other = 0
where dataset_id = @dataset_id

--Set situs information for the _arb_inquiry_listing records...
update ##arb_inquiry_listing
set    situs = 	LTRIM(REPLACE(situs_display, CHAR(13) + CHAR(10), ' '))
from situs as s
with (nolock)
where ##arb_inquiry_listing.prop_id = s.prop_id
and   s.primary_situs = 'Y'
and ##arb_inquiry_listing.dataset_id = @dataset_id

update ##arb_inquiry_listing
set exemptions = dbo.fn_GetExemptions(prop_id, prop_val_yr, sup_num),
		entities = dbo.fn_GetEntities(prop_id, prop_val_yr, sup_num)
from ##arb_inquiry_listing
where dataset_id = @dataset_id

GO

