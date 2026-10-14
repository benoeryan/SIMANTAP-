import React from 'react';
import { StudentMonitoringDashboard, StudentMonitoringDashboardProps } from './StudentMonitoringDashboard';

export const StudentSummaryView: React.FC<StudentMonitoringDashboardProps> = (props) => {
  return <StudentMonitoringDashboard {...props} />;
};
