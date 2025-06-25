import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, Clock, Target, Award, RefreshCw } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface AnalyticsProps {
  analytics: any;
  tasks: any[];
  onRefresh: () => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ analytics, tasks, onRefresh }) => {
  const [timeRange, setTimeRange] = useState('week'); // week, month, year

  // Calculate task completion over time
  const getTaskCompletionData = () => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const completedTasks = tasks.filter(task => 
        task.status === 'COMPLETED' && 
        task.completedAt && 
        format(new Date(task.completedAt), 'yyyy-MM-dd') === dateStr
      ).length;
      
      data.push({
        date: format(date, timeRange === 'week' ? 'EEE' : 'MMM dd'),
        completed: completedTasks,
        fullDate: dateStr
      });
    }
    
    return data;
  };

  // Calculate subject distribution
  const getSubjectData = () => {
    const subjectCounts = {};
    tasks.forEach(task => {
      subjectCounts[task.subject] = (subjectCounts[task.subject] || 0) + 1;
    });
    
    return Object.entries(subjectCounts).map(([subject, count]) => ({
      subject,
      count,
      percentage: ((count as number) / tasks.length * 100).toFixed(1)
    }));
  };

  // Calculate priority distribution
  const getPriorityData = () => {
    const priorityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0, URGENT: 0 };
    tasks.forEach(task => {
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
    });
    
    return Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
      color: priority === 'URGENT' ? '#DC2626' : 
             priority === 'HIGH' ? '#EA580C' :
             priority === 'MEDIUM' ? '#D97706' : '#65A30D'
    }));
  };

  // Calculate productivity metrics
  const getProductivityMetrics = () => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    
    const thisWeekTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });
    
    const completedThisWeek = thisWeekTasks.filter(task => task.status === 'COMPLETED').length;
    const overdueCount = tasks.filter(task => 
      new Date(task.dueDate) < now && task.status !== 'COMPLETED'
    ).length;
    
    return {
      weeklyCompletion: thisWeekTasks.length > 0 ? (completedThisWeek / thisWeekTasks.length * 100).toFixed(1) : 0,
      averageTasksPerDay: (tasks.length / 30).toFixed(1),
      overduePercentage: tasks.length > 0 ? (overdueCount / tasks.length * 100).toFixed(1) : 0,
      mostProductiveDay: getMostProductiveDay()
    };
  };

  const getMostProductiveDay = () => {
    const dayCompletions = {};
    tasks.filter(task => task.status === 'COMPLETED' && task.completedAt).forEach(task => {
      const day = format(new Date(task.completedAt), 'EEEE');
      dayCompletions[day] = (dayCompletions[day] || 0) + 1;
    });
    
    return Object.entries(dayCompletions).reduce((a, b) => 
      dayCompletions[a[0]] > dayCompletions[b[0]] ? a : b, ['Monday', 0]
    )[0];
  };

  const completionData = getTaskCompletionData();
  const subjectData = getSubjectData();
  const priorityData = getPriorityData();
  const productivityMetrics = getProductivityMetrics();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h2>
          <p className="text-gray-600">Track your productivity and task completion patterns</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Last year</option>
          </select>
          
          <button
            onClick={onRefresh}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Productivity Score</p>
              <p className="text-3xl font-bold text-green-600">{analytics.productivityScore}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Weekly Completion</p>
              <p className="text-3xl font-bold text-blue-600">{productivityMetrics.weeklyCompletion}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Completion Time</p>
              <p className="text-3xl font-bold text-purple-600">{analytics.averageCompletionTime.toFixed(1)}d</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Most Productive Day</p>
              <p className="text-2xl font-bold text-orange-600">{productivityMetrics.mostProductiveDay}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Task Completion Over Time */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Task Completion Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ priority, count }) => `${priority}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Distribution */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Tasks by Subject</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={subjectData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-4">Completion Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tasks</span>
              <span className="font-medium">{analytics.totalTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium text-green-600">{analytics.completedTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Overdue</span>
              <span className="font-medium text-red-600">{analytics.overdueTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-medium">
                {analytics.totalTasks > 0 ? 
                  ((analytics.completedTasks / analytics.totalTasks) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-4">Time Management</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg. Tasks/Day</span>
              <span className="font-medium">{productivityMetrics.averageTasksPerDay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Overdue Rate</span>
              <span className="font-medium text-red-600">{productivityMetrics.overduePercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Best Day</span>
              <span className="font-medium">{productivityMetrics.mostProductiveDay}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-4">Subject Breakdown</h4>
          <div className="space-y-3">
            {subjectData.slice(0, 4).map((subject, index) => (
              <div key={subject.subject} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-600 text-sm">{subject.subject}</span>
                </div>
                <span className="font-medium text-sm">{subject.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};