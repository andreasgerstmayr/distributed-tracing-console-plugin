import * as React from 'react';
import { TracingApp } from '../../../TracingApp';
import { memo } from 'react';
import { PageSection, Title } from '@patternfly/react-core';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { OpenTelemetryCollectorTable } from './components/OpenTelemetryCollectorTable';

function CollectorsList() {
  const { t } = useTranslation('plugin__distributed-tracing-console-plugin');

  return (
    <TracingApp>
      <Helmet>
        <title>{t('OpenTelemetry collectors')}</title>
      </Helmet>
      <PageSection>
        <Title headingLevel="h1">{t('OpenTelemetry collectors')}</Title>
      </PageSection>
      <PageSection>
        <OpenTelemetryCollectorTable />
      </PageSection>
    </TracingApp>
  );
}

export default memo(CollectorsList);
