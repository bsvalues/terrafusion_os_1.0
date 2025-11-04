

CREATE VIEW pp_rendition_prop_penalty_distribution_vw
AS
SELECT  pp_rendition_prop_penalty_distribution.prop_id AS prop_id, 
	pp_rendition_prop_penalty_distribution.owner_id AS owner_id, 
        pp_rendition_prop_penalty_distribution.sup_num AS sup_num, 
	pp_rendition_prop_penalty_distribution.rendition_year AS rendition_year, 
	pp_rendition_prop_penalty_distribution.entity_cd AS entity_cd,
	pp_rendition_prop_penalty_distribution.penalty_distribution_amt AS penalty_distribution_amt,
	pp_rendition_prop_penalty_distribution.fraud_penalty_distribution_amt AS fraud_penalty_distribution_amt
FROM	pp_rendition_prop_penalty_distribution
		INNER JOIN prop_supp_assoc ON 
			pp_rendition_prop_penalty_distribution.prop_id = prop_supp_assoc.prop_id AND 
			pp_rendition_prop_penalty_distribution.sup_num = prop_supp_assoc.sup_num AND 
			pp_rendition_prop_penalty_distribution.rendition_year = prop_supp_assoc.owner_tax_yr

GO

