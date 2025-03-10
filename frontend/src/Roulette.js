import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Roulette.css';
import Participant from "./Participant";
import { FaEye, FaEyeSlash, FaMagic, FaLock, FaUnlock, FaUndo, FaRedo } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList } from 'react-window';

function Roulette() {
    const [participants, setParticipants] = useState([]);
    const [searchParams] = useSearchParams();
    const uuid = searchParams.get('uuid');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFooterHidden, setIsFooterHidden] = useState(false);
    const [isListHidden, setIsListHidden] = useState(false);
    const [hideHidden, setHideHidden] = useState(false);
    const [useAnimations, setUseAnimations] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const happyEmojis = ['😀', '😃', '😄', '😁', '😆', '🙂', '😊'];

    const generateColor = (name) => {
        const seed = name.split('').reduce((acc, char, index) =>
            acc + char.charCodeAt(0) * (index + 1), 0
        );
        const hue = (seed * 137 + name.length * 23) % 360;
        const saturation = 70 + (seed % 30);
        const lightness = 50 + (seed % 20);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    useEffect(() => {
        if (!uuid) {
            setError('UUID не указан в URL');
            setLoading(false);
            return;
        }

        const fetchParticipants = async () => {
            try {
                const response = await axios.get(`https://api.garbazan.xyz/roulette?uuid=${uuid}`);
                const nameColorMap = new Map();

                if (response.data.vec.length >= 250) {
                    setUseAnimations(false);
                }

                const participantsData = response.data.vec.map((name, index) => {
                    if (!nameColorMap.has(name)) {
                        const color = generateColor(name);
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

    const toggleFooter = () => setIsFooterHidden(!isFooterHidden);
    const toggleList = () => setIsListHidden(!isListHidden);
    const toggleLock = () => setIsLocked(!isLocked);

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
            {/* Кнопки Undo и Redo при скрытой панели */}
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
                    {/* Undo и Redo внутри controls-panel */}
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
            <div
                className={`list-toggle-area ${isListHidden ? 'list-hidden' : ''}`}
                onClick={toggleList}
            >
                <div className={`list-toggle-bar ${isListHidden ? 'list-hidden' : ''}`} />
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