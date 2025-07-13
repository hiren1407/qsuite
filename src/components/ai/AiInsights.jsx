import React, { useState, useEffect } from 'react';
import { 
  LightBulbIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AiInsights = ({ testRuns, testCases, categories }) => {
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    generateInsights();
  }, [testRuns, testCases, categories]);

  const generateInsights = () => {
    const newInsights = [];

    // Analysis 1: Test Coverage
    const totalTestCases = testCases.length;
    const recentRuns = testRuns.filter(run => {
      const runDate = new Date(run.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return runDate > weekAgo;
    });

    if (totalTestCases > 0) {
      const coveragePercentage = (recentRuns.length / totalTestCases) * 100;
      
      if (coveragePercentage < 50) {
        newInsights.push({
          type: 'warning',
          title: 'Low Test Coverage',
          message: `Only ${Math.round(coveragePercentage)}% of your test cases have been run this week. Consider running more tests to ensure comprehensive coverage.`,
          action: 'Run more tests',
          priority: 'high'
        });
      } else if (coveragePercentage > 80) {
        newInsights.push({
          type: 'success',
          title: 'Excellent Test Coverage',
          message: `Great job! ${Math.round(coveragePercentage)}% of your test cases have been executed this week.`,
          action: 'Keep it up',
          priority: 'low'
        });
      }
    }

    // Analysis 2: Failure Patterns
    const failedRuns = testRuns.filter(run => run.status === 'failed');
    const failureRate = totalTestCases > 0 ? (failedRuns.length / testRuns.length) * 100 : 0;

    if (failureRate > 20) {
      newInsights.push({
        type: 'error',
        title: 'High Failure Rate',
        message: `${Math.round(failureRate)}% of your test runs are failing. This might indicate system instability or outdated test cases.`,
        action: 'Review failed tests',
        priority: 'high'
      });
    }

    // Analysis 3: Test Case Organization
    const categoriesWithTests = categories.filter(cat => 
      testCases.some(tc => tc.category_id === cat.id)
    );

    if (categories.length > categoriesWithTests.length) {
      newInsights.push({
        type: 'info',
        title: 'Empty Categories',
        message: `You have ${categories.length - categoriesWithTests.length} categories without test cases. Consider organizing your tests better.`,
        action: 'Organize test cases',
        priority: 'medium'
      });
    }

    // Analysis 4: Testing Frequency
    const oldTestCases = testCases.filter(tc => {
      const lastRun = testRuns
        .filter(run => run.test_case_id === tc.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      
      if (!lastRun) return true;
      
      const lastRunDate = new Date(lastRun.created_at);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      return lastRunDate < monthAgo;
    });

    if (oldTestCases.length > 0) {
      newInsights.push({
        type: 'warning',
        title: 'Stale Test Cases',
        message: `${oldTestCases.length} test cases haven't been run in over a month. Consider reviewing their relevance.`,
        action: 'Review old tests',
        priority: 'medium'
      });
    }

    // Analysis 5: Performance Insights
    const longRunningTests = testRuns.filter(run => run.duration && run.duration > 300); // > 5 minutes
    
    if (longRunningTests.length > 0) {
      newInsights.push({
        type: 'info',
        title: 'Performance Optimization',
        message: `${longRunningTests.length} tests are taking longer than 5 minutes. Consider optimizing for better efficiency.`,
        action: 'Optimize slow tests',
        priority: 'medium'
      });
    }

    // Analysis 6: Best Practices
    const testCasesWithoutDescription = testCases.filter(tc => 
      !tc.description || tc.description.trim().length < 50
    );

    if (testCasesWithoutDescription.length > 0) {
      newInsights.push({
        type: 'info',
        title: 'Documentation Improvement',
        message: `${testCasesWithoutDescription.length} test cases need better descriptions for maintainability.`,
        action: 'Improve documentation',
        priority: 'low'
      });
    }

    setInsights(newInsights);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <LightBulbIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getInsightBadge = (priority) => {
    const badges = {
      high: 'badge-error',
      medium: 'badge-warning',
      low: 'badge-info'
    };
    return badges[priority] || 'badge-info';
  };

  if (insights.length === 0) {
    return (
      <div className="bg-base-100 rounded-lg p-6 border border-base-300">
        <div className="flex items-center space-x-3 mb-4">
          <ChartBarIcon className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold">AI Testing Insights</h3>
        </div>
        <div className="text-center py-8">
          <LightBulbIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Run some tests to get AI-powered insights and recommendations!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-lg p-6 border border-base-300">
      <div className="flex items-center space-x-3 mb-6">
        <ChartBarIcon className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-semibold">AI Testing Insights</h3>
        <span className="badge badge-primary">{insights.length}</span>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-4 bg-base-50 rounded-lg border-l-4 border-l-primary"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getInsightIcon(insight.type)}
            </div>
            
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-base-content">{insight.title}</h4>
                <span className={`badge badge-sm ${getInsightBadge(insight.priority)}`}>
                  {insight.priority}
                </span>
              </div>
              
              <p className="text-sm text-base-content/70 mb-3">
                {insight.message}
              </p>
              
              <button className="btn btn-xs btn-outline btn-primary">
                {insight.action}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-base-300">
        <div className="flex items-center justify-between text-sm text-base-content/60">
          <span>Insights updated automatically</span>
          <span className="flex items-center space-x-1">
            <ChartBarIcon className="w-4 h-4" />
            <span>Powered by AI</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AiInsights;
