
CREATE VIEW dbo.can_undo_supp_bill_vw
AS
SELECT ba.bill_id, ba.sup_num, 
    ba.bill_adj_id, b.year, 
    s.sup_group_id
FROM bill_adjustment as ba
with (nolock)
join bill as b
with (nolock)
on ba.bill_id = b.bill_id
join supplement as s
with (nolock)
on b.[year] = s.sup_tax_yr 
and ba.sup_num = s.sup_num
WHERE EXISTS
        (SELECT bill_id
      FROM bill_adjustment as bac
			with (nolock)
      WHERE bac.bill_id = ba.bill_id AND 
           bac.bill_adj_id > ba.bill_adj_id)

GO

