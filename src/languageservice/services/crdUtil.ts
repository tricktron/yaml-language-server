import { SingleYAMLDocument } from '../parser/yamlParser07';
import { JSONDocument } from '../parser/jsonParser07';

const CRD_URI = 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main';
const BUILTIN_KUBERNETES_API_GROUPS = [
  '',
  'admissionregistration.k8s.io',
  'apiextensions.k8s.io',
  'apiregistration.k8s.io',
  'apps',
  'authentication.k8s.io',
  'authorization.k8s.io',
  'autoscaling',
  'batch',
  'certificates.k8s.io',
  'coordination.k8s.io',
  'discovery.k8s.io',
  'events.k8s.io',
  'extensions',
  'flowcontrol.apiserver.k8s.io',
  'networking.k8s.io',
  'node.k8s.io',
  'policy',
  'rbac.authorization.k8s.io',
  'scheduling.k8s.io',
  'storage.k8s.io',
];

/**
 * Retrieve schema by auto-detecting the Kubernetes GroupVersionKind (GVK) from the document.
 * The matching schema is then retrieved from the CRD catalog.
 * Public for testing purpose, not part of the API.
 * @param doc
 */
export function autoDetectKubernetesSchemaFromDocument(doc: SingleYAMLDocument | JSONDocument): string | undefined {
  const res = getGroupVersionKindFromDocument(doc);
  if (!res) {
    return undefined;
  }

  const { group, version, kind } = res;
  if (!group || !version || !kind) {
    return undefined;
  }

  if (BUILTIN_KUBERNETES_API_GROUPS.includes(group)) {
    return undefined;
  }

  const schemaURL = `${CRD_URI}/${group.toLowerCase()}/${kind.toLowerCase()}_${version.toLowerCase()}.json`;
  return schemaURL;
}

/**
 * Retrieve the group, version and kind from the document.
 * Public for testing purpose, not part of the API.
 * @param doc
 */
export function getGroupVersionKindFromDocument(
  doc: SingleYAMLDocument | JSONDocument
): { group: string; version: string; kind: string } | undefined {
  if (doc instanceof SingleYAMLDocument) {
    try {
      const rootJSON = doc.root.internalNode.toJSON();
      if (!rootJSON) {
        return undefined;
      }

      const groupVersion: string = rootJSON['apiVersion'];
      if (!groupVersion) {
        return undefined;
      }

      let [group, version] = groupVersion.split('/');
      if (!version) {
        version = group;
        group = ''; // core kubernetes group is empty
      }

      const kind = rootJSON['kind'];
      if (!kind) {
        return undefined;
      }

      return { group, version, kind };
    } catch (error) {
      console.error('Error parsing YAML document:', error);
      return undefined;
    }
  }
  return undefined;
}
