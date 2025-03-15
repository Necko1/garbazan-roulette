import React, {useEffect, useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Home.css';
import axios from "axios";

function Home() {
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [isTextFocused, setIsTextFocused] = useState(false);
    const [particles, setParticles] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [isFileHovering, setIsFileHovering] = useState(false); // Новое состояние

    const [rotation, setRotation] = useState(0);

    const MAX_FILE_SIZE = 2 * 1024 * 1024;

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1280);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const particlesArray = Array.from({ length: window.innerWidth <= window.innerHeight ? 25 : 75 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 5 + 1,
            speedX: Math.random() * 2 - 0.5,
            speedY: Math.random() * 2 - 0.5,
        }));
        setParticles(particlesArray);

        const animateParticles = () => {
            setParticles(prev => prev.map(particle => {
                let newX = particle.x + particle.speedX;
                let newY = particle.y + particle.speedY;

                if (newX > window.innerWidth) newX = 0;
                if (newX < 0) newX = window.innerWidth;
                if (newY > window.innerHeight) newY = 0;
                if (newY < 0) newY = window.innerHeight;

                return { ...particle, x: newX, y: newY };
            }));
        };

        const interval = setInterval(animateParticles, 16);
        return () => clearInterval(interval);
    }, []);

    const handleTextChange = (e) => {
        setText(e.target.value);
        setFile(null);
        setError('');
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > MAX_FILE_SIZE) {
                setError('Файл слишком большой. Максимальный размер: 2 МБ.');
                setFile(null);
            } else {
                setFile(selectedFile);
                setText('');
                setError('');
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsFileHovering(false); // Сбрасываем состояние
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            if (droppedFile.size > MAX_FILE_SIZE) {
                setError('Файл слишком большой. Максимальный размер: 2 МБ.');
                setFile(null);
            } else {
                setFile(droppedFile);
                setText('');
                setError('');
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsFileHovering(true);
        }
    };

    const handleDragLeave = () => {
        setIsFileHovering(false);
    };

    const handleRemoveFile = () => {
        setFile(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text && !file) {
            alert('Введите текст либо выберите текстовый файл');
            return;
        }

        try {
            const formData = new FormData();
            if (file) {
                formData.append('file', file);
            } else if (text) {
                formData.append('text', text);
            }

            const response = await axios.post('https://api.necko.space/roulette', formData);

            if (response.status !== 200) {
                setError('Ошибка сервера');
            }

            const uuid = response.data;
            window.location.href = `/roulette?uuid=${uuid}`;
        } catch (err) {
            setError(err.message || 'Ошибка при загрузке');
        }
    };

    return (
        <div className="app-wrapper">
            {particles.map((particle, index) => (
                <motion.div
                    key={index}
                    className="particle"
                    style={{
                        left: particle.x,
                        top: particle.y,
                        width: particle.size,
                        height: particle.size,
                    }}
                />
            ))}
            <motion.div
                className="overlay"
                animate={{ opacity: isTextFocused ? 1 : 0 }}
                transition={{ duration: 0.3 }}
            />
            <div className="container">
                <motion.h1
                    initial={{opacity: 0, y: -30}}
                    animate={{opacity: 1, y: -15}}
                    whileHover={{
                        scale: 1.35,
                        rotate: rotation,
                    }}
                    onHoverStart={() => setRotation(Math.cos(Date.now()) < 0 ? 4 : -4)}
                    transition={{duration: 1}}
                >
                    <a href="https://twitch.tv/garbazan">twitch.tv/garbazan</a>
                </motion.h1>
                <motion.div
                    className="input-section"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.5, duration: 0.5}}
                >
                    <AnimatePresence>
                        {!file && (
                            <motion.div
                                key="text-input"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{
                                    opacity: 1,
                                    height: 'auto',
                                    scale: isTextFocused && !isMobile ? 1.5 : 1,
                                    zIndex: isTextFocused ? 10 : 1
                                }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <textarea
                                    value={text}
                                    onChange={handleTextChange}
                                    onFocus={() => setIsTextFocused(true)}
                                    onBlur={() => setIsTextFocused(false)}
                                    placeholder="Ввод вручную..."
                                    rows="4"
                                    className="text-input"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                        {!isTextFocused && !text && (
                            <motion.div
                                key="file-drop-zone"
                                className="file-drop-zone-wrapper"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {!!file && (
                                    <motion.button
                                        className="remove-file"
                                        onClick={handleRemoveFile}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        whileHover={{ rotate: 15, scale: 1.1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        ✕
                                    </motion.button>
                                )}
                                <motion.div
                                    className={`file-drop-zone${isFileHovering ? ' dragging' : ''}`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    animate={{ scale: isFileHovering ? 1.1 : 1 }} // Анимация увеличения
                                    whileHover={{ scale: 1.03, boxShadow: "0px 0px 20px rgba(0,180,216,0.8)" }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    {file ? (
                                        <motion.div
                                            className="file-preview"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <span className="file-icon">📄</span>
                                            <span className="file-name">{file.name}</span>
                                        </motion.div>
                                    ) : (
                                        <p>Выбрать файл (до 2МБ, .txt)</p>
                                    )}
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="file-input"
                                    />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {error && (
                        <motion.p
                            className="error-message"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {error}
                        </motion.p>
                    )}
                    <motion.button
                        onClick={handleSubmit}
                        className="submit-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        Продолжить
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}

export default Home;