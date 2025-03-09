import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

function Roulette() {
    const [searchParams] = useSearchParams();
    const uuid = searchParams.get('uuid');


}

export default Roulette;