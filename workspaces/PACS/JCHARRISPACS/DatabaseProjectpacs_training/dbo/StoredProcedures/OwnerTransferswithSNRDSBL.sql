
--monitor command to run this monitor -- {call OwnerTransferswithSNRDSBL('2009', '4/5/2008', '12/31/2009')}
--client needs to modify the dates and year

CREATE procedure [dbo].[OwnerTransferswithSNRDSBL]

@prop_val_yr numeric(4,0),
@begin_date	datetime,
@end_date	datetime 

as
--for testing uncomment the 6 lines below and comment out above 3 lines
--declare @prop_val_yr numeric(4,0)
--declare @begin_date	datetime
--declare @end_date	datetime 
--
--set @prop_val_yr = 2009
--set @begin_date = '01/01/2009'
--set @end_date = '12/31/2009'

SELECT pv.prop_id, pv.prop_val_yr, Buyer, Seller, Deed_Date
FROM property_val pv WITH (nolock) 

LEFT OUTER JOIN 
	(select copa.prop_id, copa.seq_num, ac1.file_as_name as Seller, 
	ac2.file_as_name as Buyer, coo.deed_dt as Deed_Date
	from chg_of_owner_prop_assoc copa with (nolock)
	inner join chg_of_owner coo with (nolock) on
		copa.chg_of_owner_id = coo.chg_of_owner_id
	inner join sale s with (nolock) on	
	s.chg_of_owner_id = copa.chg_of_owner_id
	inner join seller_assoc sa with (nolock) on
		copa.prop_id = sa.prop_id
		and coo.chg_of_owner_id = sa.chg_of_owner_id
	inner join account ac1 with (nolock) on
		sa.seller_id = ac1.acct_id
	inner join buyer_assoc ba with (nolock) on	
		coo.chg_of_owner_id = ba.chg_of_owner_id 
	inner join account ac2 with (nolock) on	
		ba.buyer_id = ac2.acct_id) as sb
	on sb.prop_id = pv.prop_id

WHERE pv.prop_val_yr = @prop_val_yr 
AND Deed_Date between @begin_date and @end_date
AND pv.prop_id in (select prop_id from property_exemption
				   where exmpt_type_cd = 'SNR/DSBL'
				   and owner_tax_yr = @prop_val_yr)
ORDER BY Deed_Date

GO

