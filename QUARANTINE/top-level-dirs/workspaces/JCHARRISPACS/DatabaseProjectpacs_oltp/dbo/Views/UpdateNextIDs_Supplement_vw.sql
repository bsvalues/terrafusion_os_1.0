
create view UpdateNextIDs_Supplement_vw
as

	select sup_tax_yr, sup_num
	from supplement
	where sup_num < 32767

GO

