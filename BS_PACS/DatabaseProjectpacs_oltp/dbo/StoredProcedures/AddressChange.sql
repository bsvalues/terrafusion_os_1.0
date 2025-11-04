



    

    

    

    

---here is how you set up the monitor call:  {Call AddressChange ('1/1/2017', '1/31/2017',522, 2017)}  

/* 

This monitor was created for Benton to identify all properties with a specified assessment agency in the specified assessment year
that had an address change change in the specified date range.  

The variables are begin_date, end_date, agency_id, year.  

NOTE: The year is the assessment year.  To look at assessments on the property in the year 2017-2018, set the year variable to 2017.

*/

      

          

          

CREATE procedure [dbo].[AddressChange]          

          

          

@begin_date  datetime,
@end_date datetime,
@agency_id varchar(20),
@year	varchar(4)
          

        

as          

          

          

          

set nocount on     

     
SELECT DISTINCT pv.prop_id as 'Prop ID',
a.file_as_name as 'File as Name',
p.geo_id as 'Geo ID',
p.prop_type_cd as 'Prop Type', 
c.chg_before_val as 'Before Chg', 
c.chg_after_val as 'After Chg', 
c.chg_column_desc as 'Column Desc',
c.file_as_name as 'Owner',
ad.last_change_dt,
pv.legal_desc as 'Legal Desc'
FROM address_chg_vw c WITH (nolock)
INNER JOIN property p WITH (nolock) ON
	c.chg_by_acct_id = p.col_owner_id
INNER JOIN property_val pv WITH (nolock) ON
	pv.prop_id = p.prop_id
INNER JOIN account a WITH (nolock) ON
	p.col_owner_id = a.acct_id
INNER JOIN address ad WITH (nolock) ON
	a.acct_id = ad.acct_id
inner join property_special_assessment psa 
	on pv.prop_id = psa.prop_id
	and pv.prop_val_yr = psa.year
	and pv.sup_num = psa.sup_num
WHERE ad.last_change_dt >= @begin_date 
and ad.last_change_dt <= @end_date
and psa.agency_id = @agency_id ---change as needed
and psa.year = @year
AND (c.chg_column_desc like 'Address - L%' or c.chg_column_desc = 'Address - City'
	 or c.chg_column_desc = 'Address - State' or c.chg_column_desc = 'Address - Zip')
ORDER BY p.prop_type_cd, pv.prop_id, c.chg_column_desc



set nocount off

GO

