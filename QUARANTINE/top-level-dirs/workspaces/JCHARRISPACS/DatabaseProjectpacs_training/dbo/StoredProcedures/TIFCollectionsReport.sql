
create procedure dbo.TIFCollectionsReport
	@dataset_id int,
	@year numeric(4,0),
	@filter_district varchar(max) = null,
	@filter_levy varchar(max) = null,
	@cutoff_date datetime = null
as

set nocount on

if @cutoff_date is null
	set @cutoff_date = getDate()

-- Identify TIF sponsoring levies to report on, and the TIF areas they came from
delete ##tifcol_levy
where dataset_id = @dataset_id

insert ##tifcol_levy
(dataset_id, tif_area_id, year, tax_district_id, levy_cd, linked_tax_district_id, linked_levy_cd,
	tif_area_name, tax_district_desc, linked_tax_district_desc)
select @dataset_id, tal.tif_area_id, tal.year, tal.tax_district_id, tal.levy_cd, tal.linked_tax_district_id, tal.linked_levy_cd,
	ta.name, td.tax_district_desc, ltd.tax_district_desc
from tif_area_levy tal with(nolock)
join tif_area ta with(nolock)
	on ta.tif_area_id = tal.tif_area_id
join tax_district td with(nolock)
	on td.tax_district_id = tal.tax_district_id
join tax_district ltd with(nolock)
	on ltd.tax_district_id = tal.linked_tax_district_id

where tal.linked_tax_district_id is not null
and tal.linked_levy_cd is not null

and ((@year <= 0) or (tal.year = @year))
and (@filter_district is null 
	or tal.tax_district_id in (select ID from dbo.fn_ReturnTableFromCommaSepValues(@filter_district))
	or tal.linked_tax_district_id in (select ID from dbo.fn_ReturnTableFromCommaSepValues(@filter_district)))
and (@filter_levy is null 
	or tal.levy_cd in (select ID from dbo.fn_ReturnTableFromCommaSepValues(@filter_levy))
	or tal.linked_levy_cd in (select ID from dbo.fn_ReturnTableFromCommaSepValues(@filter_levy)))
and exists(
	select 1 from bill b with(nolock)
	join levy_bill lb with(nolock)
		on b.bill_id = lb.bill_id
	where b.year = tal.year
	and lb.tax_district_id = tal.linked_tax_district_id
	and lb.levy_cd = tal.linked_levy_cd
)


-- get bills for the sponsoring levies
delete ##tifcol_bill
where dataset_id = @dataset_id

insert ##tifcol_bill
(dataset_id, levy_id, bill_id, prop_id, owner_name)

select @dataset_id, tcl.levy_id, b.bill_id, b.prop_id, oa.file_as_name 
from ##tifcol_levy tcl

join levy_bill lb with(nolock)
	on lb.year = tcl.year
	and lb.tax_district_id = tcl.linked_tax_district_id
	and lb.levy_cd = tcl.linked_levy_cd
	
join bill b with(nolock)
	on b.bill_id = lb.bill_id
	and b.is_active = 1

cross apply (
	select top 1 tapa.* 
	from tif_area_prop_assoc tapa with(nolock)
	where tapa.tif_area_id = tcl.tif_area_id
	and tapa.prop_id = b.prop_id
	and tapa.year = b.year
	order by tapa.sup_num desc
)x

left join owner o
	on o.prop_id = b.prop_id
	and o.owner_tax_yr = b.year
	and o.sup_num = b.sup_num

left join account oa
	on oa.acct_id = o.owner_id

where tcl.dataset_id = @dataset_id


-- fill in amounts
;with TIFColSums as
(
	select tcb.bill_id,
		sum(case when core_transaction_type = 1 then ct.base_amount else 0 end) original_tax,
		sum(ct.base_amount) adjusted_tax,
		sum(ct.base_amount_pd) base_paid,
		sum(ct.penalty_amount_pd) penalty_paid,
		sum(ct.interest_amount_pd + ct.bond_interest_pd) interest_paid,
		sum(ct.base_amount_pd + ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd) current_paid,
		sum(case when b.balance_dt <= @cutoff_date 
			then ct.base_amount_pd + ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd 
			else 0 end) prior_paid
	from ##tifcol_bill tcb
	join coll_transaction ct
		on ct.trans_group_id = tcb.bill_id
	join transaction_type tt
		on ct.transaction_type = tt.transaction_type
	join batch b
		on b.batch_id = ct.batch_id
	where tcb.dataset_id = @dataset_id
	group by tcb.bill_id

)

update tcb
set original_tax = x.original_tax,
	adjusted_tax = x.adjusted_tax,
	base_paid = x.base_paid,
	penalty_paid = x.penalty_paid,
	interest_paid = x.interest_paid,
	current_paid = x.current_paid,
	prior_paid = x.prior_paid,
	tax_due = x.adjusted_tax - x.current_paid
from ##tifcol_bill tcb
join TIFColSums x
	on x.bill_id = tcb.bill_id
where tcb.dataset_id = @dataset_id

GO

