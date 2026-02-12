/*
where_clause (Text): A SQL Expression used to determine if the rule should continue(matches query), or return early
seq_infos (Array): Array of sequence dictionaries
  where_clause (Text): A SQL expression applied to $feature to identify the sequence to use
  description (Text): A description of the sequence, this is for informational purposes and does not affect the execution
  prefix (Text): A string place before the sequence value, can be an empty string
  suffix (Text): A string placed after the sequence value, can be an empty string
  padding (Text): Pads the sequence number to a given length, can be an empty string.  The format must such as '0000' for a 4 digit number such as 0005
  sequence_key (Text): The key used in the get_sequence_value function to identify the sequence
  separator (Text): A string used to join the prefix, sequence and suffice, can be an empty string
  intersect_values (Dictionary): The parameters used to look up a value in an intersecting layer to get an ID to determine a unique sequence for rows
    target_name (Text): The unqualified target class name
    where_clause (Text): An optional sql expression to limit the results from the target class
    spatial_operator (Text): The optional string for spatial filtering. Intersects/Within.
    search_distance (Number): The optional buffer distance to apply to spatial_operator.
    search_units (Text): The optional units to apply to search_distance.
	row_id_field (Text): The field in the intersected class used to determine the sequence used
	id_values (Dictionary): A Dictionary where the keys are the values(as text) from the field in row_id_field in the intersected layers and the value is the key of the sequence to use
*/

~EXPECTS

if (!IsEmpty(~GLOBAL_ASSIGNED_FIELD)) {
  return;
}

var fs = features_to_featureset([$feature]);
var seq_val = null;
var input_geometry = Geometry($feature);
for (var i in rule_settings.seq_infos) {
  var seq = rule_settings.seq_infos[i];
  if (count_features(fs, seq.where_clause) == 1) {
    var seq_val = null;
    // If there are intersect lookup details, get the sequence key by intersecting the layer, if not, use
    if (!IsEmpty2(DefaultValue(seq, ['intersect_values', 'id_values'], {}))) {
      // Convert the key to the featureset
      seq.intersect_values.input_geometry = input_geometry;
      var intersect_fs = apply_sql_spatial_filter(get_feature_set(seq.intersect_values.target_name), seq.intersect_values);
      for (var feat in intersect_fs) {
        var row_id = Text(feat[seq.intersect_values.row_id_field]);
        if (HasKey(seq.intersect_values.id_values, row_id)) {
          seq_val = get_sequence_value(seq.intersect_values.id_values[row_id]);
          if (!IsEmpty(seq_val)) {
            break;
          }
        }
      }
    }
    if (IsEmpty(seq_val) && !IsEmpty2(seq.sequence_key)) {
      seq_val = get_sequence_value(seq.sequence_key);
    }
    // Check if seq was found
    if (IsEmpty(seq_val)) {
      continue;
    }
    return Concatenate(Filter([seq.prefix, pad_string(seq_val, seq.padding), seq.suffix], not_empty), seq.separator);
  }
}
return;
