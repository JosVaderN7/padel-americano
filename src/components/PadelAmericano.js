import React, { useState, useEffect } from 'react';
import { Users, Trophy, Play, Plus, Minus, Crown, Medal, Award, Clock, Volume2, VolumeX, Pause, RotateCcw } from 'lucide-react';

const PadelAmericano = () => {
    const [stage, setStage] = useState('setup');
    const [players, setPlayers] = useState(['', '', '', '', '', '', '', '']);
    const [numCourts, setNumCourts] = useState(1);
    const [rounds, setRounds] = useState([]);
    const [currentRound, setCurrentRound] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);

    // Timer states - ahora por ronda
    const [timerMinutes, setTimerMinutes] = useState(15);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isTimerPaused, setIsTimerPaused] = useState(false);
    const [showTimer, setShowTimer] = useState(false);
    const [timerSound, setTimerSound] = useState(true);
    const [timerInterval, setTimerInterval] = useState(null);
    const [timerFinished, setTimerFinished] = useState(false);
    const [soundInterval, setSoundInterval] = useState(null);

    // Store original timer values for reset
    const [originalMinutes, setOriginalMinutes] = useState(15);
    const [originalSeconds, setOriginalSeconds] = useState(0);

    // Timer functions
    const playBeep = () => {
        if (timerSound) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    };

    const startRepeatingBeep = () => {
        if (timerSound && !timerFinished) {
            // Clear any existing sound interval first
            if (soundInterval) {
                clearInterval(soundInterval);
                setSoundInterval(null);
            }

            // Play first beep immediately
            playBeep();

            // Set up repeating beep every 2 seconds
            const interval = setInterval(() => {
                playBeep();
            }, 2000);

            setSoundInterval(interval);
            setTimerFinished(true);
        }
    };

    const stopRepeatingBeep = () => {
        // Clear sound interval
        if (soundInterval) {
            clearInterval(soundInterval);
            setSoundInterval(null);
        }
        // Clear timer interval if it exists
        if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
        }
        // Reset all timer states
        setTimerFinished(false);
        setIsTimerRunning(false);
        setIsTimerPaused(false);
        // Reset timer to original values when stopping the beep
        setTimerSeconds(originalSeconds);
        setTimerMinutes(originalMinutes);
    };

    const startTimer = () => {
        if (!isTimerRunning && !timerFinished) {
            setIsTimerRunning(true);
            setIsTimerPaused(false);
        }
    };

    // Timer effect - CORREGIDO para evitar negativos
    useEffect(() => {
        if (isTimerRunning && !isTimerPaused && !timerFinished) {
            const interval = setInterval(() => {
                setTimerSeconds(prevSeconds => {
                    if (prevSeconds === 0) {
                        if (timerMinutes === 0) {
                            // Timer finished - NO permitir negativos
                            startRepeatingBeep();
                            setIsTimerRunning(false);
                            return 0;
                        } else {
                            setTimerMinutes(prevMinutes => Math.max(0, prevMinutes - 1));
                            return 59;
                        }
                    }
                    return Math.max(0, prevSeconds - 1);
                });
            }, 1000);
            setTimerInterval(interval);

            return () => {
                clearInterval(interval);
                setTimerInterval(null);
            };
        }
    }, [isTimerRunning, isTimerPaused, timerFinished, timerMinutes]);

    const pauseTimer = () => {
        if (isTimerRunning) {
            setIsTimerPaused(true);
        }
    };

    const resumeTimer = () => {
        if (isTimerPaused) {
            setIsTimerPaused(false);
        }
    };

    const resetTimer = () => {
        clearAllTimers();
        setTimerSeconds(originalSeconds);
        setTimerMinutes(originalMinutes);
    };

    const formatTime = (minutes, seconds) => {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const clearAllTimers = () => {
        // Clear timer interval
        if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
        }
        // Clear sound interval
        if (soundInterval) {
            clearInterval(soundInterval);
            setSoundInterval(null);
        }
        // Reset all timer states
        setTimerFinished(false);
        setIsTimerRunning(false);
        setIsTimerPaused(false);
    };

    // Cleanup all intervals on unmount and when stage changes
    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, [stage]);

    // Reset timer when changing rounds
    useEffect(() => {
        if (stage === 'playing') {
            clearAllTimers();
            setTimerSeconds(originalSeconds);
            setTimerMinutes(originalMinutes);
        }
    }, [currentRound, originalMinutes, originalSeconds]);

    const addPlayer = () => {
        setPlayers([...players, '']);
    };

    const removePlayer = (index) => {
        if (players.length > 4) {
            setPlayers(players.filter((_, i) => i !== index));
        }
    };

    const updatePlayer = (index, name) => {
        const newPlayers = [...players];
        newPlayers[index] = name;
        setPlayers(newPlayers);
    };

    const generateTournament = (playerList, courts) => {
        const validPlayers = [...playerList];
        const n = validPlayers.length;

        if (n < 4 || n % 2 !== 0) return [];

        const roundsCount = n - 1;
        const allRounds = [];
        const fixedPlayer = validPlayers.pop();

        for (let r = 0; r < roundsCount; r++) {
            const roundMatches = [];
            const pairings = [];

            pairings.push([fixedPlayer, validPlayers[r]]);

            for (let i = 1; i < n / 2; i++) {
                const p1_index = (r + i) % (n - 1);
                const p2_index = (r - i + (n - 1)) % (n - 1);
                pairings.push([validPlayers[p1_index], validPlayers[p2_index]]);
            }

            for (let i = 0; i < pairings.length; i += 2) {
                if (i + 1 < pairings.length) {
                    roundMatches.push({
                        team1: pairings[i],
                        team2: pairings[i + 1],
                        court: (Math.floor(i / 2) % courts) + 1,
                        score1: '',
                        score2: '',
                        finished: false,
                    });
                }
            }
            allRounds.push(roundMatches);
        }
        return allRounds;
    };

    const startTournament = () => {
        const validPlayers = players.filter(p => p.trim() !== '').map(p => p.trim());

        if (validPlayers.length < 4 || validPlayers.length % 2 !== 0) {
            alert("Necesitas un número par de jugadores, mínimo 4");
            return;
        }

        if (numCourts < 1) {
            alert("Necesitas al menos 1 cancha");
            return;
        }

        const generatedRounds = generateTournament(validPlayers, numCourts);
        setRounds(generatedRounds);
        setCurrentRound(0);
        setStage('playing');
        setShowTimer(true); // Show timer when tournament starts
    };

    const updateScore = (matchIndex, team, score) => {
        const newRounds = [...rounds];
        newRounds[currentRound][matchIndex][`score${team}`] = score;
        setRounds(newRounds);
    };

    const finishMatch = (matchIndex) => {
        const newRounds = [...rounds];
        const match = newRounds[currentRound][matchIndex];
        if (match.score1 !== '' && match.score2 !== '') {
            match.finished = true;
            setRounds(newRounds);
            calculateLeaderboard();
        }
    };

    const reopenMatch = (matchIndex) => {
        const newRounds = [...rounds];
        newRounds[currentRound][matchIndex].finished = false;
        setRounds(newRounds);
        calculateLeaderboard();
    };

    const calculateLeaderboard = () => {
        const validPlayers = players.filter(p => p.trim() !== '').map(p => p.trim());
        const playerStats = {};

        validPlayers.forEach(player => {
            playerStats[player] = {
                name: player,
                wins: 0,
                losses: 0,
                pointsFor: 0,
                pointsAgainst: 0
            };
        });

        rounds.forEach(round => {
            round.forEach(match => {
                if (match.finished) {
                    const score1 = parseInt(match.score1) || 0;
                    const score2 = parseInt(match.score2) || 0;
                    const team1Won = score1 > score2;

                    match.team1.forEach(player => {
                        if (playerStats[player]) {
                            playerStats[player].pointsFor += score1;
                            playerStats[player].pointsAgainst += score2;
                            if (team1Won) playerStats[player].wins++;
                            else playerStats[player].losses++;
                        }
                    });

                    match.team2.forEach(player => {
                        if (playerStats[player]) {
                            playerStats[player].pointsFor += score2;
                            playerStats[player].pointsAgainst += score1;
                            if (!team1Won) playerStats[player].wins++;
                            else playerStats[player].losses++;
                        }
                    });
                }
            });
        });

        const sortedPlayers = Object.values(playerStats)
            .map(player => ({
                ...player,
                pointDifference: player.pointsFor - player.pointsAgainst
            }))
            .sort((a, b) =>
                b.wins - a.wins ||
                b.pointDifference - a.pointDifference ||
                b.pointsFor - a.pointsFor
            );

        let rank = 1;
        const playersWithRank = sortedPlayers.map((player, index) => {
            if (index > 0) {
                const prev = sortedPlayers[index - 1];
                if (player.wins !== prev.wins ||
                    player.pointDifference !== prev.pointDifference ||
                    player.pointsFor !== prev.pointsFor) {
                    rank++;
                }
            }
            return { ...player, rank };
        });

        setLeaderboard(playersWithRank);
    };

    const nextRound = () => {
        if (currentRound < rounds.length - 1) {
            // Reset timer for new round
            clearAllTimers();
            setTimerSeconds(originalSeconds);
            setTimerMinutes(originalMinutes);
            setCurrentRound(currentRound + 1);
        }
    };

    const prevRound = () => {
        if (currentRound > 0) {
            // Reset timer for previous round
            clearAllTimers();
            setTimerSeconds(originalSeconds);
            setTimerMinutes(originalMinutes);
            setCurrentRound(currentRound - 1);
        }
    };

    const finishTournament = () => {
        clearAllTimers();
        calculateLeaderboard();
        setStage('finished');
    };

    const newTournament = () => {
        clearAllTimers();
        setStage('setup');
        setPlayers(['', '', '', '', '', '', '', '']);
        setNumCourts(1);
        setRounds([]);
        setCurrentRound(0);
        setLeaderboard([]);
        setShowTimer(false);
        // Reset original values to defaults
        setOriginalMinutes(15);
        setOriginalSeconds(0);
        setTimerMinutes(15);
        setTimerSeconds(0);
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
            case 2: return <Medal className="w-6 h-6 text-gray-400" />;
            case 3: return <Award className="w-6 h-6 text-orange-400" />;
            default: return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-purple-800">#{rank}</span>;
        }
    };

    // Colores de Wimbledon
    const colors = {
        primary: '#6f2c91', // Púrpura Wimbledon
        secondary: '#00a650', // Verde Wimbledon
        accent: '#d63384', // Rosa/Magenta
        court: '#1E69EA', // Azul cancha
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
    };

    if (stage === 'setup') {
        const validCount = players.filter(p => p.trim() !== '').length;
        const isValid = validCount >= 4 && validCount % 2 === 0;

        return (
            <div className="min-h-screen p-6" style={{ background: colors.background }}>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3" style={{ color: colors.primary }}>
                            <Trophy style={{ color: colors.secondary }} />
                            Pádel Americano
                        </h1>
                        <p style={{ color: colors.primary }}>Configura tu torneo americano</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-md border-2" style={{ borderColor: colors.secondary }}>
                            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2" style={{ color: colors.primary }}>
                                <Users style={{ color: colors.secondary }} />
                                Jugadores ({validCount})
                            </h2>

                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {players.map((player, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={player}
                                            onChange={(e) => updatePlayer(index, e.target.value)}
                                            placeholder={`Jugador ${index + 1}`}
                                            className="flex-1 px-3 py-2 border-2 rounded-lg focus:ring-2 focus:border-transparent"
                                            style={{
                                                borderColor: colors.secondary,
                                            }}
                                        />
                                        {players.length > 4 && (
                                            <button
                                                onClick={() => removePlayer(index)}
                                                className="px-3 py-2 text-white rounded-lg hover:opacity-80"
                                                style={{ backgroundColor: colors.accent }}
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={addPlayer}
                                className="mt-4 w-full px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2"
                                style={{ backgroundColor: colors.secondary }}
                            >
                                <Plus className="w-4 h-4" />
                                Agregar Jugador
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border-2" style={{ borderColor: colors.secondary }}>
                            <h2 className="text-2xl font-semibold mb-4" style={{ color: colors.primary }}>Configuración</h2>

                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
                                    Número de canchas disponibles
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={numCourts}
                                    onChange={(e) => setNumCourts(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:border-transparent"
                                    style={{ borderColor: colors.secondary }}
                                />
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: colors.primary }}>
                                    <Clock style={{ color: colors.secondary }} />
                                    Configuración del Timer
                                </h3>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
                                            Minutos
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={timerMinutes}
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                                setTimerMinutes(value);
                                                setOriginalMinutes(value);
                                            }}
                                            className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:border-transparent"
                                            style={{ borderColor: colors.secondary }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
                                            Segundos
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            value={timerSeconds}
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                                setTimerSeconds(value);
                                                setOriginalSeconds(value);
                                            }}
                                            className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:border-transparent"
                                            style={{ borderColor: colors.secondary }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setTimerSound(!timerSound)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors"
                                        style={{
                                            borderColor: colors.secondary,
                                            backgroundColor: timerSound ? colors.secondary : 'transparent',
                                            color: timerSound ? 'white' : colors.primary
                                        }}
                                    >
                                        {timerSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                        Sonido
                                    </button>

                                    <div className="text-sm" style={{ color: colors.primary }}>
                                        Tiempo configurado: <strong>{formatTime(timerMinutes, timerSeconds)}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg mb-6 border-l-4" style={{ backgroundColor: '#f8f9fa', borderLeftColor: colors.secondary }}>
                                <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>Torneo Americano:</h3>
                                <ul className="text-sm space-y-1" style={{ color: colors.primary }}>
                                    <li>• Jugadores válidos: <strong>{validCount}</strong></li>
                                    <li>• Canchas: <strong>{numCourts}</strong></li>
                                    <li>• Rondas necesarias: <strong>{isValid ? validCount - 1 : 0}</strong></li>
                                    <li>• Partidos por ronda: <strong>{isValid ? Math.floor(validCount / 4) : 0}</strong></li>
                                    <li>• Cada jugador juega con todos como compañero</li>
                                    <li>• Cada jugador se enfrenta a todos como rival</li>
                                </ul>
                            </div>

                            <button
                                onClick={startTournament}
                                disabled={!isValid}
                                className="w-full px-6 py-3 text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-semibold"
                                style={{ backgroundColor: isValid ? colors.primary : '#6c757d' }}
                            >
                                <Play className="w-5 h-5" />
                                Iniciar Torneo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (stage === 'playing') {
        const currentMatches = rounds[currentRound] || [];

        return (
            <div className="min-h-screen p-6" style={{ background: colors.background }}>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>
                            Ronda {currentRound + 1} de {rounds.length}
                        </h1>

                        {/* Timer Component */}
                        <div className="bg-white p-4 rounded-lg shadow-md mb-4 border-2 max-w-md mx-auto" style={{ borderColor: colors.secondary }}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.primary }}>
                                    <Clock style={{ color: colors.secondary }} />
                                    Timer
                                </h3>
                                <button
                                    onClick={() => setShowTimer(!showTimer)}
                                    className="text-sm px-2 py-1 rounded border transition-colors"
                                    style={{
                                        borderColor: colors.secondary,
                                        color: showTimer ? 'white' : colors.primary,
                                        backgroundColor: showTimer ? colors.secondary : 'transparent'
                                    }}
                                >
                                    {showTimer ? 'Ocultar' : 'Mostrar'}
                                </button>
                            </div>

                            {showTimer && (
                                <div className="space-y-3">
                                    <div
                                        className={`text-4xl font-mono font-bold transition-colors ${timerMinutes === 0 && timerSeconds <= 30 ? 'animate-pulse' : ''
                                            }`}
                                        style={{
                                            color: timerMinutes === 0 && timerSeconds <= 30 ? colors.accent : colors.primary
                                        }}
                                    >
                                        {formatTime(timerMinutes, timerSeconds)}
                                    </div>

                                    {timerFinished && (
                                        <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 mb-3">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-yellow-800 mb-2">
                                                    ⏰ ¡Tiempo Terminado!
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        console.log('Stopping beep...');
                                                        stopRepeatingBeep();
                                                    }}
                                                    className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold"
                                                >
                                                    Entendido ✓
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-center gap-2">
                                        {!isTimerRunning && !isTimerPaused && !timerFinished && (
                                            <button
                                                onClick={startTimer}
                                                className="px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                                                style={{ backgroundColor: colors.secondary }}
                                            >
                                                <Play className="w-4 h-4" />
                                                Iniciar
                                            </button>
                                        )}

                                        {isTimerRunning && (
                                            <button
                                                onClick={pauseTimer}
                                                className="px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                                                style={{ backgroundColor: colors.accent }}
                                            >
                                                <Pause className="w-4 h-4" />
                                                Pausar
                                            </button>
                                        )}

                                        {isTimerPaused && (
                                            <button
                                                onClick={resumeTimer}
                                                className="px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                                                style={{ backgroundColor: colors.secondary }}
                                            >
                                                <Play className="w-4 h-4" />
                                                Continuar
                                            </button>
                                        )}

                                        {(isTimerRunning || isTimerPaused) && (
                                            <button
                                                onClick={resetTimer}
                                                className="px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                                                style={{ backgroundColor: colors.primary }}
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Reiniciar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-4 mb-4">
                            <button
                                onClick={prevRound}
                                disabled={currentRound === 0}
                                className="px-4 py-2 text-white rounded-lg disabled:bg-gray-300 hover:opacity-90"
                                style={{ backgroundColor: currentRound === 0 ? '#6c757d' : colors.primary }}
                            >
                                ← Anterior
                            </button>
                            <button
                                onClick={nextRound}
                                disabled={currentRound === rounds.length - 1}
                                className="px-4 py-2 text-white rounded-lg disabled:bg-gray-300 hover:opacity-90"
                                style={{ backgroundColor: currentRound === rounds.length - 1 ? '#6c757d' : colors.primary }}
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-6 mb-8">
                        {currentMatches.map((match, matchIndex) => (
                            <div key={matchIndex} className="bg-white p-6 rounded-lg shadow-md border-2" style={{ borderColor: colors.secondary }}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold" style={{ color: colors.primary }}>Cancha {match.court}</h3>
                                    {match.finished && (
                                        <span className="px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: colors.secondary }}>
                                            Terminado
                                        </span>
                                    )}
                                </div>

                                {/* Cancha de Pádel Horizontal */}
                                <div className="relative rounded-lg p-6 mb-4 shadow-inner border-4 border-white" style={{ backgroundColor: colors.court }}>
                                    {/* Líneas de la cancha */}
                                    <div className="absolute inset-4 border-2 border-white/80 rounded"></div>
                                    <div className="absolute top-4 bottom-4 left-1/2 w-0.5 bg-white/80 transform -translate-x-1/2"></div>
                                    <div className="absolute top-1/2 left-1/2 w-12 h-0.5 bg-white/80 transform -translate-x-1/2 -translate-y-1/2"></div>

                                    <div className="grid grid-cols-2 gap-8 h-48">
                                        {/* Pareja Izquierda */}
                                        <div className="flex flex-col items-center justify-center relative z-10">
                                            <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg mb-4 shadow-lg border-2" style={{ borderColor: colors.primary }}>
                                                <div className="font-bold text-base text-center" style={{ color: colors.primary }}>
                                                    {match.team1.join(' & ')}
                                                </div>
                                            </div>
                                            <input
                                                type="number"
                                                value={match.score1}
                                                onChange={(e) => updateScore(matchIndex, 1, e.target.value)}
                                                placeholder="0"
                                                disabled={match.finished}
                                                className="w-20 h-16 text-center border-4 border-white rounded-xl text-3xl font-bold bg-white shadow-lg disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-4"
                                                style={{
                                                    color: colors.primary,
                                                }}
                                            />
                                        </div>

                                        {/* Pareja Derecha */}
                                        <div className="flex flex-col items-center justify-center relative z-10">
                                            <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg mb-4 shadow-lg border-2" style={{ borderColor: colors.primary }}>
                                                <div className="font-bold text-base text-center" style={{ color: colors.primary }}>
                                                    {match.team2.join(' & ')}
                                                </div>
                                            </div>
                                            <input
                                                type="number"
                                                value={match.score2}
                                                onChange={(e) => updateScore(matchIndex, 2, e.target.value)}
                                                placeholder="0"
                                                disabled={match.finished}
                                                className="w-20 h-16 text-center border-4 border-white rounded-xl text-3xl font-bold bg-white shadow-lg disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-4"
                                                style={{
                                                    color: colors.primary,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* VS en el centro */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                                        <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border-2" style={{ borderColor: colors.primary }}>
                                            <span className="font-bold text-sm" style={{ color: colors.primary }}>VS</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    {match.finished ? (
                                        <button
                                            onClick={() => reopenMatch(matchIndex)}
                                            className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-colors font-semibold"
                                            style={{ backgroundColor: colors.primary }}
                                        >
                                            Editar Marcador
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => finishMatch(matchIndex)}
                                            disabled={match.score1 === '' || match.score2 === ''}
                                            className="px-6 py-3 text-white rounded-lg hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
                                            style={{ backgroundColor: match.score1 === '' || match.score2 === '' ? '#6c757d' : colors.secondary }}
                                        >
                                            Terminar Partido
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {leaderboard.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-2" style={{ borderColor: colors.secondary }}>
                            <h2 className="text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2" style={{ color: colors.primary }}>
                                <Trophy style={{ color: colors.secondary }} />
                                Clasificación Actual
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2" style={{ borderColor: colors.secondary }}>
                                            <th className="text-left py-2" style={{ color: colors.primary }}>Pos</th>
                                            <th className="text-left py-2" style={{ color: colors.primary }}>Jugador</th>
                                            <th className="text-center py-2" style={{ color: colors.primary }}>Ganados</th>
                                            <th className="text-center py-2" style={{ color: colors.primary }}>Perdidos</th>
                                            <th className="text-center py-2" style={{ color: colors.primary }}>Diferencia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((player) => (
                                            <tr key={player.name} className="border-b">
                                                <td className="py-2 flex items-center gap-2">
                                                    {getRankIcon(player.rank)}
                                                </td>
                                                <td className="py-2 font-semibold" style={{ color: colors.primary }}>{player.name}</td>
                                                <td className="py-2 text-center font-semibold" style={{ color: colors.secondary }}>{player.wins}</td>
                                                <td className="py-2 text-center" style={{ color: colors.accent }}>{player.losses}</td>
                                                <td className="py-2 text-center font-semibold" style={{ color: player.pointDifference >= 0 ? colors.secondary : colors.accent }}>
                                                    {player.pointDifference > 0 ? '+' : ''}{player.pointDifference}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={finishTournament}
                            className="px-6 py-3 text-white rounded-lg hover:opacity-90"
                            style={{ backgroundColor: colors.accent }}
                        >
                            Finalizar Torneo
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (stage === 'finished') {
        const podium = {
            first: leaderboard.find(p => p.rank === 1),
            second: leaderboard.find(p => p.rank === 2),
            third: leaderboard.find(p => p.rank === 3),
        };

        return (
            <div className="min-h-screen p-6" style={{ background: colors.background }}>
                <div className="max-w-6xl mx-auto text-center">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3" style={{ color: colors.primary }}>
                            <Trophy className="w-10 h-10 text-yellow-400" />
                            ¡Torneo Finalizado!
                        </h1>
                        <p className="text-lg" style={{ color: colors.primary }}>Aquí están los resultados finales</p>
                    </div>

                    {/* Podium */}
                    <div className="flex justify-center items-end gap-4 mb-8">
                        {podium.second && (
                            <div className="text-center">
                                <Medal className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <h3 className="font-bold text-lg" style={{ color: colors.primary }}>{podium.second.name}</h3>
                                <p className="text-sm" style={{ color: colors.primary }}>{podium.second.wins} victorias</p>
                            </div>
                        )}

                        {podium.first && (
                            <div className="text-center">
                                <Crown className="w-10 h-10 mx-auto mb-2 text-yellow-400" />
                                <h3 className="font-bold text-xl" style={{ color: colors.primary }}>{podium.first.name}</h3>
                                <p className="text-sm font-semibold" style={{ color: colors.secondary }}>{podium.first.wins} victorias</p>
                            </div>
                        )}

                        {podium.third && (
                            <div className="text-center">
                                <Award className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                                <h3 className="font-bold text-lg" style={{ color: colors.primary }}>{podium.third.name}</h3>
                                <p className="text-sm" style={{ color: colors.primary }}>{podium.third.wins} victorias</p>
                            </div>
                        )}
                    </div>

                    {/* Tabla final */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-2" style={{ borderColor: colors.secondary }}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: colors.primary }}>Clasificación Final</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2" style={{ borderColor: colors.secondary }}>
                                        <th className="text-left py-3" style={{ color: colors.primary }}>Posición</th>
                                        <th className="text-left py-3" style={{ color: colors.primary }}>Jugador</th>
                                        <th className="text-center py-3" style={{ color: colors.primary }}>Ganados</th>
                                        <th className="text-center py-3" style={{ color: colors.primary }}>Perdidos</th>
                                        <th className="text-center py-3" style={{ color: colors.primary }}>Puntos +</th>
                                        <th className="text-center py-3" style={{ color: colors.primary }}>Puntos -</th>
                                        <th className="text-center py-3" style={{ color: colors.primary }}>Diferencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((player) => (
                                        <tr key={player.name} className={`border-b ${player.rank <= 3 ? 'bg-yellow-50' : ''}`}>
                                            <td className="py-3 flex items-center gap-2">
                                                {getRankIcon(player.rank)}
                                            </td>
                                            <td className="py-3 font-semibold" style={{ color: colors.primary }}>{player.name}</td>
                                            <td className="py-3 text-center font-semibold" style={{ color: colors.secondary }}>{player.wins}</td>
                                            <td className="py-3 text-center" style={{ color: colors.accent }}>{player.losses}</td>
                                            <td className="py-3 text-center" style={{ color: colors.primary }}>{player.pointsFor}</td>
                                            <td className="py-3 text-center" style={{ color: colors.primary }}>{player.pointsAgainst}</td>
                                            <td className="py-3 text-center font-semibold" style={{ color: player.pointDifference >= 0 ? colors.secondary : colors.accent }}>
                                                {player.pointDifference > 0 ? '+' : ''}{player.pointDifference}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <button
                        onClick={newTournament}
                        className="px-8 py-3 text-white rounded-lg hover:opacity-90 flex items-center gap-2 mx-auto"
                        style={{ backgroundColor: colors.primary }}
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Torneo
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default PadelAmericano;