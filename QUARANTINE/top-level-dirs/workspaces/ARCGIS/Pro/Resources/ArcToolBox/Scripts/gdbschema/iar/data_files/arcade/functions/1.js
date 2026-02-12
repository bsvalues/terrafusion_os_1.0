function get_sequence_value(sequence_key) {
  return ~SEQUENCES;
}

function get_feature_set(key) {
  return ~FS_SWITCH_YARD;
}

function IsEmpty2(value) {
  var type = TypeOf(value);
  if (type == '') {
    return true; // null
  } else if (type == 'Boolean') {
    return !value;
  } else if (type == 'String') {
    return IsEmpty(value);
  } else if (
    (type == 'Array') ||
    (type == 'Dictionary') ||
    (type == 'FeatureSet')
  ) {
    for (var x in value) {
      return false;
    }
    return true;
  } else if (type == 'Number') {
    return IsNan(value);
  } else if (type == 'Point') {
    return IsNan(value.x);
  } else if (type == 'Multipoint') {
    return Count(value.points) == 0;
  } else if (type == 'Polyline') {
    return Count(value.paths) == 0;
  } else if (type == 'Polygon') {
    return Count(value.rings) == 0;
  } else if (type == 'Extent') {
    return IsNan(value.xmin);
  } else if (
    (type == 'Feature') ||
    (type == 'DateOnly') ||
    (type == 'Time') ||
    (type == 'Date') ||
    (type == 'FeatureSetCollection') ||
    (type == 'Portal') ||
    (type == 'Function')
  ) {
    return false
  }
  return null;
}

function features_to_featureset(features) {
  // Converts features array to feature set.
  if (TypeOf(features) == 'FeatureSet') {
    return features;
  }
  var rows = [];
  var feat, feat_dict;
  for (var i in features) {
    feat = features[i];
    feat_dict = {
      '__oid__': i + 1, // Incrementing OID field.
    };
    for (var j in feat) {
      feat_dict[j] = feat[j];
    }
    Push(rows, {
      'attributes': feat_dict,
    });
  }
  if (IsEmpty(feat)) {
    return;
  }

  // Add OID field to schema.
  var feat_schema = Array(Schema(feat).fields);
  Push(feat_schema, {
    'name': '__oid__',
    'type': 'esriFieldTypeInteger',
  });
  return FeatureSet({
    'fields': feat_schema,
    'features': rows,
  });

}


function count_features(features, where_clause) {
  // count features that match where_clause
  if (IsEmpty2(features)) {
    return 0;
  }
  if (IsEmpty(where_clause)) {
    return Count(features);
  }
  var fs = features_to_featureset(features);
  if (IsEmpty(fs)) {
    return 0;
  }
  return Count(Filter(fs, where_clause));
}

function feature_transition(where_clause) {
  // $originalFeature and $feature comparison
  if (IsEmpty(where_clause)) {
    return true;
  }
  var a = `__oid__ = 1 AND NOT (${where_clause})`;
  var b = `__oid__ = 2 AND (${where_clause})`;
  var count = count_features([$originalFeature, $feature], `(${a}) OR (${b})`);
  return count == 2;
}


function not_null(x) {
  return x != null;
}

function not_empty(x) {
  return !IsEmpty(x);
}

function get_unit_code(unit) {
  // Converts unit string to unit code
  if (IsEmpty(unit)) {
    return
  }

  var u = Lower(Replace(Replace(Replace(unit, ' ', ''), '-', ''), '_', ''));
  // US / INT suffix differentiates the unit code. If no suffix, then it defaults to US Survey.
  var international = false;
  if (Right(u, 2) == 'us') {
    u = Left(u, Count(u) - 2);
  } else if (Right(u, 3) == 'int' && u != 'point') {
    u = Left(u, Count(u) - 3);
    international = true;
  }
  if (Right(u, 1) == 's' && u != 'inches') { // plural
    u = Left(u, Count(u) - 1);
  }
  return When(
    // Metric
    u == 'km' || u == 'kilometer', 9036,
    u == 'm' || u == 'meter', 9001,
    u == 'dm' || u == 'decimeter', 109005,
    u == 'cm' || u == 'centimeter', 1033,
    u == 'mm' || u == 'millimeter', 1025,

    // US Survey / International
    u == 'nmi' || u == 'nauticalmile', IIf(international, 9030, 109012),
    u == 'mi' || u == 'mile', IIf(international, 9093, 9035),
    u == 'yd' || u == 'yard', IIf(international, 9096, 109002),
    u == 'ft' || u == 'foot' || u == 'feet', IIf(international, 9002, 9003),
    u == 'in' || u == 'inch' || u == 'inches', IIf(international, 109008, 109009),

    // Misc
    u == 'dd' || u == 'deg' || u == 'degree' || u == 'decimaldegree', 9102,
    u == 'pt' || u == 'point', 109016,

    // Default
    null,
  )

}
