import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const App = () => {
  // Safe localStorage initialization for iOS Safari
  const getSafeLocalStorage = (key, defaultValue) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(key);
        return saved ? parseInt(saved) : defaultValue;
      }
    } catch (e) {
      console.log('localStorage not available:', e);
    }
    return defaultValue;
  };

  const setSafeLocalStorage = (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value.toString());
      }
    } catch (e) {
      console.log('localStorage write failed:', e);
    }
  };

  const [mode, setMode] = useState('focus');
  const [taskType, setTaskType] = useState('Deep Work');
  const [customDuration, setCustomDuration] = useState(() =>
    getSafeLocalStorage('pomodoro-focus-duration', 25)
  );
  const [shortBreakDuration, setShortBreakDuration] = useState(() =>
    getSafeLocalStorage('pomodoro-short-break-duration', 5)
  );
  const [longBreakDuration, setLongBreakDuration] = useState(() =>
    getSafeLocalStorage('pomodoro-long-break-duration', 15)
  );
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [soundOption, setSoundOption] = useState('Bell');
  const [theme, setTheme] = useState('Purple');
  const [notificationPermission, setNotificationPermission] = useState('default');

  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);

  // Simplified modes object
  const modes = {
    focus: { duration: customDuration, label: 'Focus Time' },
    shortBreak: { duration: shortBreakDuration, label: 'Short Break' },
    longBreak: { duration: longBreakDuration, label: 'Long Break' }
  };

  const taskTypes = ['Deep Work', 'Content Creation', 'Client Calls', 'Strategy Planning'];

  const soundOptions = [
    'Bell', 'Chime', 'Beep', 'Soft', 'Ping'
  ];

  // Simplified themes without complex Liquid Glass effects
  const themes = {
    Purple: { primary: '#8B5CF6', secondary: '#A78BFA', background: '#F3F4F6', text: '#1F2937' },
    Blue: { primary: '#3B82F6', secondary: '#60A5FA', background: '#F3F4F6', text: '#1F2937' },
    Green: { primary: '#10B981', secondary: '#34D399', background: '#F3F4F6', text: '#1F2937' },
    Honey: { primary: '#F59E0B', secondary: '#FBBF24', background: '#FEF3C7', text: '#92400E' }
  };

  const getTextColor = () => {
    return theme === 'Honey' ? themes[theme].text : '#FFFFFF';
  };

  useEffect(() => {
    setTimeLeft(modes[mode].duration * 60);
  }, [mode, customDuration, shortBreakDuration, longBreakDuration]);

  useEffect(() => {
    // Safe notification permission request
    try {
      if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        }).catch(e => {
          console.log('Notification permission failed:', e);
        });
      }
    } catch (e) {
      console.log('Notification API not available:', e);
    }

    // Simplified audio initialization
    const initAudio = () => {
      try {
        createAudioContext();
      } catch (e) {
        console.log('Audio initialization failed:', e);
      }
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('click', initAudio);
    };

    document.addEventListener('touchstart', initAudio, { once: true });
    document.addEventListener('click', initAudio, { once: true });

    return () => {
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('click', initAudio);
    };
  }, []);

  useEffect(() => {
    setSafeLocalStorage('pomodoro-focus-duration', customDuration);
  }, [customDuration]);

  useEffect(() => {
    setSafeLocalStorage('pomodoro-short-break-duration', shortBreakDuration);
  }, [shortBreakDuration]);

  useEffect(() => {
    setSafeLocalStorage('pomodoro-long-break-duration', longBreakDuration);
  }, [longBreakDuration]);

  const toggleTimer = useCallback(() => {
    setIsActive(!isActive);
  }, [isActive]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        toggleTimer();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [toggleTimer]);

  const createAudioContext = () => {
    if (!audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          console.log('AudioContext not supported');
          return null;
        }

        audioContextRef.current = new AudioContext();

        // iOS Safari requires user interaction to unlock audio context
        if (audioContextRef.current.state === 'suspended') {
          const unlockAudio = () => {
            audioContextRef.current.resume().then(() => {
              console.log('Audio context unlocked');
            }).catch(e => {
              console.log('Audio unlock failed:', e);
            });
          };
          unlockAudio();
        }
      } catch (e) {
        console.log('AudioContext creation failed:', e);
        return null;
      }
    }
    return audioContextRef.current;
  };

  const playSound = useCallback((soundType) => {
    try {
      const audioContext = createAudioContext();
      if (!audioContext || audioContext.state === 'suspended') {
        console.log('Audio context not available');
        return;
      }

      const soundConfigs = {
        'Bell': { wave: 'sine', frequency: 800, volume: 0.3, duration: 1 },
        'Chime': { wave: 'triangle', frequency: 1000, volume: 0.2, duration: 1.5 },
        'Beep': { wave: 'square', frequency: 440, volume: 0.3, duration: 0.5 },
        'Soft': { wave: 'sine', frequency: 300, volume: 0.2, duration: 2 },
        'Ping': { wave: 'sine', frequency: 1200, volume: 0.3, duration: 0.3 }
      };

      const config = soundConfigs[soundType] || soundConfigs['Bell'];
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = config.wave;
      oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + config.duration);
    } catch (error) {
      console.log('Audio playback failed:', error);
    }
  }, []);

  const showNotification = useCallback((title, body) => {
    try {
      if (notificationPermission === 'granted' && 'Notification' in window) {
        new Notification(title, {
          body,
          icon: `${process.env.PUBLIC_URL}/favicon.ico`
        });
      }
    } catch (e) {
      console.log('Notification failed:', e);
    }
  }, [notificationPermission]);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(modes[mode].duration * 60);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      playSound(soundOption);

      if (mode === 'focus') {
        setSessions(prev => prev + 1);
        const nextMode = sessions % 4 === 3 ? 'longBreak' : 'shortBreak';
        showNotification('Focus Complete!', `Time for a ${nextMode === 'longBreak' ? 'long' : 'short'} break`);
        setMode(nextMode);
      } else {
        showNotification('Break Complete!', 'Ready for another focus session?');
        setMode('focus');
      }
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, timeLeft, mode, sessions, soundOption, playSound, showNotification]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((modes[mode].duration * 60 - timeLeft) / (modes[mode].duration * 60)) * 100;
  const currentTheme = themes[theme];

  return (
    <div className="app" style={{
      background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
      color: getTextColor(),
      minHeight: '100vh'
    }}>
      <div className="container">
        <header>
          <h1>
            <img
              src={`${process.env.PUBLIC_URL}/icon-96.png?v=lg2`}
              alt="Pomodoro"
              className="pomodoro-icon"
              onError={(e) => {
                e.target.style.display = 'none';
                console.log('Icon load failed');
              }}
            />
            Pomodoro Pro
          </h1>
          <div className="controls-row">
            <div className="theme-selector">
              <label>Theme: </label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                {Object.keys(themes).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="sound-selector">
              <label>Sound: </label>
              <select value={soundOption} onChange={(e) => setSoundOption(e.target.value)}>
                {soundOptions.map(sound => (
                  <option key={sound} value={sound}>{sound}</option>
                ))}
              </select>
              <button
                className="test-sound-btn"
                onClick={() => playSound(soundOption)}
                aria-label="Test sound"
                title="Test selected sound"
              >
                🔊
              </button>
            </div>
          </div>
        </header>

        <div className="main-content">
          <div className="timer-section">
          <div className="mode-tabs">
            <button
              className={mode === 'focus' ? 'active' : ''}
              onClick={() => switchMode('focus')}
            >
              Focus
            </button>
            <button
              className={mode === 'shortBreak' ? 'active' : ''}
              onClick={() => switchMode('shortBreak')}
            >
              Short Break
            </button>
            <button
              className={mode === 'longBreak' ? 'active' : ''}
              onClick={() => switchMode('longBreak')}
            >
              Long Break
            </button>
          </div>

          {mode === 'focus' && (
            <div className="task-controls">
              <div className="task-type">
                <label>Task Type: </label>
                <select value={taskType} onChange={(e) => setTaskType(e.target.value)}>
                  {taskTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="duration-slider">
                <label>Duration: {customDuration} min</label>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                  disabled={isActive}
                />
              </div>
            </div>
          )}

          {mode === 'shortBreak' && (
            <div className="task-controls">
              <div className="duration-slider">
                <label>Short Break Duration: {shortBreakDuration} min</label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={shortBreakDuration}
                  onChange={(e) => setShortBreakDuration(parseInt(e.target.value))}
                  disabled={isActive}
                />
              </div>
            </div>
          )}

          {mode === 'longBreak' && (
            <div className="task-controls">
              <div className="duration-slider">
                <label>Long Break Duration: {longBreakDuration} min</label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={longBreakDuration}
                  onChange={(e) => setLongBreakDuration(parseInt(e.target.value))}
                  disabled={isActive}
                />
              </div>
            </div>
          )}

          <div className="timer-circle">
            <svg width="200" height="200" className="progress-ring">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="timer-display">
              <div className="time">{formatTime(timeLeft)}</div>
              <div className="mode-label">{modes[mode].label}</div>
              {mode === 'focus' && <div className="task-label">{taskType}</div>}
            </div>
          </div>

          <div className="timer-controls">
            <button onClick={toggleTimer} className="primary-btn">
              {isActive ? 'Pause' : 'Start'}
            </button>
            <button onClick={resetTimer} className="secondary-btn">
              Reset
            </button>
          </div>

          <div className="session-progress">
            <div className="sessions-completed">
              <span>Sessions Completed: {sessions}</span>
            </div>
            <div className="session-dots">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`session-dot ${i < sessions % 4 ? 'completed' : ''}`}
                />
              ))}
            </div>
          </div>
          </div>

          <div className="controls-section">
            <div className="stats-panel">
              <h3>Statistics</h3>
              <div className="stat-item">
                <span>Current Session:</span>
                <span>{mode === 'focus' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}</span>
              </div>
              <div className="stat-item">
                <span>Sessions Today:</span>
                <span>{sessions}</span>
              </div>
              <div className="stat-item">
                <span>Task Type:</span>
                <span>{taskType}</span>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <button onClick={() => playSound(soundOption)} className="action-btn">
                🔊 Test Sound
              </button>
              <button onClick={() => switchMode('focus')} className="action-btn">
                🎯 Focus Mode
              </button>
              <button onClick={() => switchMode('shortBreak')} className="action-btn">
                ☕ Short Break
              </button>
              <button onClick={() => switchMode('longBreak')} className="action-btn">
                🌅 Long Break
              </button>
            </div>
          </div>
        </div>

        <footer>
          <p>Press SPACE to start/pause | Install as PWA for best experience</p>
        </footer>
      </div>
    </div>
  );
};

export default App;