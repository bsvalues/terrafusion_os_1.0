








create view real_tax_due_vw
as
select sum((bill.bill_m_n_o-bill.bill_m_n_o_pd-bill.discount_mno_pd)+
           (bill.bill_i_n_s-bill.bill_i_n_s_pd-bill.discount_ins_pd)) as amt_due,
       bill.entity_id,
       bill.sup_tax_yr
from bill, property
where bill.prop_id = property.prop_id
and   property.prop_type_cd = 'R'
and   bill.coll_status_cd <> 'P'
and   bill.coll_status_cd <> 'RD'
and   bill.coll_status_cd <> 'RS'
group by bill.entity_id,
	 bill.sup_tax_yr

GO

