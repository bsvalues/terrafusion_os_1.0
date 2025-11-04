
CREATE VIEW _LHC_SALES_11_7 AS

select distinct coop.prop_id,pr.geo_id,
a4.file_as_name as seller,p2.phone_num AS s_phone,a.file_as_name as buyer,p1.phone_num,
sl_price,pv.legal_desc as legal,LEFT(CONVERT(CHAR(20),coo.deed_dt,100),11) as deed_date, 
e.entity_cd, pp.state_cd
from chg_of_owner_prop_assoc coop with (nolock)
              inner join property pr with (nolock) on
              coop.prop_id = pr.prop_id
              inner join prop_supp_assoc as psa with (nolock) on
              coop.sup_tax_yr = psa.owner_tax_yr
              and coop.prop_id = psa.prop_id
              inner join property_val pv with (nolock) on
              psa.prop_id = pv.prop_id
              and psa.owner_tax_yr = pv.prop_val_yr
              and psa.sup_num = pv.sup_num
              inner join property_profile pp with(nolock)on
	      pp.prop_id = coop.prop_id
	      and pp.prop_val_yr = coop.sup_tax_yr
	      and pp.state_cd in ('D1','D2','D3','D4','D5','E1','E2','E3','C3')
              inner join entity_prop_assoc epa with (nolock) on
              epa.prop_id = coop.prop_id
              and epa.tax_yr = psa.owner_tax_yr
              and epa.sup_num = psa.sup_num
              inner join entity e with (nolock) on
              epa.entity_id = e.entity_id
	      and e.entity_type_cd = 'S'
              inner join chg_of_owner coo with (nolock) on
              coo.chg_of_owner_id = coop.chg_of_owner_id
              and coo.coo_sl_dt >= '02/04/2002'
              and coo.coo_sl_dt <= '11/05/2002'
              and coo.deed_type_cd IN ('DEED','SWD','WD')
	      and coo.deed_dt >= '01/01/2001'
              and coo.deed_dt <= '11/05/2002'
              inner join sale with (nolock) on
              coo.chg_of_owner_id = sale.chg_of_owner_id
              and sale.sl_price is NULL
              --and sl_comment like '%Conf %'
              --and sl_type_cd not like 'Q%'	       
              left outer join buyer_assoc b with (nolock) on
              b.chg_of_owner_id = coo.chg_of_owner_id                   
              left outer join account a with (nolock) on
              b.buyer_id = a.acct_id
	      left outer join phone as p1 with (nolock) on
	      b.buyer_id = p1.acct_id
	      and p1.phone_type_cd = 'H'
              left outer join seller_assoc s with (nolock) on
              s.chg_of_owner_id = coo.chg_of_owner_id	                       
              left outer join account a4 with (nolock) on
              s.seller_id = a4.acct_id
	      left outer join phone as p2 with (nolock) on
	      s.seller_id = p2.acct_id
	      and p2.phone_type_cd = 'H'
     
where exists (select count(*) from chg_of_owner_prop_assoc coop2 with (nolock)
            where coop.chg_of_owner_id = coop2.chg_of_owner_id
            having count(*) = 1)

GO

