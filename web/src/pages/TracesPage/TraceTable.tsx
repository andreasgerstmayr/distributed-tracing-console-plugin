import React from 'react';
import { TraceQueryPanelWrapper } from '../../components/PersesWrapper';
import { TraceTable as PersesTraceTable } from '@perses-dev/panels-plugin';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStatePrimary,
  Title,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import './TraceTable.css';

interface TraceTableProps {
  runQuery: (query: string) => void;
}

export function TraceTable({ runQuery }: TraceTableProps) {
  const { t } = useTranslation('plugin__distributed-tracing-console-plugin');

  const noResults = (
    <Bullseye>
      <EmptyState>
        <EmptyStateIcon icon={SearchIcon} />
        <Title headingLevel="h2" size="lg">
          {t('No results found')}
        </Title>
        <EmptyStateBody>
          {t('No results match this query criteria. Clear all filters and try again.')}
        </EmptyStateBody>
        <EmptyStatePrimary>
          <Button variant="link" onClick={() => runQuery('{}')}>
            {t('Clear all filters')}
          </Button>
        </EmptyStatePrimary>
      </EmptyState>
    </Bullseye>
  );

  return (
    <TraceQueryPanelWrapper noResults={noResults}>
      <div className="dt-plugin-trace-table">
        <PersesTraceTable.PanelComponent
          spec={{ visual: { palette: { mode: 'categorical' } } }}
          traceLink={traceDetailLink}
        />
      </div>
    </TraceQueryPanelWrapper>
  );
}

export function traceDetailLink({ traceId }: { traceId: string }) {
  return `/observe/traces/${traceId}?${new URLSearchParams(window.location.search).toString()}`;
}
