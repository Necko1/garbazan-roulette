import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import './Case.css';
import SelectedParticipant from "../elements/SelectedParticipant";

const Case = ({
                  participants,
                  hideNames,
                  spinTrigger,
                  onSpinEnd,
                  hideAfterSpin,
                  lastSelectedParticipant,
                  spinDuration,
                  baseItemsPerSecond
              }) => {
    const [localIsSpinning, setLocalIsSpinning] = useState(false);
    const [lastSpinTrigger, setLastSpinTrigger] = useState(0);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [tapeItems, setTapeItems] = useState([]);
    const [currentCenterIndex, setCurrentCenterIndex] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const controls = useAnimation();
    const tapeRef = useRef(null);
    const animationFrameRef = useRef(null);

    const activeParticipants = participants.filter(p => !p.isHidden);

    const createInitialTapeItems = () => {
        if (activeParticipants.length === 0) return [];
        const shuffledParticipants = [...activeParticipants].sort(() => Math.random() - 0.5);
        const multipliedParticipants = [];
        const repeatCount = Math.ceil(200 / activeParticipants.length) + 1;
        for (let i = 0; i < repeatCount; i++) {
            multipliedParticipants.push(...shuffledParticipants);
        }
        return multipliedParticipants;
    };

    const createSpinTapeItems = (scrollLength) => {
        if (activeParticipants.length === 0) return [];
        const result = [];
        const buffer = 10;
        const totalItems = scrollLength + buffer;

        for (let i = 0; i < totalItems; i++) {
            const randomIndex = Math.floor(Math.random() * activeParticipants.length);
            result.push(activeParticipants[randomIndex]);
        }
        return result;
    };

    useEffect(() => {
        setTapeItems(createInitialTapeItems());
        // Очистка состояний при отсутствии участников
        if (activeParticipants.length === 0) {
            setLocalIsSpinning(false);
            setSelectedParticipant(null);
            setCurrentCenterIndex(null);
            controls.stop();
        }
    }, [participants]);

    const getScrollLength = () => {
        const durationBasedLength = Math.floor(spinDuration * baseItemsPerSecond);
        const randomFactor = Math.random() * 0.5 + 0.75;
        return Math.max(10, Math.floor(durationBasedLength * randomFactor));
    };

    const updateCenterIndex = () => {
        if (!tapeRef.current || activeParticipants.length === 0) return;

        const tapeElement = tapeRef.current;
        const wrapperRect = tapeElement.parentElement.getBoundingClientRect();
        const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;

        let closestIndex = null;
        let minDistance = Infinity;

        Array.from(tapeElement.children).forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            const distance = Math.abs(wrapperCenter - itemCenter);

            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        setCurrentCenterIndex(closestIndex);
        setSelectedParticipant(tapeItems[closestIndex]);
    };

    useEffect(() => {
        if (localIsSpinning && activeParticipants.length > 0) {
            const animate = () => {
                updateCenterIndex();
                animationFrameRef.current = requestAnimationFrame(animate);
            };
            animationFrameRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [localIsSpinning, activeParticipants.length]);

    useEffect(() => {
        if (
            spinTrigger > lastSpinTrigger &&
            !localIsSpinning &&
            activeParticipants.length > 0
        ) {
            setLastSpinTrigger(spinTrigger);
            setLocalIsSpinning(true);
            controls.set({ x: 0 });

            const scrollLength = getScrollLength();
            const fixedTapeItems = createSpinTapeItems(scrollLength);
            setTapeItems(fixedTapeItems);

            const itemWidth = 225;
            const gap = 21;
            const itemTotalWidth = itemWidth + gap;

            const selectedItemPosition = scrollLength * itemTotalWidth;
            const tapeWrapperWidth = tapeRef.current?.parentElement.offsetWidth || window.innerWidth;
            const centerOffset = tapeWrapperWidth / 2 - itemWidth / 2;

            const randomItemLocation = (Math.random() * itemWidth) - (itemWidth / 2);
            const totalDistance = -(selectedItemPosition - centerOffset + randomItemLocation);

            const onAnimationComplete = () => {
                const finalParticipant = fixedTapeItems[scrollLength];
                setSelectedParticipant(finalParticipant);
                setLocalIsSpinning(false);
                setCurrentCenterIndex(scrollLength);

                if (onSpinEnd) onSpinEnd(finalParticipant);
            };

            if (spinDuration === 0) {
                controls.start({
                    x: totalDistance,
                    transition: { duration: 0 },
                }).then(() => {
                    onAnimationComplete();
                    if (hideAfterSpin) {
                        controls.set({ x: 0 });
                    }
                });
            } else {
                controls.start({
                    x: totalDistance,
                    transition: {
                        duration: spinDuration,
                        ease: [0.1, 1, 0.1, 1],
                    },
                }).then(() => {
                    onAnimationComplete();
                    if (hideAfterSpin) {
                        controls.set({ x: 0 });
                    }
                });
            }
        }
    }, [spinTrigger, lastSpinTrigger, spinDuration, controls, onSpinEnd, participants]);

    const displayParticipant = localIsSpinning ? selectedParticipant : lastSelectedParticipant;

    if (activeParticipants.length === 0) {
        return (
            <div className="case-container">
                <motion.div
                    className="selected-participant"
                    style={{
                        background: 'linear-gradient(135deg, #5a6b7f, #2a2a2a)',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <>
                        <motion.span
                            initial={{opacity: 0, scale: 0.5}}
                            animate={{opacity: 1, scale: 1}}
                            whileHover={{scale: 1.15}}
                            transition={{duration: 0.5, delay: 0.2, type: "spring", stiffness: 100}}
                        >
                            Пусто
                        </motion.span>
                        <motion.span
                            className="emoji"
                            initial={{opacity: 0, scale: 0.5}}
                            animate={{opacity: 1, scale: 1}}
                            whileHover={{scale: 1.15}}
                            transition={{duration: 0.5, delay: 0.3, type: "spring", stiffness: 100}}
                        >
                            🤷
                        </motion.span>
                    </>
                </motion.div>

                <div className="pointer">▼</div>

                <div className="tape-wrapper">
                    <div className="no-participants">
                        Никого не осталось 🥲
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="case-container">
            <SelectedParticipant
                displayParticipant={displayParticipant}
                localIsSpinning={localIsSpinning}
                hideNames={hideNames}
                isHovered={isHovered}
                setIsHovered={setIsHovered}
            />

            <div className="pointer">▼</div>

            <div className="tape-wrapper">
                <motion.div
                    className="tape"
                    animate={controls}
                    initial={{ x: 0 }}
                    ref={tapeRef}
                >
                    {tapeItems.map((participant, index) => (
                        <motion.div
                            key={index}
                            className="tape-item"
                            style={{
                                background: `linear-gradient(to left, ${participant.color}, ${participant.color} 0%, ${
                                    currentCenterIndex === index ? '#3f3f3f' : '#3a3a3a'} 33%)`,
                            }}
                            animate={{
                                scale: currentCenterIndex === index ? 1.1 : 1,
                            }}
                            transition={{ duration: 0.1 }}
                        >
                            <span className="tape-item-text">
                                {hideNames ? '...' : participant.name}
                            </span>
                            <span className="emoji">{participant.emoji}</span>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default Case;