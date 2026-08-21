import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INVALID_LICENSE = /^(?:NOASSERTION|NONE|UNKNOWN|UNLICENSED)$/i;
const UNRESOLVED_LICENSE_REFERENCE = /^(?:DocumentRef-[^:]+:)?LicenseRef-/i;
const MAPBOX_GL_NAME = 'mapbox-gl';
const MAPBOX_GL_GROUP_LICENSE = 'BSD';
const MAPBOX_GL_MANIFEST_LICENSE = 'SEE LICENSE IN LICENSE.txt';
const MAPBOX_GL_LICENSE_FILE = 'LICENSE.txt';
const SCOPE_LABELS = new Map([
  ['browser-production', 'browser production'],
  ['docker-build', 'Docker build'],
]);

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function npmPurl(name, version) {
  const encodedName = encodeURIComponent(name).replace(/%2F/gi, '/');
  return `pkg:npm/${encodedName}@${encodeURIComponent(version)}`;
}

function readInstalledPackageManifest(packagePath) {
  return JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
}

function readInstalledPackageLicenseText(packagePath, fileName) {
  const packageRoot = path.resolve(packagePath);
  const licensePath = path.resolve(packageRoot, fileName);
  if (licensePath !== packageRoot && !licensePath.startsWith(`${packageRoot}${path.sep}`)) {
    throw new Error(`installed license file escapes package path: ${fileName}`);
  }
  return fs.readFileSync(licensePath, 'utf8');
}

function mapboxLicenseRef(version) {
  if (!/^[0-9A-Za-z.-]+$/.test(version)) {
    throw new Error(`mapbox-gl@${version}: version cannot form a deterministic LicenseRef`);
  }
  return `LicenseRef-npm-mapbox-gl-${version}-Mapbox-TOS`;
}

function installedMapboxLicenseByVersion(
  entry,
  versions,
  readInstalledManifest,
  readInstalledLicenseText
) {
  if (!Array.isArray(entry.paths) || entry.paths.length === 0) {
    throw new Error('mapbox-gl: Mapbox TOS evidence requires installed package paths');
  }

  const expectedVersions = new Set(versions);
  const evidence = new Map();
  for (const [pathIndex, pathValue] of entry.paths.entries()) {
    const packagePath = requiredString(pathValue, `mapbox-gl.paths[${pathIndex}]`);
    const manifest = readInstalledManifest(packagePath);
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
      throw new Error('mapbox-gl: installed manifest must be an object');
    }
    const manifestName = requiredString(manifest.name, 'mapbox-gl installed manifest name');
    const version = requiredString(manifest.version, 'mapbox-gl installed manifest version');
    const manifestLicense = requiredString(
      manifest.license,
      `mapbox-gl@${version} installed license`
    );
    if (manifestName !== MAPBOX_GL_NAME || !expectedVersions.has(version)) {
      throw new Error(`mapbox-gl: installed manifest identity mismatch ${manifestName}@${version}`);
    }
    if (manifestLicense !== MAPBOX_GL_MANIFEST_LICENSE) {
      throw new Error(
        `mapbox-gl@${version}: expected installed license ${MAPBOX_GL_MANIFEST_LICENSE}, found ${manifestLicense}`
      );
    }
    const extractedText = readInstalledLicenseText(packagePath, MAPBOX_GL_LICENSE_FILE);
    if (typeof extractedText !== 'string' || extractedText.trim() === '') {
      throw new Error(`mapbox-gl@${version} ${MAPBOX_GL_LICENSE_FILE} must be a non-empty string`);
    }
    const licenseId = mapboxLicenseRef(version);
    const current = {
      licenseId,
      extractedText,
      name: `Mapbox Terms of Service for mapbox-gl@${version}`,
      comment: `Source: installed ${MAPBOX_GL_NAME}@${version}/${MAPBOX_GL_LICENSE_FILE}`,
    };
    const prior = evidence.get(version);
    if (prior && JSON.stringify(prior) !== JSON.stringify(current)) {
      throw new Error(`mapbox-gl@${version}: conflicting installed Mapbox TOS evidence`);
    }
    evidence.set(version, current);
  }
  return evidence;
}

