import { makeExecutableSchema } from "@graphql-tools/schema";
import { ExtensionPointManager } from "../plugins/extension-point";
import { ExtensionPointType } from "../plugins/types";

// Define the base schema
const baseTypeDefs = `
  type Query {
    _empty: String
  }
  
  type Mutation {
    _empty: String
  }
  
  type Subscription {
    _empty: String
  }
`;

/**
 * Schema extension interface
 */
interface SchemaExtension {
  id: string;
  typeDefs: string;
  resolvers: any;
}

/**
 * Generate the executable GraphQL schema by combining the base schema
 * with all registered schema extensions
 */
export function generateSchema() {
  // Get the extension point manager
  const extensionPointManager = ExtensionPointManager.getInstance();

  // Get all schema extensions
  const schemaExtensionPoint =
    extensionPointManager.getExtensionPoint<SchemaExtension>("core.schema");

  if (!schemaExtensionPoint) {
    // If no schema extension point exists, return just the base schema
    return makeExecutableSchema({
      typeDefs: baseTypeDefs,
      resolvers: {
        Query: {
          _empty: () => null,
        },
        Mutation: {
          _empty: () => null,
        },
        Subscription: {
          _empty: () => null,
        },
      },
    });
  }

  // Get all schema extensions
  const schemaExtensions = schemaExtensionPoint.getExtensions();

  // Combine all type definitions
  const typeDefs = [baseTypeDefs, ...schemaExtensions.map((extension) => extension.typeDefs)];

  // Combine all resolvers
  const resolvers = schemaExtensions.reduce(
    (acc, extension) => {
      // Merge the resolvers from each extension
      return mergeResolvers(acc, extension.resolvers);
    },
    {
      Query: {
        _empty: () => null,
      },
      Mutation: {
        _empty: () => null,
      },
      Subscription: {
        _empty: () => null,
      },
    }
  );

  // Create the executable schema
  return makeExecutableSchema({
    typeDefs,
    resolvers,
  });
}

/**
 * Register a schema extension
 * @param id Extension ID
 * @param typeDefs GraphQL type definitions
 * @param resolvers GraphQL resolvers
 */
export function registerSchemaExtension(id: string, typeDefs: string, resolvers: any) {
  // Get the extension point manager
  const extensionPointManager = ExtensionPointManager.getInstance();

  // Get the schema extension point
  const schemaExtensionPoint =
    extensionPointManager.getExtensionPoint<SchemaExtension>("core.schema");

  if (!schemaExtensionPoint) {
    throw new Error("Schema extension point not registered");
  }

  // Register the schema extension
  schemaExtensionPoint.register({
    id,
    typeDefs,
    resolvers,
  });
}

/**
 * Merge resolvers
 * @param target Target resolver object
 * @param source Source resolver object
 */
function mergeResolvers(target: any, source: any) {
  const result = { ...target };

  Object.keys(source).forEach((key) => {
    if (result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
      result[key] = mergeResolvers(result[key], source[key]);
    } else {
      result[key] = source[key];
    }
  });

  return result;
}
