import {motion, useAnimation} from "framer-motion";
import React from "react";

function GarbaPhoto({currentImageNumber, setCurrentImageNumber, center, size}) {
    const imageControls = useAnimation();

    const handleCenterClick = async () => {
        await imageControls.start({
            scale: 0.8,
            rotate: Math.floor(Math.random() * 120 - 60 + 1),
            opacity: 0,
            transition: {duration: 0.2, ease: "easeIn"}
        });

        setCurrentImageNumber(Math.floor(Math.random() * 18) + 1);

        await imageControls.start({
            scale: 1,
            rotate: 0,
            opacity: 1,
            transition: {duration: 0.3, type: "spring", stiffness: 150}
        });
    };

    return (
        <>
            <motion.g
                animate={imageControls}
                initial={{scale: 1, rotate: 0, opacity: 1}}
                whileHover={{
                    scale: 1.1,
                    rotate: 5,
                    transition: {duration: 0.2}
                }}
            >
                <motion.image
                    href={`garbaphoto/${currentImageNumber}.webp`}
                    x={center - (size / 10)}
                    y={center - (size / 10)}
                    width={size / 5}
                    height={size / 5}
                    onClick={handleCenterClick}
                    style={{cursor: 'pointer'}}
                    clipPath="url(#circleClip)"
                />
            </motion.g>

            <defs>
                <clipPath id="circleClip">
                    <circle
                        cx={center}
                        cy={center}
                        r={size / 10}
                    />
                </clipPath>
            </defs>
        </>
    );
}

export default GarbaPhoto;