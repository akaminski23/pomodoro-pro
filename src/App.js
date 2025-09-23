import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';

const App = () => {
  const [mode, setMode] = useState('focus');
  const [taskType, setTaskType] = useState('Deep Work');
  const [customDuration, setCustomDuration] = useState(() => {
    const saved = localStorage.getItem('pomodoro-focus-duration');
    return saved ? parseInt(saved) : 25;
  });
  const [shortBreakDuration, setShortBreakDuration] = useState(() => {
    const saved = localStorage.getItem('pomodoro-short-break-duration');
    return saved ? parseInt(saved) : 5;
  });
  const [longBreakDuration, setLongBreakDuration] = useState(() => {
    const saved = localStorage.getItem('pomodoro-long-break-duration');
    return saved ? parseInt(saved) : 15;
  });
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [soundOption, setSoundOption] = useState('Bell');
  const [theme, setTheme] = useState('Purple');
  const [notificationPermission, setNotificationPermission] = useState('default');

  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);

  const modes = useMemo(() => ({
    focus: { duration: customDuration, label: 'Focus Time' },
    shortBreak: { duration: shortBreakDuration, label: 'Short Break' },
    longBreak: { duration: longBreakDuration, label: 'Long Break' }
  }), [customDuration, shortBreakDuration, longBreakDuration]);

  const taskTypes = ['Deep Work', 'Content Creation', 'Client Calls', 'Strategy Planning'];

  const soundOptions = [
    'Bell', 'Chime', 'Beep', 'Soft', 'Ping', 'Meditation Bell',
    'Gentle Fade', 'Ambient Tone', 'Wake Up Alarm', 'Air Horn', 'School Bell'
  ];

  const themes = {
    Purple: { primary: '#8B5CF6', secondary: '#A78BFA', background: '#F3F4F6', text: '#1F2937' },
    Blue: { primary: '#3B82F6', secondary: '#60A5FA', background: '#F3F4F6', text: '#1F2937' },
    Green: { primary: '#10B981', secondary: '#34D399', background: '#F3F4F6', text: '#1F2937' },
    Honey: { primary: '#F59E0B', secondary: '#FBBF24', background: '#FEF3C7', text: '#92400E' },
    Yellow: { primary: '#EAB308', secondary: '#FACC15', background: '#FEF9C3', text: '#854D0E' },
    Cream: { primary: '#D97706', secondary: '#F59E0B', background: '#FEF3C7', text: '#92400E' },
    Brown: { primary: '#8B4513', secondary: '#A0522D', background: '#F5F5DC', text: '#654321' },
    'Liquid Glass': {
      primary: '#2D3748',
      secondary: '#4A5568',
      background: 'transparent',
      text: '#FFFFFF',
      glass: true,
      gradient: 'linear-gradient(135deg, rgba(45, 55, 72, 0.8), rgba(74, 85, 104, 0.6), rgba(160, 174, 192, 0.4))',
      metallic: 'linear-gradient(145deg, #e2e8f0, #cbd5e0, #a0aec0)',
      accent: '#90CDF4'
    }
  };

  const getTextColor = (bgColor) => {
    const lightThemes = ['Honey', 'Yellow', 'Cream'];
    if (theme === 'Liquid Glass') return '#FFFFFF';
    return lightThemes.includes(theme) ? themes[theme].text : '#FFFFFF';
  };

  useEffect(() => {
    setTimeLeft(modes[mode].duration * 60);
  }, [mode, customDuration, modes]);

  useEffect(() => {
    if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pomodoro-focus-duration', customDuration.toString());
  }, [customDuration]);

  useEffect(() => {
    localStorage.setItem('pomodoro-short-break-duration', shortBreakDuration.toString());
  }, [shortBreakDuration]);

  useEffect(() => {
    localStorage.setItem('pomodoro-long-break-duration', longBreakDuration.toString());
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
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playSound = useCallback((soundType) => {
    const audioContext = createAudioContext();

    const soundConfigs = {
      'Bell': { wave: 'sine', frequency: 800, volume: 0.3, duration: 1 },
      'Chime': { wave: 'triangle', frequency: 1000, volume: 0.2, duration: 1.5 },
      'Beep': { wave: 'square', frequency: 440, volume: 0.3, duration: 0.5 },
      'Soft': { wave: 'sine', frequency: 300, volume: 0.2, duration: 2 },
      'Ping': { wave: 'sine', frequency: 1200, volume: 0.3, duration: 0.3 },
      'Meditation Bell': { wave: 'sine', frequency: 432, volume: 0.2, duration: 3 },
      'Gentle Fade': { wave: 'triangle', frequency: 600, volume: 0.2, duration: 2, fade: true },
      'Ambient Tone': { wave: 'sawtooth', frequency: 220, volume: 0.2, duration: 2.5 },
      'Wake Up Alarm': { wave: 'square', frequency: 800, volume: 0.6, duration: 1, pulse: true },
      'Air Horn': { wave: 'sawtooth', frequency: 200, volume: 0.8, duration: 1.5 },
      'School Bell': { wave: 'sine', frequency: 800, volume: 0.3, duration: 2, doubleTone: true }
    };

    const config = soundConfigs[soundType];
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = config.wave;
    oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);

    if (config.doubleTone) {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.type = config.wave;
      oscillator2.frequency.setValueAtTime(config.frequency * 1.5, audioContext.currentTime);
      gainNode2.gain.setValueAtTime(config.volume * 0.7, audioContext.currentTime);
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + config.duration);
    }

    if (config.fade) {
      gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration);
    } else if (config.pulse) {
      for (let i = 0; i < 3; i++) {
        gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime + i * 0.3);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + i * 0.3 + 0.1);
      }
    } else {
      gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
    }

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + config.duration);
  }, []);

  const showNotification = useCallback((title, body) => {
    if (notificationPermission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
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
    <div className={`app ${theme === 'Liquid Glass' ? 'liquid-glass-theme' : ''}`} style={{
      background: theme === 'Liquid Glass' ? currentTheme.gradient : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
      color: getTextColor(),
      minHeight: '100vh'
    }}>
      <div className="container">
        <header>
          <h1>🍅 Pomodoro Pro</h1>
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
            </div>
          </div>
        </header>

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

        <footer>
          <p>Press SPACE to start/pause | Install as PWA for best experience</p>
        </footer>
      </div>

      {theme === 'Liquid Glass' && (
        <svg className="glass-filter">
          <defs>
            <filter
              id="liquid-glass-filter"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.05 0.05"
                numOctaves="1"
                seed="1"
                result="turbulence"
              />
              <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="blurredNoise"
                scale="15"
                xChannelSelector="R"
                yChannelSelector="B"
                result="displaced"
              />
              <feGaussianBlur in="displaced" stdDeviation="1.5" result="finalBlur" />
              <feComposite in="finalBlur" in2="finalBlur" operator="over" />
            </filter>
          </defs>
        </svg>
      )}
    </div>
  );
};

export default App;
