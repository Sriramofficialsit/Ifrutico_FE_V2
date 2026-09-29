import React from 'react';
import SEO from '../Components/SEO';
import { seoData } from '../../utils/seoData';
import InfiniteMenu from '../Components/InfiniteMenu';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import PineappleImg from "../images/fruits/Pineapple.webp";
import AppleImg from "../images/fruits/Apple.webp";
import StrawberryImg from "../images/fruits/Strawberry.webp";
import PomogranateImg from "../images/fruits/Pomogranate.webp";
import AvocadoImg from "../images/fruits/Avocado.webp";
import JackfruitImg from "../images/fruits/Jackfruit.webp";
import MangoImg from "../images/fruits/Mango.webp";
import CoconutImg from "../images/fruits/Coconut.webp";
import LycheeImg from "../images/fruits/Lychee Love.webp";
import PassionFruitImg from "../images/fruits/Passion fruit.webp";
import DragonFruitImg from "../images/fruits/Dragon fruit.webp";
import FigImg from "../images/fruits/Fig.webp";

import BeetrootImg from "../images/vegetables/Beetroot.webp";
import CarrotImg from "../images/vegetables/Carrot.webp";
import KiwiImg from "../images/fruits/Kiwi.webp";

const items = [
  { image: MangoImg, title: "Royal Mango", description: "The king of fruits, captured in a creamy delight.", link: "#" },
  { image: StrawberryImg, title: "Fresh Strawberry", description: "Sun-ripened berries meets velvet cream.", link: "#" },
  { image: AvocadoImg, title: "Creamy Avocado", description: "Nature's butter, reimagined for your palate.", link: "#" },
  { image: JackfruitImg, title: "Exotic Jackfruit", description: "A unique tropical treasure in every scoop.", link: "#" },
  { image: DragonFruitImg, title: "Dragon Delight", description: "Vibrant colors, mystical flavors.", link: "#" },
  { image: FigImg, title: "Classic Fig", description: "Timeless sweetness from the ancient groves.", link: "#" },
  { image: LycheeImg, title: "Lychee Love", description: "Delicate floral notes in a frozen dream.", link: "#" },
  { image: PassionFruitImg, title: "Passion Paradise", description: "Zesty, bold, and unapologetically tropical.", link: "#" },
  { image: CarrotImg, title: "Garden Carrot", description: "The surprising sweetness of the earth.", link: "#" },
  { image: BeetrootImg, title: "Velvet Beet", description: "Earth tones and creamy perfection.", link: "#" },
  { image: CoconutImg, title: "Island Coconut", description: "Pure white bliss from the tropical shores.", link: "#" },
  { image: PineappleImg, title: "Golden Pineapple", description: "A burst of sunshine in every bite.", link: "#" },
  { image: KiwiImg, title: "Zesty Kiwi", description: "Refreshing tanginess meets smooth cream.", link: "#" },
  { image: AppleImg, title: "Orchard Apple", description: "Crisp, sweet, and comforting.", link: "#" },
  { image: PomogranateImg, title: "Ruby Pom", description: "Jewels of flavor in a frozen crown.", link: "#" },
];

const PureJoy = () => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <SEO {...seoData.pureJoy} />
      <div className="absolute top-0 left-0 w-full z-50 p-6 sm:p-10 flex items-center justify-between pointer-events-none">
        <Link to="/" className="pointer-events-auto">
          <motion.div 
            className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
            whileHover={{ x: -5 }}
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-inter font-bold tracking-widest uppercase text-xs">Back to Home</span>
          </motion.div>
        </Link>

        <div className="flex flex-col items-end">
          <h1 className="font-outfit text-xl sm:text-3xl font-black text-white tracking-tighter uppercase">
            FRUTICO
          </h1>
          <p className="font-inter text-[10px] text-white/50 uppercase tracking-[0.3em]">Pure Joy Since 2007</p>
        </div>
      </div>

      <div className="w-full h-full">
        <InfiniteMenu items={items} scale={1.2} />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary-green/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-mango-orange/10 rounded-full blur-[120px]" />
      </div>

      <div className="absolute bottom-10 left-10 z-50 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="font-outfit text-4xl sm:text-6xl font-black text-white/10 uppercase leading-none">
            Crafting<br />Pure Joy
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PureJoy;
