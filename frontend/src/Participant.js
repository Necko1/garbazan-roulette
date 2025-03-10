import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const Participant = React.memo(function Participant({ name, isHidden, onToggle, color, useAnimations, fixedEmoji }) {
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const randomValues = useMemo(() => ({
        scaleHidden: randomInRange(0.88, 0.95),
        opacityHidden: randomInRange(0.6, 0.8),
        yHidden: randomInRange(8, 15),
        rotateHidden: randomInRange(-5, 5),
        xName: randomInRange(-8, -3),
        rotateIcon: randomInRange(-80, 80),
        scaleIcon: randomInRange(0.7, 0.9),
        yIcon: randomInRange(-2, 2),
    }), []);

    const backgroundVariants = useMemo(() => ({
        visible: {
            background: `linear-gradient(to left, ${color}, ${color} 0%, #3a3a3a 33%)`,
            scale: 1,
            opacity: 1,
            y: 0,
            rotate: 0,
            transition: { duration: 0.3, ease: "easeInOut" }
        },
        hidden: useAnimations ? {
            background: `linear-gradient(to left, rgba(${hexToRgb(color)}, 0.5), rgba(${hexToRgb(color)}, 0.5) 0%, #3a3a3a 66%)`,
            scale: randomValues.scaleHidden,
            opacity: randomValues.opacityHidden,
            y: randomValues.yHidden,
            rotate: randomValues.rotateHidden,
            transition: { duration: 0.3, ease: "easeInOut" }
        } : {
            background: `linear-gradient(to left, rgba(${hexToRgb(color)}, 0.5), rgba(${hexToRgb(color)}, 0.5) 0%, #3a3a3a 66%)`,
            scale: 0.9,
            opacity: 0.6,
            y: 0,
            rotate: 0,
            transition: { duration: 0.3, ease: "easeInOut" }
        }
    }), [color, randomValues, useAnimations]);

    const nameVariants = useMemo(() => ({
        visible: { x: 0 },
        hidden: useAnimations ? { x: randomValues.xName } : { x: 0 }
    }), [randomValues, useAnimations]);

    const iconVariants = useMemo(() => ({
        visible: { rotate: 0, scale: 1, y: 0 },
        hidden: useAnimations ? {
            rotate: randomValues.rotateIcon,
            scale: randomValues.scaleIcon,
            y: randomValues.yIcon
        } : { rotate: 0, scale: 1, y: 0 }
    }), [randomValues, useAnimations]);

    const hoverEffect = { scale: 1.02, transition: { duration: 0.2 } };

    return (
        <motion.div
            className={`participant-item ${isHidden ? 'hidden' : ''}`}
            onClick={onToggle}
            variants={backgroundVariants}
            animate={isHidden ? 'hidden' : 'visible'}
            initial={isHidden ? 'hidden' : 'visible'}
            whileHover={hoverEffect}
            whileTap={{ scale: 0.95 }}
            style={{ cursor: "pointer", borderRadius: "8px", padding: "10px 15px", position: "relative", overflow: "hidden" }}
        >
            <motion.span
                className="participant-name"
                variants={nameVariants}
                animate={isHidden ? 'hidden' : 'visible'}
                transition={{ duration: 0.3 }}
            >
                {name}
            </motion.span>
            <motion.span
                className="toggle-icon"
                variants={iconVariants}
                animate={isHidden ? 'hidden' : 'visible'}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                {isHidden ? '🤕' : fixedEmoji}
            </motion.span>
        </motion.div>
    );
});

function hexToRgb(hsl) {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return '0, 0, 0';

    const h = parseInt(match[1]);
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;

    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h / 360 + 1/3);
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, h / 360 - 1/3);
    }

    return `${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`;
}

export default Participant;