function installedLicenseByVersion(entry, name, versions, readInstalledManifest) {
  if (!Array.isArray(entry.paths) || entry.paths.length === 0) {
    throw new Error(`${name}: unresolved license requires installed package paths`);
  }

  const expectedVersions = new Set(versions);
  const licenses = new Map();
  for (const [pathIndex, pathValue] of entry.paths.entries()) {
    const packagePath = requiredString(pathValue, `${name}.paths[${pathIndex}]`);
    const manifest = readInstalledManifest(packagePath);
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
      throw new Error(`${name}: installed manifest must be an object`);
    }
    const manifestName = requiredString(manifest.name, `${name} installed manifest name`);
    const version = requiredString(manifest.version, `${name} installed manifest version`);
    const license = requiredString(manifest.license, `${name}@${version} installed license`);
    if (manifestName !== name || !expectedVersions.has(version)) {
      throw new Error(`${name}: installed manifest identity mismatch ${manifestName}@${version}`);
    }
    if (INVALID_LICENSE.test(license) || UNRESOLVED_LICENSE_REFERENCE.test(license)) {
      throw new Error(`${name}@${version}: unresolved installed license ${license}`);
    }
    const prior = licenses.get(version);
    if (prior && prior !== license) {
      throw new Error(`${name}@${version}: conflicting installed licenses ${prior} and ${license}`);
    }
    licenses.set(version, license);
  }

  return licenses;
}

