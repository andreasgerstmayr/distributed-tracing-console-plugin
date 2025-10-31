import * as React from 'react';
import { memo } from 'react';
import { CollectorTopology } from './components/CollectorTopology';
import { PageSection, Title } from '@patternfly/react-core';
import { TracingApp } from '../../../TracingApp';
import { Helmet } from 'react-helmet';
import { useOpenTelemetryCollector } from '../../../hooks/useOpenTelemetryCollectors';
import { useParams } from 'react-router-dom-v5-compat';
import { LoadingState } from '../../../components/LoadingState';
import { ErrorAlert } from '../../../components/ErrorAlert';


function CollectorDetailPage() {
  return (
    <TracingApp>
      <CollectorDetailPageBody />
      </TracingApp>
  );
}

export default memo(CollectorDetailPage);

function CollectorDetailPageBody() {
  const {namespace, name} = useParams();
  console.log("names",namespace,"name",name);
  const [collector, loaded, error] = useOpenTelemetryCollector(namespace??"", name??"");
  console.log("loaded",[collector, loaded, error]);

    if (!loaded) {
      return <LoadingState />;
    }
  
    if (error) {
      return <ErrorAlert error={error} />;
    }


  return (
    <>
      <Helmet>
        <title>{name}</title>
      </Helmet>
      <PageSection>
        <Title headingLevel="h1">{name}</Title>
      </PageSection>
      <PageSection>
        <div style={{height:"600px"}}>
          <CollectorTopology config={collector.spec.config} />
        </div>
      </PageSection>
    </>
  );
}
