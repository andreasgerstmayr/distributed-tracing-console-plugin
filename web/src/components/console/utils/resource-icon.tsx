import React from 'react';

interface ResourceIconProps {
  resource: Resource;
}

export function ResourceIcon({ resource }: ResourceIconProps) {
  return (
    <span className="co-m-resource-icon" title={resource.label}>
      {resource.abbr}
    </span>
  );
}

interface Resource {
  abbr: string;
  kind: string;
  label: string;
}

export const TempoStackResource: Resource = {
  kind: 'TempoStack',
  label: 'TempoStack',
  abbr: 'TS',
};

export const TempoMonolithicResource: Resource = {
  kind: 'TempoMonolithic',
  label: 'TempoMonolithic',
  abbr: 'TM',
};