export function buildFrontendDependencySpdx(licenseInventory, scope, options = {}) {
  const readInstalledManifest = options.readInstalledManifest ?? readInstalledPackageManifest;
  const readInstalledLicenseText =
    options.readInstalledLicenseText ?? readInstalledPackageLicenseText;
  if (typeof readInstalledManifest !== 'function') {
    throw new Error('readInstalledManifest must be a function');
  }
  if (typeof readInstalledLicenseText !== 'function') {
    throw new Error('readInstalledLicenseText must be a function');
  }
  const scopeLabel = SCOPE_LABELS.get(scope);
  if (!scopeLabel) {
    throw new Error('scope must be browser-production or docker-build');
  }
  if (
    !licenseInventory ||
    typeof licenseInventory !== 'object' ||
    Array.isArray(licenseInventory)
  ) {
    throw new Error('pnpm license inventory must be an object');
  }

  const resolved = new Map();
  for (const [groupLicenseValue, entries] of Object.entries(licenseInventory)) {
    const groupLicense = requiredString(groupLicenseValue, 'license group');
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error(`license group ${groupLicense} must contain at least one package`);
    }

    for (const [entryIndex, entry] of entries.entries()) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error(`${groupLicense}[${entryIndex}] must be an object`);
      }
      const name = requiredString(entry.name, `${groupLicense}[${entryIndex}].name`);
      const license = requiredString(entry.license, `${name}.license`);
      if (license !== groupLicense) {
        throw new Error(`${name}: entry license ${license} does not match group ${groupLicense}`);
      }
      if (!Array.isArray(entry.versions) || entry.versions.length === 0) {
        throw new Error(`${name}.versions must contain at least one version`);
      }
      const versions = entry.versions.map((versionValue, versionIndex) =>
        requiredString(versionValue, `${name}.versions[${versionIndex}]`)
      );
      const unresolved =
        INVALID_LICENSE.test(license) || UNRESOLVED_LICENSE_REFERENCE.test(license);
      const installedLicenses = unresolved
        ? installedLicenseByVersion(entry, name, versions, readInstalledManifest)
        : null;
      const mapboxEvidence =
        name === MAPBOX_GL_NAME && license === MAPBOX_GL_GROUP_LICENSE
          ? installedMapboxLicenseByVersion(
              entry,
              versions,
              readInstalledManifest,
              readInstalledLicenseText
            )
          : null;

      for (const version of versions) {
        const extractedLicense = mapboxEvidence?.get(version);
        if (mapboxEvidence && !extractedLicense) {
          throw new Error(`mapbox-gl@${version}: missing installed Mapbox TOS evidence`);
        }
        const effectiveLicense =
          extractedLicense?.licenseId ?? installedLicenses?.get(version) ?? license;
        if (
          INVALID_LICENSE.test(effectiveLicense) ||
          (!extractedLicense && UNRESOLVED_LICENSE_REFERENCE.test(effectiveLicense))
        ) {
          throw new Error(`${name}@${version}: unresolved license ${effectiveLicense}`);
        }
        const key = `${name}\0${version}`;
        const prior = resolved.get(key);
        if (
          prior &&
          (prior.license !== effectiveLicense ||
            JSON.stringify(prior.extractedLicense) !== JSON.stringify(extractedLicense))
        ) {
          throw new Error(
            `${name}@${version}: conflicting licenses ${prior.license} and ${effectiveLicense}`
          );
        }
        resolved.set(key, { name, version, license: effectiveLicense, extractedLicense });
      }
    }
  }

  if (resolved.size === 0) {
    throw new Error('pnpm license inventory must resolve at least one dependency');
  }

  const dependencies = [...resolved.values()].sort((left, right) =>
    compareText(`${left.name}\0${left.version}`, `${right.name}\0${right.version}`)
  );
  const identity = crypto.createHash('sha256').update(JSON.stringify(dependencies)).digest('hex');
  const extractedLicenses = new Map();
  for (const dependency of dependencies) {
    if (!dependency.extractedLicense) continue;
    const prior = extractedLicenses.get(dependency.extractedLicense.licenseId);
    if (prior && JSON.stringify(prior) !== JSON.stringify(dependency.extractedLicense)) {
      throw new Error(
        `${dependency.name}@${dependency.version}: conflicting extracted license identity ${dependency.extractedLicense.licenseId}`
      );
    }
    extractedLicenses.set(dependency.extractedLicense.licenseId, dependency.extractedLicense);
  }
  const packages = dependencies.map((dependency, index) => ({
    SPDXID: `SPDXRef-Package-${String(index + 1).padStart(6, '0')}`,
    name: dependency.name,
    versionInfo: dependency.version,
    downloadLocation: 'NOASSERTION',
    filesAnalyzed: false,
    licenseConcluded: dependency.license,
    licenseDeclared: dependency.license,
    copyrightText: 'NOASSERTION',
    primaryPackagePurpose: 'LIBRARY',
    externalRefs: [
      {
        referenceCategory: 'PACKAGE-MANAGER',
        referenceType: 'purl',
        referenceLocator: npmPurl(dependency.name, dependency.version),
      },
    ],
  }));

  return {
    spdxVersion: 'SPDX-2.3',
    dataLicense: 'CC0-1.0',
    SPDXID: 'SPDXRef-DOCUMENT',
    name: `TerraFusion frontend ${scopeLabel} dependencies`,
    documentNamespace: `https://terrafusion.gov/spdx/frontend/${scope}/${identity}`,
    creationInfo: {
      created: '1970-01-01T00:00:00Z',
      creators: ['Tool: TerraFusion frontend_dependency_sbom.mjs'],
    },
    ...(extractedLicenses.size > 0
      ? { hasExtractedLicensingInfos: [...extractedLicenses.values()] }
      : {}),
    packages,
    relationships: packages.map(pkg => ({
      spdxElementId: 'SPDXRef-DOCUMENT',
      relationshipType: 'DESCRIBES',
      relatedSpdxElement: pkg.SPDXID,
    })),
  };
}

function main(args) {
  if (args.length !== 3) {
    throw new Error(
      'usage: frontend_dependency_sbom.mjs <pnpm-licenses.json> <output.spdx.json> <browser-production|docker-build>'
    );
  }
  const [inputPath, outputPath, scope] = args;
  const inventory = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const document = buildFrontendDependencySpdx(inventory, scope);
  fs.writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`${outputPath}: wrote ${document.packages.length} frontend ${scope} dependencies`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
