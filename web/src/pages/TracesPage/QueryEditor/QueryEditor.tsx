import React, { useEffect, useState } from 'react';
import { Split } from '@patternfly/react-core';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { BasicEditor, isBasicTraceQLQuery } from './BasicEditor';
import { TraceQLEditor } from './TraceQLEditor';

interface QueryEditorProps {
  query: string;
  setQuery: (query: string) => void;
}

export function QueryEditor(props: QueryEditorProps) {
  const { t } = useTranslation('plugin__distributed-tracing-console-plugin');
  // Parent query will be updated only on "run query" click, not on every change
  const [pendingQuery, setPendingQuery] = useState(props.query);
  const [isBasicMode, setBasicMode] = useState(isBasicTraceQLQuery(pendingQuery));

  // Propagate query state down from parent element,
  // but not up (only on "Run query" button click).
  useEffect(() => {
    setPendingQuery(props.query);
  }, [props.query]);

  return (
    <Split hasGutter>
      {isBasicMode ? (
        <BasicEditor query={pendingQuery} setQuery={setPendingQuery} />
      ) : (
        <TraceQLEditor query={pendingQuery} setQuery={setPendingQuery} />
      )}
      <Button
        variant="link"
        onClick={() => setBasicMode(!isBasicMode)}
        isDisabled={!isBasicMode && !isBasicTraceQLQuery(pendingQuery)}
      >
        {isBasicMode ? t('Show query') : t('Hide query')}
      </Button>
      <Button variant="primary" onClick={() => props.setQuery(pendingQuery)}>
        {t('Run query')}
      </Button>
    </Split>
  );
}
