import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Roulette.css';
import Participant from "./Participant";
import Wheel from "./Wheel";
import { FaEye, FaEyeSlash, FaMagic, FaLock, FaUnlock, FaUndo, FaRedo, FaPlay, FaEye as FaEyeIcon, FaUserSlash, FaAdjust } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList } from 'react-window';

function Roulette() {
    const [participants, setParticipants] = useState([]);
    const [searchParams] = useSearchParams();
    const uuid = searchParams.get('uuid');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFooterHidden, setIsFooterHidden] = useState(false);
    const [isListHidden, setIsListHidden] = useState(window.innerWidth < window.innerHeight);
    const [isRightPanelHidden, setIsRightPanelHidden] = useState(window.innerWidth < window.innerHeight);
    const [hideHidden, setHideHidden] = useState(false);
    const [useAnimations, setUseAnimations] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinTrigger, setSpinTrigger] = useState(0);
    const [hideNames, setHideNames] = useState(false);
    const [hideAfterSpin, setHideAfterSpin] = useState(false);
    const [lastSelectedParticipant, setLastSelectedParticipant] = useState(null);
    const [isMonochrome, setIsMonochrome] = useState(false);
    const [spinDuration, setSpinDuration] = useState(5);

    const happyEmojis = ['😀', '😃', '😄', '😁', '😆', '🙂', '😊'];

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
                const nameColorMap = new Map();

                if (response.data.vec.length >= 250) {
                    setUseAnimations(false);
                }

                const participantsData = response.data.vec.map((name, index) => {
                    if (!nameColorMap.has(name)) {
                        const color = generateColor(name, isMonochrome);
                        nameColorMap.set(name, color);
                    }

                    return {
                        id: index + 1,
                        name,
                        isHidden: false,
                        color: nameColorMap.get(name),
                        emoji: happyEmojis[Math.floor(Math.random() * happyEmojis.length)]
                    };
                });
                setParticipants(participantsData);
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
        const updatedParticipants = participants.map(participant => ({
            ...participant,
            color: generateColor(participant.name, isMonochrome)
        }));
        setParticipants(updatedParticipants);
    }, [isMonochrome]);

    const toggleParticipant = (id) => {
        if (isLocked) return;

        const newParticipants = participants.map(participant =>
            participant.id === id
                ? { ...participant, isHidden: !participant.isHidden }
                : participant
        );
        setParticipants(newParticipants);

        const newHistory = [...history.slice(0, historyIndex + 1), newParticipants];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (isLocked || historyIndex <= 0) return;
        setHistoryIndex(historyIndex - 1);
        setParticipants(history[historyIndex - 1]);
    };

    const redo = () => {
        if (isLocked || historyIndex >= history.length - 1) return;
        setHistoryIndex(historyIndex + 1);
        setParticipants(history[historyIndex + 1]);
    };

    const startSpin = useCallback(() => {
        if (isSpinning) return;
        console.log("Кнопка 'Крутить' нажата, запускаем вращение в Roulette");
        setIsSpinning(true);
        setSpinTrigger(prev => prev + 1);
    }, [isSpinning]);

    const handleSpinEnd = useCallback((selectedParticipant) => {
        console.log("Вращение завершено в Roulette");
        setIsSpinning(false);
        setLastSelectedParticipant(selectedParticipant);
        if (hideAfterSpin && selectedParticipant) {
            const newParticipants = participants.map(p =>
                p.id === selectedParticipant.id ? { ...p, isHidden: true } : p
            );
            setParticipants(newParticipants);
            const newHistory = [...history.slice(0, historyIndex + 1), newParticipants];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    }, [hideAfterSpin, participants, history, historyIndex]);

    const toggleFooter = () => setIsFooterHidden(!isFooterHidden);
    const toggleList = () => setIsListHidden(!isListHidden);
    const toggleRightPanel = () => setIsRightPanelHidden(!isRightPanelHidden);
    const toggleLock = () => setIsLocked(!isLocked);
    const toggleHideNames = () => setHideNames(!hideNames);
    const toggleHideAfterSpin = () => setHideAfterSpin(!hideAfterSpin);
    const toggleMonochrome = () => setIsMonochrome(!isMonochrome);

    const handleSpinDurationChange = (e) => {
        setSpinDuration(parseFloat(e.target.value));
    };

    const visibleParticipants = hideHidden ? participants.filter(p => !p.isHidden) : participants;
    const visibleCount = participants.filter(p => !p.isHidden).length;

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
            <Wheel
                participants={participants}
                hideHidden={hideHidden}
                hideNames={hideNames}
                spinTrigger={spinTrigger}
                isSpinning={isSpinning}
                onSpinEnd={handleSpinEnd}
                lastSelectedParticipant={lastSelectedParticipant}
                useAnimations={useAnimations}
                spinDuration={spinDuration}
            />

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
                            title={useAnimations ? 'Включить оптимизацию' : 'Включить КРАСОТУ (при большом списке будут просадки)'}
                        >
                            <FaMagic />
                        </button>
                    </div>
                </div>

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
                            height={window.innerHeight - 100}
                            width={297}
                            itemCount={visibleParticipants.length}
                            itemSize={57}
                            className="react-window-list"
                        >
                            {Row}
                        </FixedSizeList>
                    )}
                </div>
            </div>

            <div className={`right-panel ${isRightPanelHidden ? 'panel-hidden' : ''}`}>
                <div className="right-panel-container">
                    <div className="right-panel-controls">
                        <div className="left-controls-group">
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
                        </div>
                        <div className="right-controls-group">
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
                    </div>
                    <div className="spin-duration-control">
                        <label htmlFor="spin-duration" className="spin-duration-label">
                            Время вращения: {spinDuration === 0 ? 'Мгновенно' : `${spinDuration} сек`}
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
                        />
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
        </div>
    );
}

export default Roulette;