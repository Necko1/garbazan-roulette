import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Roulette.css';
import Participant from "./elements/Participant";
import Wheel from "./choosing/Wheel";
import Case from "./choosing/Case";
import {
    FaEye,
    FaEyeSlash,
    FaMagic,
    FaLock,
    FaUnlock,
    FaUndo,
    FaRedo,
    FaPlay,
    FaEye as FaEyeIcon,
    FaUserSlash,
    FaAdjust,
    FaExchangeAlt,
    FaRandom,
    FaGithub,
    FaPause,
    FaLink,
    FaCheck
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList } from 'react-window';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

function Roulette() {
    const defaultParams = {
        useAnimations: false,
        hideHidden: false,
        isLocked: false,
        hideNames: false,
        hideAfterSpin: false,
        maxSameNicknames: 1,
        isMonochrome: false,
        spinDuration: 5,
        displayMode: 'wheel',
        scrollSpeed: 720,
        baseItemsPerSecond: 20,
        autoScrollDelay: 3,
        stopAtRemaining: 1,
        useRandomValues: false,
        randomDurationRange: [2, 7.5],
        randomSpeedRange: [360, 1080],
    };

    const [searchParams] = useSearchParams();
    const uuid = searchParams.get('uuid');

    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFooterHidden, setIsFooterHidden] = useState(false);
    const [isListHidden, setIsListHidden] = useState(window.innerWidth < window.innerHeight);
    const [isRightPanelHidden, setIsRightPanelHidden] = useState(window.innerWidth < window.innerHeight);
    const [hideHidden, setHideHidden] = useState(searchParams.get('hideHidden') === 'true' ? true : defaultParams.hideHidden);
    const [useAnimations, setUseAnimations] = useState(searchParams.get('useAnimations') === 'true' ? true : defaultParams.useAnimations);
    const [isLocked, setIsLocked] = useState(searchParams.get('isLocked') === 'true' ? true : defaultParams.isLocked);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinTrigger, setSpinTrigger] = useState(0);
    const [hideNames, setHideNames] = useState(searchParams.get('hideNames') === 'true' ? true : defaultParams.hideNames);
    const [hideAfterSpin, setHideAfterSpin] = useState(searchParams.get('hideAfterSpin') === 'true' ? true : defaultParams.hideAfterSpin);
    const [lastSelectedParticipant, setLastSelectedParticipant] = useState(null);
    const [isMonochrome, setIsMonochrome] = useState(searchParams.get('isMonochrome') === 'true' ? true : defaultParams.isMonochrome);
    const [spinDuration, setSpinDuration] = useState(() => {
        const param = searchParams.get('spinDuration');
        return param !== null ? parseFloat(param) : defaultParams.spinDuration;
    });
    const [displayMode, setDisplayMode] = useState(searchParams.get('displayMode') || defaultParams.displayMode);
    const [scrollSpeed, setScrollSpeed] = useState(parseInt(searchParams.get('scrollSpeed')) || defaultParams.scrollSpeed);
    const [baseItemsPerSecond, setBaseItemsPerSecond] = useState(parseInt(searchParams.get('baseItemsPerSecond')) || defaultParams.baseItemsPerSecond);
    const [maxSameNicknames, setMaxSameNicknames] = useState(parseInt(searchParams.get('maxSameNicknames')) || defaultParams.maxSameNicknames);

    const [isAutoScrollActive, setIsAutoScrollActive] = useState(false);
    const [autoScrollDelay, setAutoScrollDelay] = useState(parseFloat(searchParams.get('autoScrollDelay')) || defaultParams.autoScrollDelay);
    const [stopAtRemaining, setStopAtRemaining] = useState(parseInt(searchParams.get('stopAtRemaining')) || defaultParams.stopAtRemaining);
    const autoScrollTimeoutRef = useRef(null);

    const [useRandomValues, setUseRandomValues] = useState(searchParams.get('useRandomValues') === 'true' ? true : defaultParams.useRandomValues);
    const [randomDurationRange, setRandomDurationRange] = useState(
        searchParams.get('randomDurationRange')
            ? JSON.parse(searchParams.get('randomDurationRange'))
            : defaultParams.randomDurationRange
    );
    const [randomSpeedRange, setRandomSpeedRange] = useState(
        searchParams.get('randomSpeedRange')
            ? JSON.parse(searchParams.get('randomSpeedRange'))
            : (displayMode === 'wheel' ? [360, 1080] : [10, 50])
    );

    const [isLinkCopied, setIsLinkCopied] = useState(false);

    const happyEmojis = ['😀', '😃', '😄', '😁', '😆', '🙂', '😊'];

    const getMaxDuplicates = (participantsList) => {
        const nameCount = {};
        participantsList.forEach(p => {
            nameCount[p.name] = (nameCount[p.name] || 0) + 1;
        });
        return Math.max(...Object.values(nameCount), 1);
    };

    const shuffleParticipants = () => {
        if (isLocked) return;
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        setParticipants(shuffled);
        const historyParticipants = shuffled.map(({ color, ...rest }) => rest);
        const newHistory = [...history.slice(0, historyIndex + 1), historyParticipants];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const getLimitedParticipants = (participantsList) => {
        const nameCount = {};
        return participantsList.filter(participant => {
            nameCount[participant.name] = (nameCount[participant.name] || 0) + 1;
            return nameCount[participant.name] <= maxSameNicknames;
        });
    };

    const maxDuplicates = getMaxDuplicates(participants);
    const visibleParticipants = useMemo(() => {
        const limitedParticipants = getLimitedParticipants(participants);
        return hideHidden
            ? limitedParticipants.filter(p => !p.isHidden)
            : limitedParticipants;
    }, [participants, hideHidden, maxSameNicknames]);
    const visibleCount = visibleParticipants.filter(p => !p.isHidden).length;

    const handleScrollSpeedChange = (e) => {
        const value = parseInt(e.target.value);
        if (displayMode === 'wheel') {
            setScrollSpeed(value);
        } else {
            setBaseItemsPerSecond(value);
        }
    };

    const generateColor = (name, monochrome = false) => {
        const seed = name.split('').reduce((acc, char, index) =>
            acc + char.charCodeAt(0) * (index + 1), 0
        );
        if (monochrome) {
            const lightness = 30 + (seed % 50);
            return `hsl(0, 0%, ${lightness}%)`;
        } else {
            const hue = (seed * 137 + name.length * 23) % 360;
            const saturation = 70 + (seed % 30);
            const lightness = 50 + (seed % 20);
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }
    };

    useEffect(() => {
        if (!uuid) {
            setError('UUID не указан в URL');
            setLoading(false);
            return;
        }

        const fetchParticipants = async () => {
            try {
                const response = await axios.get(`https://api.necko.space/roulette?uuid=${uuid}`);
                if (response.data.vec.length <= 250) {
                    setUseAnimations(true);
                }
                const participantsData = response.data.vec.map((name, index) => ({
                    id: index + 1,
                    name,
                    isHidden: false,
                    emoji: happyEmojis[Math.floor(Math.random() * happyEmojis.length)]
                }));
                const participantsWithColors = participantsData.map(participant => ({
                    ...participant,
                    color: generateColor(participant.name, isMonochrome)
                }));
                setParticipants(participantsWithColors);
                setHistory([participantsData]);
                setHistoryIndex(0);
            } catch (err) {
                setError('Ошибка при загрузке участников');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchParticipants();
    }, [uuid]);

    useEffect(() => {
        setParticipants(prevParticipants =>
            prevParticipants.map(participant => ({
                ...participant,
                color: generateColor(participant.name, isMonochrome)
            }))
        );
    }, [isMonochrome]);

    const toggleParticipant = (id) => {
        if (isLocked) return;
        const newParticipants = participants.map(participant =>
            participant.id === id ? { ...participant, isHidden: !participant.isHidden } : participant
        );
        setParticipants(newParticipants);
        const historyParticipants = newParticipants.map(({ color, ...rest }) => rest);
        const newHistory = [...history.slice(0, historyIndex + 1), historyParticipants];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const applyColors = (participantsList) => {
        return participantsList.map(participant => ({
            ...participant,
            color: generateColor(participant.name, isMonochrome)
        }));
    };

    const undo = () => {
        if (isLocked || historyIndex <= 0) return;
        setHistoryIndex(historyIndex - 1);
        const restoredParticipants = applyColors(history[historyIndex - 1]);
        setParticipants(restoredParticipants);
    };

    const redo = () => {
        if (isLocked || historyIndex >= history.length - 1) return;
        setHistoryIndex(historyIndex + 1);
        const restoredParticipants = applyColors(history[historyIndex + 1]);
        setParticipants(restoredParticipants);
    };

    const startSpin = useCallback(() => {
        if (isSpinning) return;
        setIsSpinning(true);
        if (useRandomValues) {
            const [minDuration, maxDuration] = randomDurationRange;
            const [minSpeed, maxSpeed] = randomSpeedRange;
            // Рандомное время с шагом 0.5
            const steps = (maxDuration - minDuration) / 0.5;
            const randomStep = Math.floor(Math.random() * (steps + 1));
            const newDuration = minDuration + (randomStep * 0.5);
            setSpinDuration(newDuration);

            if (displayMode === 'wheel') {
                const newSpeed = Math.floor(minSpeed + Math.random() * (maxSpeed - minSpeed + 1));
                setScrollSpeed(newSpeed);
            } else {
                const newItemsPerSecond = Math.floor(minSpeed + Math.random() * (maxSpeed - minSpeed + 1));
                setBaseItemsPerSecond(newItemsPerSecond);
            }
        }
        setSpinTrigger(prev => prev + 1);
    }, [isSpinning, useRandomValues, randomDurationRange, randomSpeedRange, displayMode]);

    const handleSpinEnd = useCallback((selectedParticipant) => {
        setIsSpinning(false);
        setLastSelectedParticipant(selectedParticipant);
        if (hideAfterSpin && selectedParticipant) {
            const newParticipants = participants.map(p =>
                p.id === selectedParticipant.id ? { ...p, isHidden: true } : p
            );
            setParticipants(newParticipants);
            const historyParticipants = newParticipants.map(({ color, ...rest }) => rest);
            const newHistory = [...history.slice(0, historyIndex + 1), historyParticipants];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    }, [hideAfterSpin, participants, history, historyIndex]);

    useEffect(() => {
        if (!isAutoScrollActive) {
            clearTimeout(autoScrollTimeoutRef.current);
            return;
        }

        if (!isSpinning && visibleCount > stopAtRemaining) {
            autoScrollTimeoutRef.current = setTimeout(() => {
                startSpin();
            }, autoScrollDelay * 1000);
        } else if (visibleCount <= stopAtRemaining) {
            setIsAutoScrollActive(false);
            clearTimeout(autoScrollTimeoutRef.current);
        }

        return () => clearTimeout(autoScrollTimeoutRef.current);
    }, [isAutoScrollActive, isSpinning, visibleCount, stopAtRemaining, autoScrollDelay, startSpin]);

    const toggleFooter = () => setIsFooterHidden(!isFooterHidden);
    const toggleList = () => setIsListHidden(!isListHidden);
    const toggleRightPanel = () => setIsRightPanelHidden(!isRightPanelHidden);
    const toggleLock = () => setIsLocked(!isLocked);
    const toggleHideNames = () => setHideNames(!hideNames);
    const toggleHideAfterSpin = () => setHideAfterSpin(!hideAfterSpin);
    const toggleMonochrome = () => {
        setIsMonochrome(prev => !prev);
    };
    const toggleDisplayMode = () => {
        const newMode = displayMode === 'wheel' ? 'case' : 'wheel';
        setDisplayMode(newMode);
        setIsSpinning(false);
        setSpinTrigger(0);
        setRandomSpeedRange(newMode === 'wheel' ? [360, 1080] : [10, 50]);
    };

    const handleSpinDurationChange = (e) => {
        setSpinDuration(parseFloat(e.target.value));
    };

    const toggleAutoScroll = () => {
        setIsAutoScrollActive(prev => !prev);
    };

    const handleAutoScrollDelayChange = (value) => {
        setAutoScrollDelay(value);
    };

    const handleStopAtRemainingChange = (e) => {
        const value = Math.max(1, parseInt(e.target.value) || 1);
        setStopAtRemaining(value);
    };

    const toggleRandomValues = () => {
        setUseRandomValues(!useRandomValues);
    };

    const copyLink = () => {
        const currentParams = {
            useAnimations,
            hideHidden,
            isLocked,
            hideNames,
            hideAfterSpin,
            maxSameNicknames,
            isMonochrome,
            spinDuration,
            displayMode,
            scrollSpeed,
            baseItemsPerSecond,
            autoScrollDelay,
            stopAtRemaining,
            useRandomValues,
            randomDurationRange,
            randomSpeedRange,
        };

        const changedParams = {};
        Object.keys(currentParams).forEach(key => {
            if (key === 'randomDurationRange' || key === 'randomSpeedRange') {
                if (JSON.stringify(currentParams[key]) !== JSON.stringify(defaultParams[key])) {
                    changedParams[key] = JSON.stringify(currentParams[key]);
                }
            } else if (currentParams[key] !== defaultParams[key]) {
                changedParams[key] = currentParams[key];
            }
        });

        const url = new URL(window.location.href);
        url.search = '';
        url.searchParams.set('uuid', uuid);
        Object.keys(changedParams).forEach(key => {
            url.searchParams.set(key, changedParams[key]);
        });

        navigator.clipboard.writeText(url.toString()).then(() => {
            setIsLinkCopied(true);
            setTimeout(() => setIsLinkCopied(false), 1000);
        });
    };

    const Row = ({ index, style }) => {
        const participant = visibleParticipants[index];
        return (
            <div style={style}>
                <Participant
                    name={participant.name}
                    isHidden={participant.isHidden}
                    onToggle={() => toggleParticipant(participant.id)}
                    color={participant.color}
                    useAnimations={useAnimations}
                    fixedEmoji={participant.emoji}
                />
            </div>
        );
    };

    if (loading) return <div className="participants-list">Загрузка...</div>;
    if (error) return <div className="participants-list error">{error}</div>;

    return (
        <div className="roulette-app">
            {displayMode === 'wheel' ? (
                <Wheel
                    participants={visibleParticipants}
                    hideNames={hideNames}
                    spinTrigger={spinTrigger}
                    onSpinEnd={handleSpinEnd}
                    lastSelectedParticipant={lastSelectedParticipant}
                    spinDuration={spinDuration}
                    angularSpeed={scrollSpeed}
                />
            ) : (
                <Case
                    participants={visibleParticipants}
                    hideNames={hideNames}
                    spinTrigger={spinTrigger}
                    onSpinEnd={handleSpinEnd}
                    lastSelectedParticipant={lastSelectedParticipant}
                    spinDuration={spinDuration}
                    hideAfterSpin={hideAfterSpin}
                    baseItemsPerSecond={baseItemsPerSecond}
                />
            )}

            {isListHidden && (
                <div className="history-controls">
                    <div className="switch-container">
                        <button
                            className={`switch-button undo ${isLocked || historyIndex <= 0 ? 'disabled' : ''}`}
                            onClick={undo}
                            disabled={isLocked || historyIndex <= 0}
                            title="Отменить действие"
                        >
                            <FaUndo />
                        </button>
                    </div>
                    <div className="switch-container">
                        <button
                            className={`switch-button redo ${isLocked || historyIndex >= history.length - 1 ? 'disabled' : ''}`}
                            onClick={redo}
                            disabled={isLocked || historyIndex >= history.length - 1}
                            title="Повторить действие"
                        >
                            <FaRedo />
                        </button>
                    </div>
                </div>
            )}

            <div className={`participants-list ${isListHidden ? 'list-hidden' : ''}`}>
                <div className="controls-panel">
                    <div className="switch-container">
                        <button
                            className={`switch-button toggle-lock ${isLocked ? 'active' : ''}`}
                            onClick={toggleLock}
                            title={isLocked ? 'Разблокировать взаимодействие' : 'Заблокировать взаимодействие'}
                        >
                            {isLocked ? <FaLock /> : <FaUnlock />}
                        </button>
                    </div>
                    {!isListHidden && (
                        <>
                            <div className="switch-container">
                                <button
                                    className={`switch-button undo ${isLocked || historyIndex <= 0 ? 'disabled' : ''}`}
                                    onClick={undo}
                                    disabled={isLocked || historyIndex <= 0}
                                    title="Отменить действие"
                                >
                                    <FaUndo />
                                </button>
                            </div>
                            <div className="switch-container">
                                <button
                                    className={`switch-button redo ${isLocked || historyIndex >= history.length - 1 ? 'disabled' : ''}`}
                                    onClick={redo}
                                    disabled={isLocked || historyIndex >= history.length - 1}
                                    title="Повторить действие"
                                >
                                    <FaRedo />
                                </button>
                            </div>
                        </>
                    )}
                    <div className="switch-container">
                        <button
                            className={`switch-button toggle-visibility ${hideHidden ? 'active' : ''}`}
                            onClick={() => setHideHidden(!hideHidden)}
                            title={hideHidden ? 'Показать выбывших' : 'Скрыть выбывших'}
                        >
                            {hideHidden ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    <div className="switch-container">
                        <button
                            className={`switch-button toggle-animations ${useAnimations ? 'active' : ''}`}
                            onClick={() => setUseAnimations(!useAnimations)}
                            title={useAnimations ? 'Включить оптимизацию' : 'Включить КРАСОТУ'}
                        >
                            <FaMagic />
                        </button>
                    </div>
                </div>

                <div className="participants-content">
                    <div className={`participants-container ${useAnimations ? 'animated' : 'optimized'}`}>
                        {useAnimations ? (
                            <AnimatePresence>
                                {visibleParticipants.map(participant => (
                                    <motion.div
                                        key={participant.id}
                                        layout
                                        initial={{ x: -100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -100, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <Participant
                                            name={participant.name}
                                            isHidden={participant.isHidden}
                                            onToggle={() => toggleParticipant(participant.id)}
                                            color={participant.color}
                                            useAnimations={useAnimations}
                                            fixedEmoji={participant.emoji}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <FixedSizeList
                                height={window.innerHeight - 170}
                                width={297}
                                itemCount={visibleParticipants.length}
                                itemSize={57}
                                className="react-window-list"
                            >
                                {Row}
                            </FixedSizeList>
                        )}
                    </div>

                    <div className="shuffle-controls">
                        <button
                            className={`switch-button shuffle-button ${isLocked ? 'disabled' : ''}`}
                            onClick={shuffleParticipants}
                            disabled={isLocked}
                            title="Перемешать участников"
                        >
                            <FaRandom />
                        </button>
                        <div className="max-same-nicknames-control">
                            <label htmlFor="max-same-nicknames" className="max-same-nicknames-label">
                                Макс. одинаковых: {maxSameNicknames === maxDuplicates ? '∞' : maxSameNicknames}
                            </label>
                            <input
                                type="range"
                                id="max-same-nicknames"
                                min="1"
                                max={maxDuplicates}
                                step="1"
                                value={maxSameNicknames}
                                onChange={(e) => setMaxSameNicknames(parseInt(e.target.value))}
                                className="max-same-nicknames-slider"
                                disabled={isLocked}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className={`right-panel ${isRightPanelHidden ? 'panel-hidden' : ''}`}>
                <div className="right-panel-container">
                    <div className="right-panel-controls">
                        <button
                            className={`spin-button ${isSpinning ? 'spinning' : ''}`}
                            onClick={startSpin}
                            disabled={isSpinning}
                            title="Крутить колесо"
                        >
                            <FaPlay /> Крутить
                        </button>
                        <button
                            className={`switch-button toggle-hide-after-spin ${hideAfterSpin ? 'active' : ''}`}
                            onClick={toggleHideAfterSpin}
                            title={hideAfterSpin ? 'Отключить скрытие после вращения' : 'Скрывать выпавших после вращения'}
                        >
                            <FaUserSlash />
                        </button>
                        <button
                            className={`switch-button toggle-names ${hideNames ? 'active' : ''}`}
                            onClick={toggleHideNames}
                            title={hideNames ? 'Показать никнеймы' : 'Скрыть никнеймы'}
                        >
                            {hideNames ? <FaEyeSlash /> : <FaEyeIcon />}
                        </button>
                        <button
                            className={`switch-button toggle-monochrome ${isMonochrome ? 'active' : ''}`}
                            onClick={toggleMonochrome}
                            title={isMonochrome ? 'Выключить монохромный режим' : 'Включить монохромный режим'}
                        >
                            <FaAdjust />
                        </button>
                    </div>
                    <div className="spin-duration-control">
                        <label htmlFor="spin-duration" className="spin-duration-label">
                            {displayMode === 'wheel'
                                ? `Время вращения: `
                                : `Время прокрутки: `}
                            {spinDuration === 0 ? 'Мгновенно' : `${spinDuration} сек`}
                        </label>
                        <input
                            type="range"
                            id="spin-duration"
                            min="0"
                            max="60"
                            step="0.5"
                            value={spinDuration}
                            onChange={handleSpinDurationChange}
                            className="spin-duration-slider"
                            disabled={useRandomValues}
                        />
                    </div>
                    <div className="scroll-speed-control">
                        <label htmlFor="scroll-speed" className="scroll-speed-label">
                            {displayMode === 'wheel'
                                ? `Скорость вращения: ${scrollSpeed}°/с`
                                : `Длина прокрутки: ${baseItemsPerSecond} эл/с`}
                        </label>
                        <input
                            type="range"
                            id="scroll-speed"
                            min={displayMode === 'wheel' ? "180" : "2"}
                            max={displayMode === 'wheel' ? "1440" : "100"}
                            step={displayMode === 'wheel' ? "10" : "1"}
                            value={displayMode === 'wheel' ? scrollSpeed : baseItemsPerSecond}
                            onChange={handleScrollSpeedChange}
                            className="scroll-speed-slider"
                            disabled={useRandomValues}
                        />
                    </div>
                    <hr className="panel-divider" />

                    <div className="auto-scroll-control">
                        <button
                            className={`auto-scroll-button ${isAutoScrollActive ? 'active' : ''}`}
                            onClick={toggleAutoScroll}
                            title={isAutoScrollActive ? 'Остановить автопрокрутку' : 'Запустить автопрокрутку'}
                        >
                            {isAutoScrollActive ? <FaPause /> : <FaPlay />}
                            {isAutoScrollActive ? ' Стоп' : ' Авто'}
                        </button>
                        <div className="auto-scroll-options">
                            <label className="auto-scroll-label">
                                Задержка: {autoScrollDelay} сек
                            </label>
                            <Slider
                                min={0}
                                max={10}
                                step={0.25}
                                value={autoScrollDelay}
                                onChange={handleAutoScrollDelayChange}
                                trackStyle={{ backgroundColor: '#5a6b7f' }}
                                handleStyle={{ borderColor: '#6a7b8f', backgroundColor: '#4a5a6f' }}
                                railStyle={{ backgroundColor: '#3a3a3a' }}
                            />
                            <label className="auto-scroll-label">
                                Остановиться при: {stopAtRemaining}
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={visibleCount}
                                value={stopAtRemaining}
                                onChange={handleStopAtRemainingChange}
                                className="stop-at-input"
                            />
                        </div>
                    </div>
                    <hr className="panel-divider" />

                    <div className="random-values-control">
                        <button
                            className={`random-values-button ${useRandomValues ? 'active' : ''}`}
                            onClick={toggleRandomValues}
                            title={useRandomValues ? 'Отключить рандомные значения' : 'Включить рандомные значения'}
                        >
                            <FaRandom /> Использовать рандом
                        </button>
                        <div className="random-values-options">
                            <label className="random-values-label">
                                Длительность: {randomDurationRange[0]} - {randomDurationRange[1]} сек
                            </label>
                            <Slider
                                range
                                min={0}
                                max={60}
                                step={0.5}
                                value={randomDurationRange}
                                onChange={setRandomDurationRange}
                                trackStyle={{ backgroundColor: '#5a6b7f' }}
                                handleStyle={{ borderColor: '#6a7b8f', backgroundColor: '#4a5a6f' }}
                                railStyle={{ backgroundColor: '#3a3a3a' }}
                            />
                            <label className="random-values-label">
                                {displayMode === 'wheel'
                                    ? `Скорость: ${randomSpeedRange[0]} - ${randomSpeedRange[1]}°/с`
                                    : `Длина: ${randomSpeedRange[0]} - ${randomSpeedRange[1]} эл/с`}
                            </label>
                            <Slider
                                range
                                min={displayMode === 'wheel' ? 180 : 2}
                                max={displayMode === 'wheel' ? 1440 : 100}
                                step={displayMode === 'wheel' ? 10 : 1}
                                value={randomSpeedRange}
                                onChange={setRandomSpeedRange}
                                trackStyle={{ backgroundColor: '#5a6b7f' }}
                                handleStyle={{ borderColor: '#6a7b8f', backgroundColor: '#4a5a6f' }}
                                railStyle={{ backgroundColor: '#3a3a3a' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {isRightPanelHidden && (
                <button
                    className="spin-button-top-right"
                    onClick={startSpin}
                    disabled={isSpinning}
                    title="Крутить колесо"
                >
                    <FaPlay />
                    {window.innerWidth < window.innerHeight && ' Крутить'}
                </button>
            )}

            <div
                className={`list-toggle-area ${isListHidden ? 'list-hidden' : ''}`}
                onClick={toggleList}
            >
                <div className={`list-toggle-bar ${isListHidden ? 'list-hidden' : ''}`} />
            </div>

            <div
                className={`right-toggle-area ${isRightPanelHidden ? 'panel-hidden' : ''}`}
                onClick={toggleRightPanel}
            >
                <div className={`right-toggle-bar ${isRightPanelHidden ? 'panel-hidden' : ''}`} />
            </div>

            <div
                className={`visible-count-footer ${isFooterHidden ? 'footer-hidden' : ''}`}
                onClick={toggleFooter}
            >
                <span>Видимых участников: {visibleCount} из {participants.length}</span>
            </div>
            <div
                className={`footer-toggle-area ${isFooterHidden ? 'footer-hidden' : ''}`}
                onClick={toggleFooter}
            >
                <div
                    className={`footer-toggle-bar ${isFooterHidden ? 'footer-hidden' : ''}`}
                    style={{ display: isFooterHidden ? 'block' : 'none' }}
                />
            </div>

            <button
                className="copy-link-button"
                onClick={copyLink}
                title="Скопировать ссылку с параметрами"
            >
                {isLinkCopied ? <FaCheck /> : <FaLink />}
            </button>

            <button
                className="switch-display-mode"
                onClick={toggleDisplayMode}
                title={displayMode === 'wheel' ? 'Переключить на Case' : 'Переключить на Wheel'}
            >
                <FaExchangeAlt />
            </button>

            <a
                href="https://github.com/Necko1/garbazan-roulette"
                target="_blank"
                rel="noopener noreferrer"
                className={`github-link ${isListHidden ? 'list-hidden' : ''}`}
                title="View on GitHub"
            >
                <FaGithub />
            </a>
        </div>
    );
}

export default Roulette;