
CREATE VIEW dbo.sup_gr_prop_arb_protest_vw
AS
SELECT pv.prop_id, s.sup_num, s.sup_tax_yr, sg.sup_group_id
FROM _arb_protest as ap
  INNER JOIN property_val as pv
  INNER JOIN supplement as s
  INNER JOIN sup_group as sg
  ON sg.sup_group_id = s.sup_group_id
  ON pv.prop_val_yr = s.sup_tax_yr 
     AND pv.sup_num = s.sup_num
  ON ap.prop_id = pv.prop_id
    AND ap.prop_val_yr = pv.prop_val_yr
WHERE sg.status_cd='L' 
    AND ap.prot_complete_dt is null

GO

