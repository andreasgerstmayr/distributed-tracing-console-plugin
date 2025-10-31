import * as React from 'react';
import { UploadIcon, DownloadIcon, FilterIcon, ConnectedIcon } from '@patternfly/react-icons';
import {
  action,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  DefaultEdge,
  DefaultGroup,
  DefaultNode,
  GraphComponent,
  GRAPH_LAYOUT_END_EVENT,
  ModelKind,
  NodeModel,
  NodeShape,
  observer,
  TopologyView,
  TopologyControlBar,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
  ComponentFactory,
  Model,
  Graph,
  Layout,
  GraphElement,
  EdgeModel,
  ElementModel,
  PipelineDagreLayout,
  NodeStatus,
} from '@patternfly/react-topology';
import { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';
import { Config } from '../../../../hooks/useOpenTelemetryCollectors';

type CustomNodeProps = {
  element: GraphElement<ElementModel, NodeData>;
};

type OTELComponentType = 'receiver' | 'exporter' | 'processor' | 'connector';
interface NodeData {
  type: OTELComponentType;
}

const NodeIcon: Record<OTELComponentType, React.ComponentClass<SVGIconProps>> = {
  receiver: DownloadIcon,
  processor: FilterIcon,
  exporter: UploadIcon,
  connector: ConnectedIcon,
};

const CustomNode: React.FC<CustomNodeProps> = observer(({ element, ...rest }) => {
  const data = element.getData();
  const Icon = NodeIcon[data?.type as OTELComponentType];

  return (
    <DefaultNode element={element} {...rest}>
      <g transform={`translate(25, 25)`}>
        <Icon style={{ color: '#393F44' }} width={25} height={25} />
      </g>
    </DefaultNode>
  );
});

const componentFactory: ComponentFactory = (kind: ModelKind, type: string) => {
  switch (type) {
    case 'group':
      return DefaultGroup;
    default:
      switch (kind) {
        case ModelKind.graph:
          return GraphComponent;
        case ModelKind.node:
          return CustomNode;
        case ModelKind.edge:
          return DefaultEdge;
        default:
          return undefined;
      }
  }
};

interface CollectorTopologyProps {
  config: Config;
}

export function CollectorTopology({ config }: CollectorTopologyProps) {
  const controller = React.useMemo(() => {
    const { nodes, edges } = buildTopology(config);

    const model: Model = {
      nodes,
      edges,
      graph: {
        id: 'g1',
        type: 'graph',
        layout: 'PipelineDagre',
      },
    };

    const controller = new Visualization();
    controller.setFitToScreenOnLayout(true);
    controller.registerLayoutFactory(
      (type: string, graph: Graph): Layout | undefined => new PipelineDagreLayout(graph),
    );
    controller.registerComponentFactory(componentFactory);

    controller.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
      controller.getGraph().fit(80);
    });

    controller.fromModel(model, false);
    return controller;
  }, [config]);

  return (
    <TopologyView
      controlBar={
        <TopologyControlBar
          controlButtons={createTopologyControlButtons({
            ...defaultControlButtonsOptions,
            zoomInCallback: action(() => {
              controller.getGraph().scaleBy(4 / 3);
            }),
            zoomOutCallback: action(() => {
              controller.getGraph().scaleBy(0.75);
            }),
            fitToScreenCallback: action(() => {
              controller.getGraph().fit(80);
            }),
            resetViewCallback: action(() => {
              controller.getGraph().reset();
              controller.getGraph().layout();
            }),
            legend: false,
          })}
        />
      }
    >
      <VisualizationProvider controller={controller}>
        <VisualizationSurface />
      </VisualizationProvider>
    </TopologyView>
  );
}

const NODE_DIAMETER = 75;
const NODE_SHAPE = NodeShape.rect;

function buildTopology(config: Config) {
  const nodes: NodeModel[] = [];
  const edges: EdgeModel[] = [];

  for (const [pipelineName, pipeline] of Object.entries(config.service.pipelines)) {
    const pipelineNodes: NodeModel[] = [];

    const processorIds = (pipeline.processors ?? []).map(
      (processor) => `${pipelineName}-processor-${processor}`,
    );
    const exporterIds = pipeline.exporters.map(
      (exporter) => `${pipelineName}-exporter-${exporter}`,
    );

    // The receivers sends data to the first processor (if defined), or to all exporters
    const receiverTargets = processorIds.length > 0 ? [processorIds[0]] : exporterIds;

    for (const receiver of pipeline.receivers) {
      const receiverId = `${pipelineName}-receiver-${receiver}`;
      pipelineNodes.push({
        id: receiverId,
        type: 'node',
        label: receiver,
        width: NODE_DIAMETER,
        height: NODE_DIAMETER,
        shape: NODE_SHAPE,
        data: {
          type: receiver in config.connectors ? 'connector' : 'receiver',
        },
      });

      for (const targetId of receiverTargets) {
        edges.push({
          id: `edge-${receiverId}-${targetId}`,
          type: 'edge',
          source: receiverId,
          target: targetId,
        });
      }
    }

    const numProcessor = pipeline.processors ? pipeline.processors.length : 0;
    for (let i = 0; i < numProcessor; i++) {
      const processor = pipeline.processors![i];
      const processorId = `${pipelineName}-processor-${processor}`;
      pipelineNodes.push({
        id: processorId,
        type: 'node',
        label: processor,
        width: NODE_DIAMETER,
        height: NODE_DIAMETER,
        shape: NODE_SHAPE,
        data: {
          type: 'processor',
        },
      });

      // The processor sends data to the next processor (if available), or to all exporters
      const processorTargets = i + 1 < numProcessor ? [processorIds[i + 1]] : exporterIds;
      for (const targetId of processorTargets) {
        edges.push({
          id: `edge-${processorId}-${targetId}`,
          type: 'edge',
          source: processorId,
          target: targetId,
        });
      }
    }

    for (const exporter of pipeline.exporters) {
      const exporterId = `${pipelineName}-exporter-${exporter}`;
      const isConnector = exporter in config.connectors;
      pipelineNodes.push({
        id: exporterId,
        type: 'node',
        label: exporter,
        width: NODE_DIAMETER,
        height: NODE_DIAMETER,
        shape: NODE_SHAPE,
        status: isConnector ? undefined : NodeStatus.danger,
        data: {
          type: isConnector ? 'connector' : 'exporter',
        },
      });

      // The connectors in the exporter pipeline send data to the receiver.
      const exporterTargets = isConnector
        ? Object.entries(config.service.pipelines)
            .filter(([, pipeline]) => pipeline.receivers.includes(exporter))
            .map(([pipelineName]) => `${pipelineName}-receiver-${exporter}`)
        : [];
      for (const targetId of exporterTargets) {
        edges.push({
          id: `edge-${exporterId}-${targetId}`,
          type: 'edge',
          source: exporterId,
          target: targetId,
        });
      }
    }

    nodes.push(...pipelineNodes);
    nodes.push({
      id: `pipeline-${pipelineName}`,
      children: pipelineNodes.map((n) => n.id),
      type: 'group',
      group: true,
      label: pipelineName,
      style: {
        padding: 40,
      },
    });
  }

  return { nodes, edges };
}
