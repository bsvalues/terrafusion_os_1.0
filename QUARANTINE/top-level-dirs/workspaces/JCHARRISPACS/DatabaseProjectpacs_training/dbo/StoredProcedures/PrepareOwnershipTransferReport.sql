




CREATE PROCEDURE [dbo].[PrepareOwnershipTransferReport]
	@input_user_id		int,
	@input_year		numeric(4,0),
	@input_tax_areas	varchar(max),
	@input_date_begin	varchar(30),
	@input_date_end		varchar(30),
	@input_sort_order	varchar(2)
AS

SET NOCOUNT ON

--Declare variables
declare @sql 		varchar(max)
declare @otr_id		int
declare @prev_otr_id	int
declare @entity_cd	varchar(10)
declare @str_entity	varchar(255)

--Create table if it doesn't exist

if not exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_tmp_otr]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
CREATE TABLE [dbo].[_tmp_otr] (
	[otr_id] [int] IDENTITY (1, 1) NOT NULL ,
	[pacs_user_id] [int] NOT NULL ,
	[deed_num] [varchar] (50) NULL ,
	[deed_book_id] [char] (20) NULL ,
	[deed_book_page] [char] (20) NULL ,
	[deed_dt] [datetime] NULL ,
	[coo_sl_dt] [datetime] NULL ,
	[prop_id] [int] NULL ,
	[sup_num] [int] NULL ,
	[sup_tax_yr] [numeric](4, 0) NULL ,
	[legal_desc] [varchar] (255) NULL ,
	[prop_type_cd] [char] (5) NULL ,
	[geo_id] [varchar] (50) NULL ,
	[seller_file_as_name] [varchar] (70) NULL ,
	[file_as_name] [varchar] (70) NULL ,
	[addr_line1] [varchar] (60) NULL ,
	[addr_line2] [varchar] (60) NULL ,
	[addr_line3] [varchar] (60) NULL ,
	[addr_city] [varchar] (50) NULL ,
	[addr_state] [varchar] (50) NULL ,
	[addr_zip] [varchar] (50) NULL ,
	[entities] [varchar] (255) NULL
) ON [PRIMARY]

--Delete all records for this user first
delete from _tmp_otr where pacs_user_id = @input_user_id

--Construct SQL insert
set @sql = 'insert into _tmp_otr
		(
			pacs_user_id,
			deed_num,
			deed_book_id,
			deed_book_page,
			deed_dt,
			coo_sl_dt,
			prop_id,
			sup_num,
			sup_tax_yr,
			legal_desc,
			prop_type_cd,
			geo_id,
			seller_file_as_name,
			file_as_name,
			addr_line1,
			addr_line2,
			addr_line3,
			addr_city,
			addr_state,
			addr_zip
		)'

set @sql = @sql + 'SELECT ' + cast(@input_user_id as varchar(20)) + ',
			coo.deed_num,
			coo.deed_book_id,
			coo.deed_book_page,
			coo.deed_dt, 
			coo.coo_sl_dt,
			coopa.prop_id,
			psa.sup_num,
			coopa.sup_tax_yr,
			pv.legal_desc,
			p.prop_type_cd,
			p.geo_id,
			seller_account.file_as_name,
			a.file_as_name,
			ad.addr_line1,
			ad.addr_line2,
			ad.addr_line3,
			ad.addr_city,
			ad.addr_state,
			ad.addr_zip
		  FROM chg_of_owner as coo
		  with (nolock)
			INNER JOIN chg_of_owner_prop_assoc as coopa
			with (nolock)
			ON coo.chg_of_owner_id = coopa.chg_of_owner_id
			join prop_supp_assoc as psa
			with (nolock)
			on coopa.sup_tax_yr = psa.owner_tax_yr
			and coopa.prop_id = psa.prop_id
			INNER JOIN property_val as pv
			with (nolock)
			ON psa.owner_tax_yr = pv.prop_val_yr
			and psa.sup_num = pv.sup_num
			and psa.prop_id = pv.prop_id
			INNER JOIN seller_assoc as sa
			with (nolock)
			ON coopa.chg_of_owner_id = sa.chg_of_owner_id
			AND coopa.prop_id = sa.prop_id
			INNER JOIN property as p
			with (nolock)
			ON coopa.prop_id = p.prop_id
			INNER JOIN buyer_assoc as ba
			with (nolock)
			ON coopa.chg_of_owner_id = ba.chg_of_owner_id
			INNER JOIN account as a
			with (nolock) 
			ON ba.buyer_id = a.acct_id
			INNER JOIN account as seller_account 
			with (nolock)
			ON sa.seller_id = seller_account.acct_id
			LEFT OUTER JOIN dbo.address as ad
			with (nolock)
			ON a.acct_id = ad.acct_id 
			AND ad.primary_addr = ''Y'''
set @sql = @sql + ' WHERE coopa.sup_tax_yr = ' + cast(@input_year as varchar(4))
set @sql = @sql + ' AND coo.coo_sl_dt >= ''' + @input_date_begin + ' 00:00'''
set @sql = @sql + ' AND coo.coo_sl_dt <= ''' + @input_date_end + ' 23:59'''

