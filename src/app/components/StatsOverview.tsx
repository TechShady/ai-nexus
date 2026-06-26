import React from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Text } from '@dynatrace/strato-components/typography';

interface StatsOverviewProps {
  skillsCount: number;
  promptsCount: number;
  dashboardsCount: number;
  appsCount: number;
  bestPracticesCount: number;
  tagsCount: number;
  recentCount: number;
  onStatClick?: (action: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  skillsCount, promptsCount, dashboardsCount, appsCount, bestPracticesCount, tagsCount, recentCount, onStatClick,
}) => {
  const stats = [
    { label: 'Skills', value: skillsCount, color: '#4589FF', action: 'tab-0' },
    { label: 'Prompts', value: promptsCount, color: '#A56EFF', action: 'tab-1' },
    { label: 'Dashboards', value: dashboardsCount, color: '#1192E8', action: 'tab-2' },
    { label: 'Apps', value: appsCount, color: '#42BE65', action: 'tab-3' },
    { label: 'Best Practices', value: bestPracticesCount, color: '#F1C21B', action: 'tab-4' },
    { label: 'Tags', value: tagsCount, color: '#EE5396', action: 'settings' },
    { label: 'Added this week', value: recentCount, color: '#82CFFF', action: '' },
  ];

  return (
    <div className="stats-overview">
      <Flex gap={16} flexWrap="wrap">
        {stats.map(stat => (
          <div
            key={stat.label}
            className={`stat-card ${stat.action ? 'stat-card-clickable' : ''}`}
            onClick={() => stat.action && onStatClick?.(stat.action)}
          >
            <Text className="stat-value" style={{ color: stat.color }}>{stat.value}</Text>
            <Text className="stat-label">{stat.label}</Text>
          </div>
        ))}
      </Flex>
    </div>
  );
};
