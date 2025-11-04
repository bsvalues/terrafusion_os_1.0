

create view income_tax_vw

as

select ipa.income_id, ipa.sup_num, ipa.prop_val_yr, convert(numeric(14,2), sum((taxable_val/100) * (IsNull(m_n_o_tax_pct, 0) + 
				IsNull(i_n_s_tax_pct, 0)))) as tax_amount
from income_prop_assoc ipa,
     prop_supp_assoc psa,
     prop_owner_entity_val poev,
     tax_rate tr
where ipa.prop_id      = psa.prop_id
and   (ipa.prop_val_yr-1)  = psa.owner_tax_yr 
and   psa.prop_id      = poev.prop_id
and   psa.sup_num      = poev.sup_num
and   psa.owner_tax_yr = poev.sup_yr
and   poev.entity_id   = tr.entity_id
and   poev.sup_yr      = tr.tax_rate_yr
group by ipa.income_id, ipa.sup_num, ipa.prop_val_yr

GO

