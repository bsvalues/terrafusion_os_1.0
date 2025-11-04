



CREATE procedure PopulateMortgageDueFile
@input_yr	numeric(4),
@input_mort_id	int,
@input_taxserver  varchar(10)

as
-------------------------------------------------
--Procedure is designed to generate a mortgage due
--file for export and shipped to mortgage company
-------------------------------------------------
if exists (select * from sysobjects where id = object_id(N'[dbo].[_temp_mortgage_due]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table [dbo].[_temp_mortgage_due]

update mortgage_assoc set mortgage_acct_id = '' where mortgage_acct_id is null

-- if mortgage is 0 then we will use the taxserver information
if @input_mort_id = 0
	begin
	select mortgage_assoc.*, bill.bill_id, sup_tax_yr as year, bill.entity_id, entity_cd, bill_m_n_o + bill_i_n_s as base_tax
	into _temp_mortgage_due
	from bill, mortgage_assoc, entity
	where bill.prop_id = mortgage_assoc.prop_id
	and bill.entity_id = entity.entity_id
	and bill.sup_tax_yr = @input_yr
	and active_bill = 'T'
	and coll_status_cd = 'N'
	and mortgage_co_id IN (select mortgage_co_id from mortgage_co where taxserver = @input_taxserver)
	order by bill.prop_id
	end
else
	begin 
	select mortgage_assoc.*, bill.bill_id, sup_tax_yr as year, bill.entity_id, entity_cd, bill_m_n_o + bill_i_n_s as base_tax
	into _temp_mortgage_due
	from bill, mortgage_assoc, entity
	where bill.prop_id = mortgage_assoc.prop_id
	and bill.entity_id = entity.entity_id
	and bill.sup_tax_yr = @input_yr
	and mortgage_co_id = @input_mort_id
	and active_bill = 'T'
	and coll_status_cd = 'N'
	order by bill.prop_id
	end

--Now populate the another file with a total by property
if exists (select * from sysobjects where id = object_id(N'[dbo].[_temp_mortgage_due_prop]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table [dbo].[_temp_mortgage_due_prop]

select a.prop_id, geo_id, mortgage_co_id, mortgage_acct_id, year, sum(base_tax) as base_tax
into _temp_mortgage_due_prop
from _temp_mortgage_due as a, property as b
where a.prop_id = b.prop_id
group by a.prop_id, b.geo_id, mortgage_co_id, mortgage_acct_id, year

GO

