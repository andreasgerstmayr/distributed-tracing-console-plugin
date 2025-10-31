import React from 'react';
import {
  DataView,
  DataViewState,
  DataViewTable,
  type DataViewTd,
  type DataViewTr,
  type DataViewTh,
} from '@patternfly/react-data-view';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core';
import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { useOpenTelemetryCollectors } from '../../../../hooks/useOpenTelemetryCollectors';
import { LoadingState } from '../../../../components/LoadingState';
import { ErrorAlert } from '../../../../components/ErrorAlert';

export function OpenTelemetryCollectorTable() {
  const { t } = useTranslation('plugin__distributed-tracing-console-plugin');
  const [collectors, loaded, error] = useOpenTelemetryCollectors();

  const nameLabel = t('Name');
  const namespaceLabel = t('Namespace');
  const pipelinesLabel = t('Pipelines');
  const healthLabel = t('Health');

  const columns: DataViewTh[] = [nameLabel, namespaceLabel, pipelinesLabel, healthLabel];

  const rows: DataViewTr[] =
    loaded && !error
      ? collectors.map<DataViewTr>((collector) => {
          const rowId =collector.metadata.uid;

          const rowCells: DataViewTd[] = [
            {
              cell:
                  <Link
                    to={`/observe/collectors/${collector.metadata.namespace}/${collector.metadata.name}`}
                  >
                    <span>
                      <ResourceIcon
                        groupVersionKind={{
                          kind: 'OpenTelemetryCollector',
                          version: 'v1beta1',
                          group: 'opentelemetry.io',
                        }}
                      />{collector.metadata.name}
                    </span>
                  </Link>
               ,
              props: { dataLabel: nameLabel },
            },
            {
              cell: collector.metadata?.namespace || '-',
              props: { dataLabel: namespaceLabel },
            },
            {
              cell: Object.keys(collector.spec.config.service.pipelines).sort().join(", "),
              props: { dataLabel: pipelinesLabel },
            },
            {
              cell: (
                <strong>healthy</strong>
              ),
              props: { dataLabel: healthLabel },
            },
          ];

          return {
            id: rowId,
            row: rowCells,
          };
        })
      : [];

  const bodyStates: Partial<Record<DataViewState | string, React.ReactNode>> = {
    [DataViewState.loading]: <LoadingState />,
    [DataViewState.empty]: (
      <EmptyState titleText={t('No OpenTelemetryCollector instances found')} headingLevel="h4">
        <EmptyStateBody>
          {t('There are no OpenTelemetryCollector custom resources in the cluster.')}
        </EmptyStateBody>
      </EmptyState>
    ),
  };

  if (error) {
    bodyStates[DataViewState.error] = <ErrorAlert error={error as Error} />;
  }

  let activeState: DataViewState | undefined;

  if (!loaded) {
    activeState = DataViewState.loading;
  } else if (error) {
    activeState = DataViewState.error;
  } else if (collectors.length === 0) {
    activeState = DataViewState.empty;
  }

  return (
    <DataView activeState={activeState}>
      <DataViewTable
        aria-label={t('OpenTelemetryCollector instances')}
        columns={columns}
        rows={rows}
        bodyStates={bodyStates}
      />
    </DataView>
  );
}