if (@input_sort_order = 'SF')
begin
	set @sql = @sql + ' ORDER BY coopa.sup_tax_yr, seller_account.file_as_name, coo.coo_sl_dt'

end
else if (@input_sort_order = 'SL')
begin
	set @sql = @sql + ' ORDER BY coopa.sup_tax_yr, seller_account.last_name, coo.coo_sl_dt'
end
else if (@input_sort_order = 'BF')
begin
	set @sql = @sql + ' ORDER BY coopa.sup_tax_yr, a.file_as_name, coo.coo_sl_dt'
end
else if (@input_sort_order = 'BL')
begin
	set @sql = @sql + ' ORDER BY coopa.sup_tax_yr, a.last_name, coo.coo_sl_dt'
end
else if (@input_sort_order = 'G')
begin
	set @sql = @sql + ' ORDER BY coopa.sup_tax_yr, p.geo_id, coo.coo_sl_dt'
end

--Execute SQL
--print @sql
exec(@sql)

--Now get rid of any records if the user only wants this to be run for certain entities
if (@input_tax_areas <> '<ALL>')
begin
	--Construct SQL delete
	set @sql = '
delete from _tmp_otr
	where _tmp_otr.pacs_user_id = ' + cast(@input_user_id as varchar(20)) + '
	and not exists
	(
	    select distinct pta.prop_id 
		from property_tax_area as pta with (nolock) 
		join tax_area as ta with (nolock) 
		on pta.tax_area_id = ta.tax_area_id 
		where pta.prop_id = _tmp_otr.prop_id 
		and pta.sup_num = _tmp_otr.sup_num 
		and pta.year = _tmp_otr.sup_tax_yr 
		and ta.tax_area_number in ' + @input_tax_areas + '
	)'
--changed the above for performance HS 14991

	--Execute SQL
	exec(@sql)
end

--Now update the entities column
DECLARE ENTITY_CURSOR INSENSITIVE SCROLL CURSOR
FOR select _tmp_otr.otr_id, e.tax_area_number
from   _tmp_otr,
       property_tax_area as epa,
       tax_area as e,
       prop_supp_assoc as psa,
       pacs_system
where  epa.tax_area_id = e.tax_area_id
and    _tmp_otr.prop_id = psa.prop_id
and    _tmp_otr.pacs_user_id = @input_user_id
and    epa.prop_id   = psa.prop_id
and    epa.sup_num   = psa.sup_num
and    epa.year    = psa.owner_tax_yr
and    psa.owner_tax_yr in
(
	select max(prop_supp_assoc.owner_tax_yr)
	from prop_supp_assoc, pacs_system
	where prop_supp_assoc.prop_id = psa.prop_id
	and prop_supp_assoc.owner_tax_yr <= pacs_system.appr_yr
)
order by _tmp_otr.otr_id, e.tax_area_number
    
OPEN ENTITY_CURSOR
FETCH NEXT from ENTITY_CURSOR into @otr_id, @entity_cd

set @str_entity = ''
set @prev_otr_id = @otr_id

while (@@FETCH_STATUS = 0)
begin
	print @str_entity
	
	if (@prev_otr_id = @otr_id)
	begin
		set @str_entity = @str_entity + RTRIM(@entity_cd)
	end

	FETCH NEXT from ENTITY_CURSOR into @otr_id, @entity_cd

	if (@@FETCH_STATUS <> 0)
	begin
		set @otr_id = 0
	end

	if (@prev_otr_id <> @otr_id)
	begin
		update _tmp_otr set entities = @str_entity
		where _tmp_otr.otr_id = @prev_otr_id
		and _tmp_otr.pacs_user_id = @input_user_id

		set @str_entity = ''
	end
	else
	begin
		set @str_entity = @str_entity + ', '
	end

	set @prev_otr_id = @otr_id
end

CLOSE ENTITY_CURSOR
DEALLOCATE ENTITY_CURSOR

GO

