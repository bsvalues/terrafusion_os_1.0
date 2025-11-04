
CREATE VIEW dbo.income_prop_rpt_vw
AS
SELECT
dbo.income_prop_assoc.income_id, dbo.income_prop_assoc.sup_num, dbo.income_prop_assoc.prop_id, dbo.income_prop_assoc.prop_val_yr,
dbo.income_prop_assoc.income_pct, dbo.income_prop_assoc.income_value * (owner.pct_ownership/100) as income_value, dbo.income_prop_assoc.active_valuation, dbo.account.file_as_name,
dbo.owner.pct_ownership, dbo.property.dba_name, dbo.situs.primary_situs,
dbo.situs.situs_num, dbo.situs.situs_street_prefx, dbo.situs.situs_street,
dbo.situs.situs_street_sufix, dbo.situs.situs_unit, dbo.situs.situs_city, dbo.situs.situs_state,
dbo.situs.situs_zip, convert(varchar(150), ISNULL(dbo.situs.situs_display, '')) as situs,
(select top 1 entity_cd from 
entity, entity_prop_assoc epas
where income_prop_assoc.prop_id = epas.prop_id
and income_prop_assoc.sup_num = epas.sup_num
and income_prop_assoc.prop_val_yr = epas.tax_yr
and epas.entity_id = entity.entity_id
and entity.entity_type_cd  = 'S') as school_cd,
(select top 1 entity_cd from
entity, entity_prop_assoc epas
where income_prop_assoc.prop_id = epas.prop_id
and income_prop_assoc.sup_num = epas.sup_num
and income_prop_assoc.prop_val_yr = epas.tax_yr
and epas.entity_id                = entity.entity_id
and entity.entity_type_cd  = 'C') as city_cd
FROM dbo.income_prop_assoc
INNER JOIN dbo.property ON
	dbo.income_prop_assoc.prop_id = dbo.property.prop_id
INNER JOIN dbo.owner ON
	dbo.income_prop_assoc.prop_id = dbo.owner.prop_id AND
	dbo.income_prop_assoc.sup_num = dbo.owner.sup_num AND
	dbo.income_prop_assoc.prop_val_yr = dbo.owner.owner_tax_yr
INNER JOIN dbo.account ON
	dbo.owner.owner_id = dbo.account.acct_id
LEFT OUTER JOIN dbo.situs ON
	dbo.income_prop_assoc.prop_id = dbo.situs.prop_id AND
	dbo.situs.primary_situs = 'Y'

GO

