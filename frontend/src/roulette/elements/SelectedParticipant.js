import {motion} from "framer-motion";
import React from "react";

function SelectedParticipant({displayParticipant, localIsSpinning, hideNames, isHovered, setIsHovered}) {
    return (
        <motion.div
            className="selected-participant"
            style={{
                background: displayParticipant
                    ? `linear-gradient(135deg, ${displayParticipant.color || '#5a6b7f'}, #2a2a2a)`
                    : 'linear-gradient(135deg, #5a6b7f, #2a2a2a)',
            }}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.5, ease: "easeOut"}}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            {displayParticipant ? (
                localIsSpinning && hideNames ? (
                    <>
                        <motion.span
                            initial={{opacity: 0, scale: 0.5}}
                            animate={{opacity: 1, scale: 1}}
                            whileHover={{scale: 1.15}}
                            transition={{duration: 0.5, delay: 0.2, type: "spring", stiffness: 100}}
                        >
                            ...
                        </motion.span>
                        <motion.span
                            className="question-emoji"
                            initial={{scale: 1}}
                            whileHover={{scale: 1.4}}
                            transition={{duration: 0.3}}
                        >
                            ❓
                        </motion.span>
                    </>
                ) : localIsSpinning && !hideNames ? (
                    <>
                        <motion.span
                            initial={{opacity: 0, scale: 0.5}}
                            animate={{opacity: 1, scale: 1}}
                            whileHover={{scale: 1.15}}
                            transition={{duration: 0.5, delay: 0.2, type: "spring", stiffness: 100}}
                        >
                            {displayParticipant.name}
                        </motion.span>
                        <motion.span
                            className="emoji"
                            initial={{opacity: 0, scale: 0.5}}
                            animate={{opacity: 1, scale: 1}}
                            whileHover={{scale: 1.15}}
                            transition={{duration: 0.5, delay: 0.3, type: "spring", stiffness: 100}}
                        >
                            {displayParticipant.emoji}
                        </motion.span>
                    </>
                ) : (
                    hideNames && !isHovered ? (
                        <>
                            <motion.span
                                initial={{opacity: 0, scale: 0.5}}
                                animate={{opacity: 1, scale: 1}}
                                whileHover={{scale: 1.15}}
                                transition={{duration: 0.5, delay: 0.2, type: "spring", stiffness: 100}}
                            >
                                ...
                            </motion.span>
                            <motion.span
                                className="question-emoji"
                                initial={{scale: 1}}
                                whileHover={{scale: 1.4}}
                                transition={{duration: 0.3}}
                            >
                                ❓
                            </motion.span>
                        </>
                    ) : (
                        <>
                            <motion.span
                                initial={{opacity: 0, scale: 0.5}}
                                animate={{opacity: 1, scale: 1}}
                                whileHover={{scale: 1.15}}
                                transition={{duration: 0.5, delay: 0.2, type: "spring", stiffness: 100}}
                            >
                                {displayParticipant.name}
                            </motion.span>
                            <motion.span
                                className="emoji"
                                initial={{opacity: 0, scale: 0.5}}
                                animate={{opacity: 1, scale: 1}}
                                whileHover={{scale: 1.15}}
                                transition={{duration: 0.5, delay: 0.3, type: "spring", stiffness: 100}}
                            >
                                {displayParticipant.emoji}
                            </motion.span>
                        </>
                    )
                )
            ) : (
                <>
                    <motion.span
                        initial={{opacity: 0, scale: 0.5}}
                        animate={{opacity: 1, scale: 1}}
                        whileHover={{scale: 1.15}}
                        transition={{duration: 0.5, delay: 0.2, type: "spring", stiffness: 100}}
                    >
                        Крути
                    </motion.span>
                    <motion.span
                        className="emoji"
                        initial={{opacity: 0, scale: 0.5}}
                        animate={{opacity: 1, scale: 1}}
                        whileHover={{scale: 1.15}}
                        transition={{duration: 0.5, delay: 0.3, type: "spring", stiffness: 100}}
                    >
                        ✨
                    </motion.span>
                </>
            )}
        </motion.div>
    );
}

export default SelectedParticipant;