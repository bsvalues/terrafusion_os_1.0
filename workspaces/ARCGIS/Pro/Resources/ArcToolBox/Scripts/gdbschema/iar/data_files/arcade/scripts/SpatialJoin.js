/*
field_mappings (Array): Source and target field mappings.
  source_field (Text): The source field to be populated.
  action (Text): The action to apply on the source fields. Count/First/Last/Join/Min/Max/Mean/Range/Sum/StDev/Mode.
  delimiter (Text): The delimiter to join multiple fields when the action is 'Join'.
  field_map (Array): The target classes and fields.
    class_name (Text): The unique name referencing the target class.
    target_fields (Array): The target field(s) to populate source_field.
target_classes (Array): Target classes and search options.
  class_name (Text): The unique name referencing the target class.
  where_clause (Text): The optional string to filter class_name.
  order_by_clause (Text): The optional string to apply ASC/DESC sorting on class_name.
  spatial_operator (Text): The optional string for spatial filtering. Intersects/Within.
  search_distance (Number): The optional buffer distance to apply to spatial_operator.
  search_units (Text): The optional units to apply to search_distance.
  input_geometry (Geometry): The optional shape to use for spatial querying.
*/
~EXPECTS


function calculate() {
  var target_rows = {};
  for (var target_idx in rule_settings.target_classes) {
    var target = rule_settings.target_classes[target_idx];
    target_rows[target.class_name] = transpose_feature_set(
      apply_sql_spatial_filter(
        get_feature_set(target.class_name),
        target,
      )
    )
  }

  var result = {};
  for (var fms_idx in rule_settings.field_mappings) {
    var fms = rule_settings.field_mappings[fms_idx];

    // Each field can be populated by any number of join classes and fields. Merge into a single array.
    var rows = [];
    for (var fm_idx in fms.field_map) {
      var fm = fms.field_map[fm_idx];
      for (var i in fm.target_fields) {
        rows = Splice(rows, DefaultValue(target_rows, [fm.class_name, fm.target_fields[i]], []));
      }
    }
    if (!IsEmpty2(rows)) {
      result[fms.source_field] = apply_merge_rule(fms.action, fms.delimiter, rows);
    }
  }
  return result;
}

return {
  'result': {
    'attributes': calculate()
  }
}
