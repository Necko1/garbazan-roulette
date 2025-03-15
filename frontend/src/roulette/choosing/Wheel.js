import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import './Wheel.css';

function Wheel({ participants, hideNames, spinTrigger, onSpinEnd, lastSelectedParticipant, spinDuration }) {
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [rotation, setRotation] = useState(0);
    const [size] = useState(() => Math.min(window.innerHeight * 0.8, window.innerWidth * 0.8));
    const [localIsSpinning, setLocalIsSpinning] = useState(false);
    const [lastSpinTrigger, setLastSpinTrigger] = useState(0);
    const [initialCenter] = useState(size / 2);
    const [isHovered, setIsHovered] = useState(false);
    const spinTimeoutRef = useRef(null);
    const controls = useAnimation();

    const activeParticipants = participants.filter(p => !p.isHidden);

    const getParticipantUnderPointer = (currentRotation) => {
        if (activeParticipants.length === 0) return null;
        if (activeParticipants.length === 1) return activeParticipants[0];

        const totalParticipants = activeParticipants.length;
        const angleStep = (2 * Math.PI) / totalParticipants;
        const pointerAngle = 3 * Math.PI / 2;

        const currentAngle = (currentRotation * Math.PI / 180) % (2 * Math.PI);
        let selectedIndex = -1;
        let currentIndex = 0;

        while (currentIndex < totalParticipants) {
            let sameNameCount = 1;
            const participant = activeParticipants[currentIndex];

            for (let i = currentIndex + 1; i < totalParticipants; i++) {
                if (activeParticipants[i].name === participant.name) {
                    sameNameCount++;
                } else {
                    break;
                }
            }

            const startAngle = angleStep * currentIndex;
            const endAngle = startAngle + angleStep * sameNameCount;
            const sectorStart = startAngle;
            const sectorEnd = endAngle;
            const adjustedPointer = (pointerAngle - currentAngle + 2 * Math.PI) % (2 * Math.PI);

            if (
                (sectorStart <= sectorEnd && adjustedPointer >= sectorStart && adjustedPointer <= sectorEnd) ||
                (sectorStart > sectorEnd && (adjustedPointer >= sectorStart || adjustedPointer <= sectorEnd))
            ) {
                selectedIndex = currentIndex;
                break;
            }

            currentIndex += sameNameCount;
        }

        return selectedIndex !== -1 ? activeParticipants[selectedIndex] : activeParticipants[0];
    };

    useEffect(() => {
        if (spinTrigger > lastSpinTrigger && !localIsSpinning && activeParticipants.length > 0) {
            setLastSpinTrigger(spinTrigger);
            setLocalIsSpinning(true);

            const angularSpeed = 720;
            const totalRotation = angularSpeed * Math.min(spinDuration, 10);
            const additionalAngle = Math.random() * 360;
            const newRotation = rotation + totalRotation + additionalAngle;

            if (spinDuration === 0) {
                const finalParticipant = getParticipantUnderPointer(newRotation);
                setRotation(newRotation);
                setSelectedParticipant(finalParticipant);
                controls.start({
                    rotate: newRotation,
                    transition: { duration: 0 },
                }).then(() => {
                    setLocalIsSpinning(false);
                    if (onSpinEnd) onSpinEnd(finalParticipant);
                });
            } else {
                const accelDuration = spinDuration * 0.2;
                const mainDuration = spinDuration * 0.8;
                const fullRotations = Math.floor(totalRotation / 360) + 5;
                const startRotation = newRotation - (fullRotations * 360);

                controls.start({
                    rotate: [rotation, newRotation],
                    transition: {
                        duration: accelDuration,
                        ease: [.5, 0, .5, 0],
                    },
                }).then(() => {
                    controls.start({
                        rotate: [startRotation, newRotation],
                        transition: {
                            duration: mainDuration,
                            ease: [.1, .8, .2, 1],
                        },
                    }).then(() => {
                        setLocalIsSpinning(false);
                        const finalParticipant = getParticipantUnderPointer(newRotation);
                        setSelectedParticipant(finalParticipant);
                        if (onSpinEnd) onSpinEnd(finalParticipant);
                    });
                });

                setRotation(newRotation);
            }
        }
    }, [spinTrigger, lastSpinTrigger, participants, spinDuration, onSpinEnd, controls]);

    useEffect(() => {
        return () => {
            if (spinTimeoutRef.current) {
                clearTimeout(spinTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (activeParticipants.length === 1) {
            setSelectedParticipant(activeParticipants[0]);
        }
    }, [participants]);

    if (size <= 0) return null;

    const radius = size / 2 - 20;
    const center = initialCenter;
    const totalParticipants = activeParticipants.length;

    const displayParticipant = localIsSpinning ? selectedParticipant : (totalParticipants === 1 ? activeParticipants[0] : lastSelectedParticipant);

    if (totalParticipants === 0) {
        return (
            <div className="wheel-container">
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
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="wheel-svg"
                    style={{overflow: 'hidden'}}
                >
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="#3a3a3a"
                        stroke="#e0e0e0"
                        strokeWidth="2"
                    />
                    <text
                        x={center}
                        y={center}
                        fontFamily="Inter"
                        fontSize={Math.max(12, size / 20)}
                        fill="#e0e0e0"
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        Никого не осталось 🥲
                    </text>
                    <polygon
                        points={`${center - 20},${center - radius - 20} ${center + 20},${center - radius - 20} ${center},${center - radius + 10}`}
                        fill="#e0e0e0"
                        stroke="#2a2a2a"
                        strokeWidth="2"
                    />
                </svg>
            </div>
        );
    }

    if (totalParticipants === 1) {
        const participant = activeParticipants[0];
        const startAngle = 0;
        const endAngle = 2 * Math.PI;
        const midAngle = Math.PI + 0.025;
        const textX = center + (radius * 0.65) * Math.cos(midAngle);
        const textY = center + (radius * 0.65) * Math.sin(midAngle);
        const fontSize = Math.max(12, size / 40);
        const textAngle = midAngle * 180 / Math.PI;

        let text = participant.name;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = `${fontSize}px Inter`;
        let textWidth = tempCtx.measureText(text).width;
        const maxTextWidth = radius * 0.6;
        while (textWidth > maxTextWidth && text.length > 1) {
            text = text.slice(0, -1);
            textWidth = tempCtx.measureText(text + '...').width;
        }
        if (text !== participant.name) text += '...';

        return (
            <div className="wheel-container">
                <motion.div
                    className="selected-participant"
                    style={{
                        background: `linear-gradient(135deg, ${participant.color || '#5a6b7f'}, #2a2a2a)`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                >
                    {hideNames && !isHovered ? (
                        <>
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.15 }}
                                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
                            >
                                ...
                            </motion.span>
                            <motion.span
                                className="question-emoji"
                                initial={{ scale: 1 }}
                                whileHover={{ scale: 1.4 }}
                                transition={{ duration: 0.3 }}
                            >
                                ❓
                            </motion.span>
                        </>
                    ) : (
                        <>
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.15 }}
                                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
                            >
                                {participant.name}
                            </motion.span>
                            <motion.span
                                className="emoji"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.15 }}
                                transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 100 }}
                            >
                                {participant.emoji}
                            </motion.span>
                        </>
                    )}
                </motion.div>
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="wheel-svg"
                    style={{ overflow: 'hidden' }}
                >
                    <motion.g
                        animate={controls}
                        initial={{ rotate: rotation }}
                        style={{ transformOrigin: "50% 50%" }}
                        onUpdate={(latest) => {
                            if (localIsSpinning && spinDuration > 0) {
                                const currentRotation = latest.rotate || 0;
                                const participant = getParticipantUnderPointer(currentRotation);
                                setSelectedParticipant(participant);
                            }
                        }}
                    >
                        <path
                            d={`M ${center} ${center} L ${center + radius * Math.cos(startAngle)} ${center + radius * Math.sin(startAngle)} A ${radius} ${radius} 0 1 1 ${center + radius * Math.cos(endAngle - 0.001)} ${center + radius * Math.sin(endAngle - 0.001)} Z`}
                            fill={participant.color}
                            stroke="#e0e0e0"
                            strokeWidth="2"
                        />
                        <text
                            x={textX}
                            y={textY}
                            fontFamily="Inter"
                            fontSize={fontSize}
                            fill="#ffffff"
                            textAnchor="middle"
                            transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                        >
                            {hideNames ? '' : text}
                        </text>
                        <circle
                            cx={center}
                            cy={center}
                            r={size / 12}
                            fill="#2a2a2a"
                            stroke="#e0e0e0"
                            strokeWidth="2"
                        />
                    </motion.g>
                    <circle
                        cx={center}
                        cy={center}
                        r={5}
                        fill="#e0e0e0"
                        stroke="none"
                    />
                    <polygon
                        points={`${center - 20},${center - radius - 20} ${center + 20},${center - radius - 20} ${center},${center - radius + 10}`}
                        fill="#e0e0e0"
                        stroke="#2a2a2a"
                        strokeWidth="2"
                    />
                </svg>
            </div>
        );
    }

    const angleStep = (2 * Math.PI) / totalParticipants;
    const sectors = [];
    let currentIndex = 0;

    while (currentIndex < totalParticipants) {
        const participant = activeParticipants[currentIndex];
        let sameNameCount = 1;

        for (let i = currentIndex + 1; i < totalParticipants; i++) {
            if (activeParticipants[i].name === participant.name) {
                sameNameCount++;
            } else {
                break;
            }
        }

        sectors.push({
            participant,
            sameNameCount,
            startIndex: currentIndex,
        });

        currentIndex += sameNameCount;
    }

    return (
        <div className="wheel-container">
            <motion.div
                className="selected-participant"
                style={{
                    background: displayParticipant
                        ? `linear-gradient(135deg, ${displayParticipant.color || '#5a6b7f'}, #2a2a2a)`
                        : 'linear-gradient(135deg, #5a6b7f, #2a2a2a)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                {displayParticipant ? (
                    localIsSpinning && hideNames ? (
                        <>
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.15 }}
                                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
                            >
                                ...
                            </motion.span>
                            <motion.span
                                className="question-emoji"
                                initial={{ scale: 1 }}
                                whileHover={{ scale: 1.4 }}
                                transition={{ duration: 0.3 }}
                            >
                                ❓
                            </motion.span>
                        </>
                    ) : localIsSpinning && !hideNames ? (
                        <>
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.15 }}
                                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
                            >
                                {displayParticipant.name}
                            </motion.span>
                            <motion.span
                                className="emoji"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.15 }}
                                transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 100 }}
                            >
                                {displayParticipant.emoji}
                            </motion.span>
                        </>
                    ) : (
                        hideNames && !isHovered ? (
                            <>
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.15 }}
                                    transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
                                >
                                    ...
                                </motion.span>
                                <motion.span
                                    className="question-emoji"
                                    initial={{ scale: 1 }}
                                    whileHover={{ scale: 1.4 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    ❓
                                </motion.span>
                            </>
                        ) : (
                            <>
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.15 }}
                                    transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
                                >
                                    {displayParticipant.name}
                                </motion.span>
                                <motion.span
                                    className="emoji"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.15 }}
                                    transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 100 }}
                                >
                                    {displayParticipant.emoji}
                                </motion.span>
                            </>
                        )
                    )
                ) : (
                    <>
                        <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.15 }}
                            transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
                        >
                            Крути
                        </motion.span>
                        <motion.span
                            className="emoji"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.15 }}
                            transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 100 }}
                        >
                            ✨
                        </motion.span>
                    </>
                )}
            </motion.div>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="wheel-svg"
                style={{ overflow: 'hidden' }}
            >
                <motion.g
                    animate={controls}
                    initial={{ rotate: rotation }}
                    style={{ transformOrigin: "50% 50%" }}
                    onUpdate={(latest) => {
                        if (localIsSpinning && spinDuration > 0) {
                            const currentRotation = latest.rotate || 0;
                            const participant = getParticipantUnderPointer(currentRotation);
                            setSelectedParticipant(participant);
                        }
                    }}
                >
                    {sectors.map((sector, index) => {
                        const { participant, sameNameCount, startIndex } = sector;
                        const startAngle = angleStep * startIndex;
                        const endAngle = startAngle + angleStep * sameNameCount;
                        const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;

                        const x1 = center + radius * Math.cos(startAngle);
                        const y1 = center + radius * Math.sin(startAngle);
                        const x2 = center + radius * Math.cos(endAngle);
                        const y2 = center + radius * Math.sin(endAngle);

                        const midAngle = startAngle + (endAngle - startAngle) / 2 + 0.025;
                        const textX = center + (radius * 0.65) * Math.cos(midAngle);
                        const textY = center + (radius * 0.65) * Math.sin(midAngle);

                        const fontSize = Math.max(12, size / 40);
                        let text = participant.name;
                        const tempCanvas = document.createElement('canvas');
                        const tempCtx = tempCanvas.getContext('2d');
                        tempCtx.font = `${fontSize}px Inter`;
                        let textWidth = tempCtx.measureText(text).width;
                        const textHeight = fontSize * 1.2;

                        const maxTextWidth = radius * 0.6;
                        while (textWidth > maxTextWidth && text.length > 1) {
                            text = text.slice(0, -1);
                            textWidth = tempCtx.measureText(text + '...').width;
                        }
                        if (text !== participant.name) text += '...';

                        const minAngleForText = (textHeight / radius) * 1.85;
                        const sectorAngle = endAngle - startAngle;
                        const showText = sectorAngle >= minAngleForText && !hideNames;

                        const textAngle = midAngle * 180 / Math.PI;

                        return (
                            <g key={index}>
                                <path
                                    d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                    fill={participant.color}
                                    stroke="#e0e0e0"
                                    strokeWidth="2"
                                />
                                {showText && (
                                    <text
                                        x={textX}
                                        y={textY}
                                        fontFamily="Inter"
                                        fontSize={fontSize}
                                        fill="#ffffff"
                                        textAnchor="middle"
                                        transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                                    >
                                        {text}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                    <circle
                        cx={center}
                        cy={center}
                        r={size / 12}
                        fill="#2a2a2a"
                        stroke="#e0e0e0"
                        strokeWidth="2"
                    />
                </motion.g>

                <circle
                    cx={center}
                    cy={center}
                    r={5}
                    fill="#e0e0e0"
                    stroke="none"
                />

                <polygon
                    points={`${center - 20},${center - radius - 20} ${center + 20},${center - radius - 20} ${center},${center - radius + 10}`}
                    fill="#e0e0e0"
                    stroke="#2a2a2a"
                    strokeWidth="2"
                />
            </svg>
        </div>
    );
}

export default Wheel;