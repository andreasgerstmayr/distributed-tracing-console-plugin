import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cancellableFetch } from '../../../cancellable-fetch';
import { TypeaheadSelect } from '../../../components/TypeaheadSelect';
import { TempoInstance, useTempoInstance } from '../../../hooks/useTempoInstance';
import { getProxyURLFor } from '../../../hooks/api';

interface BasicEditorProps {
  query: string;
  setQuery: (query: string) => void;
}

interface Filter {
  serviceName?: string;
  spanName?: string;
  status?: string;
}

function filterToTraceQL(filter: Filter) {
  // TODO: escape variables
  const parts: string[] = [];
  if (filter.serviceName) {
    parts.push(`resource.service.name = "${filter.serviceName}"`);
  }
  if (filter.spanName) {
    parts.push(`name = "${filter.spanName}"`);
  }
  if (filter.status) {
    parts.push(`status = ${filter.status}`);
  }

  if (parts.length === 0) {
    return '{}';
  }
  return `{ ${parts.join(' && ')} }`;
}

function traceQLToFilter(query: string): Filter {
  return {
    serviceName: query.match(/ resource.service.name = "(.+?)" /)?.[1],
    spanName: query.match(/ name = "(.+?)" /)?.[1],
    status: query.match(/ status = (.+?) /)?.[1],
  };
}

export function isBasicTraceQLQuery(query: string) {
  // if a query can be transformed to a filter and back to the original query, it's a basic query.
  return filterToTraceQL(traceQLToFilter(query)) === query;
}

export function BasicEditor({ query, setQuery }: BasicEditorProps) {
  const { t } = useTranslation('plugin__distributed-tracing-console-plugin');
  const [filter, setFilter] = useState<Filter>(traceQLToFilter(query));

  // update query if filter changes
  useEffect(() => {
    setQuery(filterToTraceQL(filter));
  }, [filter]);

  return (
    <>
      <AttributeSelect
        label={t('Service Name')}
        attribute="resource.service.name"
        query={query}
        selected={filter.serviceName}
        setSelected={(x) => setFilter({ ...filter, serviceName: x })}
      />
      <AttributeSelect
        label={t('Span Name')}
        attribute="name"
        query={query}
        selected={filter.spanName}
        setSelected={(x) => setFilter({ ...filter, spanName: x })}
      />
      <StatusSelect
        selected={filter.status}
        setSelected={(x) => setFilter({ ...filter, status: x })}
      />
    </>
  );
}

interface SearchTagValuesResponse {
  tagValues: {
    type: string;
    value: string;
  }[];
}

async function fetchTagValues(tempo: TempoInstance, query: string, tag: string) {
  const proxyUrl = getProxyURLFor(tempo);

  try {
    const { request } = cancellableFetch<SearchTagValuesResponse>(
      `${proxyUrl}/api/v2/search/tag/${encodeURIComponent(tag)}/values?${new URLSearchParams({
        q: query,
      })}`,
    );
    const response: SearchTagValuesResponse | undefined | null = await request();

    if (response && response.tagValues) {
      return response.tagValues
        .filter((tagValue) => tagValue.type === 'string')
        .map((tagValue) => tagValue.value);
    } else {
      throw new Error('Invalid Tempo tag values response');
    }
  } catch (error) {
    console.error(error);
    return [];
  }
}

interface AttributeSelectProps {
  label: string;
  attribute: string;
  /** the attributes are filtered based on this query */
  query: string;
  selected: string | undefined;
  setSelected: (value: string | undefined) => void;
}

/**
 * dynamic dropdown of e.g. service name or span name, filtered based on the current selection
 * (i.e. if a service is selected, the span name field only contains span names of the selected service)
 */
function AttributeSelect({ label, attribute, query, selected, setSelected }: AttributeSelectProps) {
  const [tempo] = useTempoInstance();
  const [isLoading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    async function startFetching() {
      setLoading(true);
      let options: string[] = [];
      if (tempo) {
        options = await fetchTagValues(tempo, query, attribute);
      }
      setOptions(options.sort());
      setLoading(false);
    }
    startFetching();
  }, [tempo, query]);

  return (
    <TypeaheadSelect
      width={250}
      label={label}
      isLoading={isLoading}
      options={options}
      selected={selected}
      setSelected={setSelected}
    />
  );
}

interface StatusSelectProps {
  selected: string | undefined;
  setSelected: (value: string | undefined) => void;
}

function StatusSelect({ selected, setSelected }: StatusSelectProps) {
  const { t } = useTranslation('plugin__distributed-tracing-console-plugin');
  const options = ['unset', 'ok', 'error'];

  return (
    <TypeaheadSelect
      width={150}
      label={t('Status')}
      options={options}
      selected={selected}
      setSelected={setSelected}
    />
  );
}
