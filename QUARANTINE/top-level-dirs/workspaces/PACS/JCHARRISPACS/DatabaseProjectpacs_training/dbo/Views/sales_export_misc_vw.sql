



CREATE VIEW sales_export_misc_vw AS

SELECT DISTINCT
	psa.prop_id,
	psa.sup_num,
	psa.owner_tax_yr,
	case when
	(
		case when isnull(impd.percent_complete_override, 'F') = 'F' then imp.percent_complete else 100 end
	) < 100 then 'T' else 'F' end as partial_complete
FROM
	prop_supp_assoc as psa with (nolock),
	imprv as imp with (nolock),
	imprv_detail as impd with (nolock)
WHERE
	psa.prop_id = imp.prop_id and
	psa.sup_num = imp.sup_num and
	psa.owner_tax_yr = imp.prop_val_yr and
	imp.sale_id = 0 and
	imp.prop_id = impd.prop_id and
	imp.sup_num = impd.sup_num and
	imp.sale_id = impd.sale_id and
	imp.prop_val_yr = impd.prop_val_yr and
	imp.imprv_id = impd.imprv_id

GO

