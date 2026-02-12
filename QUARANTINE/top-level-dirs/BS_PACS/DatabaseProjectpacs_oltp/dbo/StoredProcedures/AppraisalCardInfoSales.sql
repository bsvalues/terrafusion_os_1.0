
CREATE PROCEDURE AppraisalCardInfoSales
	@prop_id 	int,
	@year 		Numeric(4,0),
	@sup_num 	int = 0
AS

SET NOCOUNT ON

/*
 * SALES HISTORY area
 */


-- Need to get 1st 2 improvement types
/*
 * WARNING!  If there's only ONE improvement, the MIN
 * and the MAX will be the same.  So, this must be caught
 * in the VB code.
 */


-- 2006.06.22 - Jeremy Smith - HS 35955
-- If we are using a parent, we want to display the sale info for all children,
-- otherwise, we just want to display sale info for the specified prop ID
-- We do that by checking for property_val.udi_parent = 'T'
-- If it is 'T' then we select all child prop IDs into #sale_info_props,
-- Otherwise, we just insert the specified property id into #sale_info_props
-- Later on, we filter based on this/these property ID(s)

create table #sale_info_props( prop_id int )	

if exists ( select * from property_val where prop_id = @prop_id and prop_val_yr = @year and sup_num = @sup_num and (udi_parent = 'T' or udi_parent = 'D') ) 
begin
	--print 'parent'	
	insert
		#sale_info_props 
	select 
		prop_id
	from
		property_val
	where
		prop_val_yr = @year and sup_num = @sup_num and udi_parent_prop_id = @prop_id
end
else
begin
	--print 'child'
	insert into #sale_info_props values ( @prop_id )
end


declare @imprv_id_min int
declare @imprv_td_min varchar(50)
declare @imprv_id_max int
declare @imprv_td_max varchar(50)

declare @sale_year int
declare @sale_sup int

set @imprv_td_min = ''
set @imprv_td_max = ''

set @imprv_id_min = -1
set @imprv_id_max = -1


declare @ac_sh_imprv  table(
	sup_tax_yr numeric(4,0),
	sup_num int,
	imprv_id_1 int,
	imprv_td_1 varchar(50),
	imprv_id_2 int,
	imprv_td_2 varchar(50)
)

declare sale_info_cursor cursor for
select distinct
	coopa.sup_tax_yr,
	coopa.sup_num
from
	chg_of_owner_prop_assoc as coopa WITH (NOLOCK)
where
	coopa.prop_id in ( select prop_id from #sale_info_props )


open sale_info_cursor
fetch next from sale_info_cursor into @sale_year, @sale_sup
while (@@fetch_status = 0)
begin
	-- Get the min (first) improvement ID and improvement type description
	select
		@imprv_id_min = min(imprv_id),
		@imprv_td_min = imprv_type.imprv_type_desc
	from
		imprv with (nolock)
	inner join
		imprv_type
		on imprv.imprv_type_cd = imprv_type.imprv_type_cd
	where
		imprv.prop_id = @prop_id
		and  imprv.prop_val_yr = @sale_year
		and  imprv.sup_num = @sale_sup
	group by imprv_type_desc

	-- Get the max (second) improvement ID and improvement type description
	select
		@imprv_id_max = max(imprv_id),
		@imprv_td_max = imprv_type.imprv_type_desc
	from
		imprv with (nolock)
	inner join
		imprv_type
		on imprv.imprv_type_cd = imprv_type.imprv_type_cd
	where
		imprv.prop_id = @prop_id
		and  imprv.prop_val_yr = @sale_year
		and  imprv.sup_num = @sale_sup
	group by imprv_type_desc

	-- insert a row into the @ac_sh_imprv table
	insert into @ac_sh_imprv (sup_tax_yr,sup_num,imprv_id_1,imprv_td_1,imprv_id_2,imprv_td_2)
	values(@sale_year,@sale_sup,@imprv_id_min,@imprv_td_min,@imprv_id_max,@imprv_td_max)

	fetch next from sale_info_cursor into @sale_year, @sale_sup
end
close sale_info_cursor
deallocate sale_info_cursor



SELECT TOP 3 
	CASE ISNULL(s.sl_dt, '')
	WHEN '' THEN coo.deed_dt -- HS  13412 PratimaV  if sl_dt is null then use sl-dt from change_of_owner
	ELSE s.sl_dt
	END as sale_dt,

	ISNULL(s.sl_price,-1) as sale_price,
	ISNULL(s.sl_type_cd,'') as type,
	ISNULL(s.sl_ratio_type_cd,'') as ratio_cd,
	ISNULL(s.sl_financing_cd,'') as fin_cd,
	ISNULL(s.finance_yrs,-1) as fin_term,
	ISNULL(s.sl_living_area,-1) as la_sqft,
	ISNULL(ac.imprv_id_1,-1) as first_imprv,
	ISNULL(ac.imprv_td_1,'') as first_imprv_type,
	ISNULL(ac.imprv_id_2,-1) as second_imprv,
	ISNULL(ac.imprv_td_2,'') as second_imprv_type,
	ISNULL(a.file_as_name,'') as grantor,
	ISNULL(coo.consideration,'') as consid,
	ISNULL(coo.deed_type_cd,'') as deed,
	ISNULL(coo.deed_book_id,'') as book_id,
	ISNULL(coo.deed_book_page,'') as deed_page

	FROM chg_of_owner_prop_assoc as coopa
	WITH (NOLOCK)
	
	INNER JOIN chg_of_owner as coo
	WITH (NOLOCK)
	ON coopa.chg_of_owner_id = coo.chg_of_owner_id
	
	LEFT OUTER JOIN seller_assoc as sa
	WITH (NOLOCK)
		INNER JOIN account as a
		WITH (NOLOCK)
		ON sa.seller_id = a.acct_id
	ON coopa.chg_of_owner_id = sa.chg_of_owner_id
	AND coopa.prop_id = sa.prop_id
	
	LEFT OUTER JOIN sale as s
	WITH (NOLOCK)
	ON coopa.chg_of_owner_id = s.chg_of_owner_id

	LEFT OUTER JOIN @ac_sh_imprv as ac
--			WITH (NOLOCK)
	ON coopa.sup_tax_yr = ac.sup_tax_yr
	AND coopa.sup_num = ac.sup_num

	WHERE coopa.prop_id in ( select prop_id from #sale_info_props )
	
	--ORDER BY coopa.sup_tax_yr DESC, coopa.seq_num ASC
	ORDER BY --HS 16749 PratimaV

	CASE WHEN ISNULL(s.sl_dt, '') = ''
	THEN coo.deed_dt 
	ELSE s.sl_dt END

	DESC

drop table #sale_info_props

GO

