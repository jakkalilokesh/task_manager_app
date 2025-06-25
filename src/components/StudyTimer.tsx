import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, BookOpen, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface StudyTimerProps {
  tasks: any[];
  onSessionComplete: (sessionData: any) => void;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ tasks, onSessionComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [selectedTask, setSelectedTask] = useState(null);
  const [sessionType, setSessionType] = useState('work'); // work, short-break, long-break
  const [completedSessions, setCompletedSessions] = useState(0);
  const [notes, setNotes] = useState('');

  const sessionDurations = {
    work: 25 * 60,
    'short-break': 5 * 60,
    'long-break': 15 * 60
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(time => time - 1);
      }, 1000);
    } else if (time === 0) {
      handleSessionComplete();
    }
    
    return () => clearInterval(interval);
  }, [isRunning, time]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    
    const sessionData = {
      type: sessionType,
      duration: sessionDurations[sessionType],
      taskId: selectedTask?.id,
      subject: selectedTask?.subject,
      notes: notes,
      completedAt: new Date().toISOString()
    };
    
    onSessionComplete(sessionData);
    
    if (sessionType === 'work') {
      setCompletedSessions(prev => prev + 1);
      // Auto-switch to break
      if (completedSessions + 1 >= 4) {
        setSessionType('long-break');
        setTime(sessionDurations['long-break']);
        setCompletedSessions(0);
      } else {
        setSessionType('short-break');
        setTime(sessionDurations['short-break']);
      }
    } else {
      // Switch back to work
      setSessionType('work');
      setTime(sessionDurations.work);
    }
    
    // Show notification
    if (Notification.permission === 'granted') {
      new Notification('Study Session Complete!', {
        body: `${sessionType === 'work' ? 'Work' : 'Break'} session finished. Time for a ${sessionType === 'work' ? 'break' : 'work session'}!`,
        icon: '/favicon.ico'
      });
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(sessionDurations[sessionType]);
  };

  const switchSession = (type: string) => {
    setSessionType(type);
    setTime(sessionDurations[type]);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((sessionDurations[sessionType] - time) / sessionDurations[sessionType]) * 100;

  const pendingTasks = tasks.filter(task => task.status !== 'COMPLETED');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Study Timer</h2>
        <p className="text-gray-600">Use the Pomodoro Technique to boost your productivity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timer Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            {/* Session Type Selector */}
            <div className="flex justify-center space-x-4 mb-8">
              {Object.keys(sessionDurations).map((type) => (
                <button
                  key={type}
                  onClick={() => switchSession(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    sessionType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Timer Display */}
            <div className="relative mb-8">
              <motion.div
                className="w-64 h-64 mx-auto rounded-full border-8 border-gray-200 relative"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke={sessionType === 'work' ? '#3B82F6' : '#10B981'}
                    strokeWidth="8"
                    strokeDasharray={`${progress * 2.83} 283`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                      {formatTime(time)}
                    </div>
                    <div className="text-lg text-gray-500 capitalize">
                      {sessionType.replace('-', ' ')}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={toggleTimer}
                className={`flex items-center px-8 py-4 rounded-xl font-medium text-white transition-colors ${
                  isRunning
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start
                  </>
                )}
              </button>
              
              <button
                onClick={resetTimer}
                className="flex items-center px-6 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
              >
                <Square className="w-5 h-5 mr-2" />
                Reset
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="flex justify-center space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < completedSessions ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {completedSessions}/4 sessions completed
            </p>
          </div>
        </div>

        {/* Task Selection & Notes */}
        <div className="space-y-6">
          {/* Current Task */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Current Task
            </h3>
            
            {selectedTask ? (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900">{selectedTask.title}</h4>
                <p className="text-sm text-blue-700">{selectedTask.subject}</p>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                >
                  Change task
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No task selected</p>
              </div>
            )}
          </div>

          {/* Task List */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Task</h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pendingTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedTask?.id === task.id
                      ? 'bg-blue-100 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">{task.title}</div>
                  <div className="text-xs text-gray-500">{task.subject}</div>
                </button>
              ))}
            </div>
            
            {pendingTasks.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No pending tasks available
              </p>
            )}
          </div>

          {/* Session Notes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Notes</h3>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about your study session..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};