import { ObjectMetadata, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';


export interface OpenTelemetryCollector extends K8sResourceCommon {
  metadata: ObjectMetadata;
  spec: {
    config: Config;
  };
}

export interface Config {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  receivers: Record<string, any>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exporters: Record<string, any>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processors: Record<string, any>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connectors: Record<string, any>;

  service: Service;
}

export interface Service {
  pipelines: Record<string, Pipeline>;
}

export interface Pipeline {
  receivers: string[];
  processors?: string[];
  exporters: string[];
}


export function useOpenTelemetryCollectors() {
  return useK8sWatchResource<OpenTelemetryCollector[]>({
    groupVersionKind: {
      group: 'opentelemetry.io',
      version: 'v1beta1',
      kind: 'OpenTelemetryCollector',
    },
    isList: true,
  });
}

export function useOpenTelemetryCollector(namespace: string, name: string) {
  return useK8sWatchResource<OpenTelemetryCollector>({
    groupVersionKind: {
      group: 'opentelemetry.io',
      version: 'v1beta1',
      kind: 'OpenTelemetryCollector',
    },
    name: name,
    namespace: namespace,
    isList: false,
  });
}
