--SELECT Distinct ','   +  quotename(error,'[]')  FROM prop_recalc_errors 
create view __prop_recalc_errors_piv as
  select*
  from 
  (select prop_id,error_id,
  error
  from prop_recalc_errors) as basedata
  pivot(
  count(error_id)
  for error in ([PP Farm segment has zero value.  Segment ID: 13352]
,[Rounding Factors do not exist for Year 1998]
,[PP Farm segment has zero value.  Segment ID: 11028]
,[3 detail records have been setup to establish the base unit price.]
,[Rounding Factors do not exist for Year 1997]
,[PP Farm segment has zero value.  Segment ID: 13348]
,[5 detail records have been setup to establish the base unit price.]
,[Matrix UC missing or zero.  Stopping calculation of this detail.]
,[PP Farm segment has zero value.  Segment ID: 123017]
,[PP Farm segment has zero value.  Segment ID: 13341]
,[Property must have a tax area.]
,[2 detail records have been setup to establish the base unit price.]
,[PP Farm segment has zero value.  Segment ID: 117839]
,[Estimate Section Components for Mobile Homes are not supported.]
,[Property must have a land or improvement segment.]
,[Rounding Factors do not exist for Year 1991]
,[The data with which to lookup the depreciation matrix is missing]
,[7 detail records have been setup to establish the base unit price.]
,[The value for the improvement record is <= 0.]
,[PP Farm segment has zero value.  Segment ID: 13339]
,[Rounding Factors do not exist for Year 1994]
,[Rounding Factors do not exist for Year 1999]
,[The adjustment percent for the improvement detail record is <= 0.]
,[PP Farm segment has zero value.  Segment ID: 12341]
,[The ag value for the land detail record is 0.]
,[Senior exemption exists and appraised classified is zero.]
,[PP Farm segment has zero value.  Segment ID: 118012]
,[PP Farm segment has zero value.  Segment ID: 120425]
,[Rounding Factors do not exist for Year 1995]
,[The unit price for the improvement detail record is 0.]
,[The land adjustment factor for the land detail record is 0.]
,[The value for the improvement detail record is <= 0.]
,[Rounding Factors do not exist for Year 1993]
,[PP Farm segment has zero value.  Segment ID: 121982]
,[No matrices associated with improvement schedule]
,[Depreciation percent is zero.]
,[PP Farm segment has zero value.  Segment ID: 14715]
,[Depreciation Year is null; Depreciation cannot be calculated.]
,[PP Farm segment has zero value.  Segment ID: 120187]
,[Matrix Unit Cost:  More than one feature was found - the first was used.]
,[The unit price for the land detail record is 0.]
,[Properties whose market value is > $500 cannot have a U500 exemption.]
,[PP Farm segment has zero value.  Segment ID: 13367]
,[PP Farm segment has zero value.  Segment ID: 119946]
,[Rounding Factors do not exist for Year 1996]
,[PP Farm segment has zero value.  Segment ID: 13342]
,[Rounding Factors do not exist for Year 1992]
,[PP Farm segment has zero value.  Segment ID: 13349]
,[Effective Year Built is null; Depreciation cannot be calculated.]
,[The market value for the land detail record is <= 0.]
,[The matrix does not contain the axes needed to lookup a value.]
,[The data with which to lookup a unit price in the matrix is missing.]
,[4 detail records have been setup to establish the base unit price.]
,[Land segment is ag apply = true, but ag use code is invalid.]
  )) as PivotTable

GO

