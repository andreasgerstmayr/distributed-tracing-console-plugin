import * as React from 'react';
import { memo } from 'react';
import { CollectorTopology } from '../components/CollectorTopology';
import { Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { OpenTelemetryCollector } from '../../../../hooks/useOpenTelemetryCollectors';

function CollectorTab({
  loaded,
  obj: collector,
}: {
  loaded: boolean;
  obj: OpenTelemetryCollector;
}) {
  const { t } = useTranslation('plugin__distributed-tracing-console-plugin');
  return (
    <>
      <Title headingLevel="h1">{t('Data flow')}</Title>
      <CollectorTopology config={collector.spec.config} />
    </>
  );
}

export default memo(CollectorTab);
