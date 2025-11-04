



CREATE PROCEDURE [dbo].[JacksSalesReport]

@bdate		datetime,
@edate		datetime

as

SET NOCOUNT ON

declare @appr_year numeric (4,0)
exec GetApprYear @appr_year output

select distinct
case when
coo.excise_number is null then coo.deed_num
	else coo.excise_number end as 'AFFIDAVIT NUMBER',
coo.recorded_dt as 'DATE OF RECORDING',
p.geo_id as 'PARCEL NUMBER',
coo.deed_type_cd as 'DOC TYPE',
replace ('$'+convert(varchar,cast((round(sale.sl_price,0)) as money),1),'.00','') as 'SALES PRICE',
replace ('$'+convert(varchar,cast((round(sale.sl_price*.99,0)) as money),1),'.00','') as '99% SALE',
cast(round((sale.sl_price/nullif(pv.assessed_val,0))*100.00,3)as numeric(36,3)) as 'S-A RATIO',
pv.assessed_val,
pv.market,
coov.sl_ratio_type_cd 'REJECT CODE',
srt.sl_ratio_desc as 'COMMENT',
pv.prop_id,
pv.prop_val_yr

from property_val as pv

inner join prop_supp_assoc as psa with (nolock)
	on pv.prop_id = psa.prop_id
	and pv.sup_num = psa.sup_num
	and pv.prop_val_yr = psa.owner_tax_yr

inner join property as p with (nolock)
	on pv.prop_id = p.prop_id

inner join chg_of_owner_prop_assoc as coopa with (nolock)
	on pv.prop_id = coopa.prop_id
	
inner join chg_of_owner as coo with (nolock)
	on coopa.chg_of_owner_id = coo.chg_of_owner_id
	
inner join seller_assoc    	
	on coopa.chg_of_owner_id = seller_assoc.chg_of_owner_id    
	and coopa.prop_id = seller_assoc.prop_id
 
inner join buyer_assoc   	
	on coopa.chg_of_owner_id = buyer_assoc.chg_of_owner_id
  
inner join account  	
	on buyer_assoc.buyer_id = account.acct_id
  
inner join account seller_account   	
	on seller_assoc.seller_id = seller_account.acct_id

left outer Join sale with (nolock)	
	on coo.chg_of_owner_id = sale.chg_of_owner_id	

left outer join chg_of_owner_vw as coov with (nolock)
	on coopa.chg_of_owner_id = coov.chg_of_owner_id
	and coopa.prop_id = coov.prop_id
	and coopa.seq_num = coov.seq_num
	and coopa.sup_tax_yr = coov.sup_tax_yr

left outer join sale_ratio_type as srt with (nolock)
	on coov.sl_ratio_type_cd = srt.sl_ratio_type_cd


where coo.recorded_dt between @bdate and @edate
and pv.prop_val_yr = @appr_year 

order by 1 desc

GO

