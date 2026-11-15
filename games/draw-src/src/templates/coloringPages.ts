import { COLORING_RESOLUTION } from '../config'
import { buildBarrier } from '../coloring/floodFill'

export type ColoringCategory =
  | 'Animals'
  | 'Cats & Kittens'
  | 'Dogs & Puppies'
  | 'Unicorns'
  | 'Horses & Ponies'
  | 'Princesses & Castles'
  | 'Dinosaurs'
  | 'Underwater'
  | 'Butterflies & Flowers'
  | 'Fairies & Magic'
  | 'Space & Rockets'
  | 'Vehicles'
  | 'Holidays & Seasons'

export interface ColoringTemplate {
  id: string
  title: string
  category: ColoringCategory
  difficulty: 'easy' | 'medium'
  accent: string
  svg: string
}

export interface LoadedColoringTemplate {
  template: ColoringTemplate
  image: HTMLImageElement
  lineData: ImageData
  barrier: Uint8Array
}

const INK = '#303044'
const LINE = 10

function page(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img"><g fill="none" stroke="${INK}" stroke-width="${LINE}" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`
}

function eyes(cx: number, cy: number, gap = 42, r = 8): string {
  return `<circle cx="${cx - gap}" cy="${cy}" r="${r}" fill="${INK}" stroke="none"/><circle cx="${cx + gap}" cy="${cy}" r="${r}" fill="${INK}" stroke="none"/>`
}

function smile(cx: number, cy: number, width = 56): string {
  return `<path d="M${cx - width / 2} ${cy} Q${cx} ${cy + width * 0.6} ${cx + width / 2} ${cy}"/>`
}

const templates: ColoringTemplate[] = [
  {
    id: 'elephant',
    title: 'Elephant',
    category: 'Animals',
    difficulty: 'easy',
    accent: '#b9c8d8',
    svg: page(`
      <ellipse cx="400" cy="500" rx="220" ry="160"/>
      <circle cx="400" cy="320" r="128"/>
      <ellipse cx="278" cy="330" rx="74" ry="105"/>
      <ellipse cx="522" cy="330" rx="74" ry="105"/>
      <path d="M474 370 C566 414 570 532 506 586 C476 612 440 592 452 558"/>
      <path d="M285 626 L285 690 Q285 710 310 710 L350 710"/>
      <path d="M515 626 L515 690 Q515 710 490 710 L450 710"/>
      ${eyes(400, 306)}
      ${smile(400, 350, 52)}
      <path d="M340 390 Q320 430 300 420"/>
      <path d="M460 390 Q480 430 500 420"/>
    `),
  },
  {
    id: 'turtle',
    title: 'Turtle',
    category: 'Animals',
    difficulty: 'easy',
    accent: '#9ed8b1',
    svg: page(`
      <ellipse cx="400" cy="430" rx="250" ry="190"/>
      <path d="M205 430 Q400 260 595 430"/>
      <path d="M260 520 Q400 420 540 520"/>
      <path d="M315 590 Q400 520 485 590"/>
      <circle cx="660" cy="390" r="62"/>
      <circle cx="640" cy="375" r="9" fill="${INK}" stroke="none"/>
      ${smile(665, 405, 30)}
      <path d="M210 520 Q160 560 200 600"/>
      <path d="M590 520 Q640 560 600 600"/>
      <path d="M290 600 L260 660"/>
      <path d="M510 600 L540 660"/>
    `),
  },
  {
    id: 'bunny',
    title: 'Bunny',
    category: 'Animals',
    difficulty: 'easy',
    accent: '#ffd2df',
    svg: page(`
      <ellipse cx="400" cy="500" rx="180" ry="170"/>
      <circle cx="400" cy="360" r="130"/>
      <ellipse cx="330" cy="190" rx="52" ry="140" transform="rotate(-12 330 190)"/>
      <ellipse cx="470" cy="190" rx="52" ry="140" transform="rotate(12 470 190)"/>
      <ellipse cx="330" cy="190" rx="22" ry="96" transform="rotate(-12 330 190)"/>
      <ellipse cx="470" cy="190" rx="22" ry="96" transform="rotate(12 470 190)"/>
      ${eyes(400, 350)}
      <path d="M385 390 Q400 405 415 390"/>
      <path d="M400 405 L400 425 M400 425 Q380 445 365 430 M400 425 Q420 445 435 430"/>
      <ellipse cx="400" cy="540" rx="95" ry="80"/>
      <path d="M300 590 Q320 660 360 620"/>
      <path d="M500 590 Q480 660 440 620"/>
    `),
  },
  {
    id: 'cat-face',
    title: 'Happy Cat',
    category: 'Cats & Kittens',
    difficulty: 'easy',
    accent: '#ffc7a8',
    svg: page(`
      <path d="M250 300 L230 150 L360 240"/>
      <path d="M550 300 L570 150 L440 240"/>
      <ellipse cx="400" cy="420" rx="220" ry="200"/>
      ${eyes(400, 380, 70, 11)}
      <path d="M380 430 Q400 450 420 430"/>
      <path d="M400 450 L400 475 M400 475 Q370 500 350 478 M400 475 Q430 500 450 478"/>
      <path d="M270 440 L170 420 M270 470 L165 480 M530 440 L630 420 M530 470 L635 480"/>
      <path d="M310 570 Q400 630 490 570"/>
    `),
  },
  {
    id: 'sleepy-kitten',
    title: 'Sleepy Kitten',
    category: 'Cats & Kittens',
    difficulty: 'easy',
    accent: '#ffd9c2',
    svg: page(`
      <ellipse cx="400" cy="480" rx="250" ry="170"/>
      <circle cx="400" cy="370" r="145"/>
      <path d="M285 270 L260 150 L365 230"/>
      <path d="M515 270 L540 150 L435 230"/>
      <path d="M330 375 Q360 400 390 375 M410 375 Q440 400 470 375"/>
      <path d="M385 430 Q400 445 415 430"/>
      <path d="M290 390 L180 370 M290 425 L175 435 M510 390 L620 370 M510 425 L625 435"/>
      <path d="M260 590 Q400 700 540 590"/>
      <path d="M600 600 Q670 560 690 620 Q710 680 640 680"/>
    `),
  },
  {
    id: 'cat-yarn',
    title: 'Cat and Yarn',
    category: 'Cats & Kittens',
    difficulty: 'medium',
    accent: '#d9c6ff',
    svg: page(`
      <circle cx="270" cy="430" r="105"/>
      <path d="M240 360 L225 270 L295 335"/>
      <path d="M300 360 L315 270 L245 335"/>
      <path d="M235 430 Q255 450 275 430 M285 430 Q305 450 325 430"/>
      <path d="M270 465 Q285 480 300 465"/>
      <path d="M360 450 Q420 390 500 420"/>
      <circle cx="600" cy="520" r="95"/>
      <path d="M545 470 Q600 430 655 470 Q700 520 650 570 Q600 620 545 570 Q510 520 545 470"/>
      <path d="M620 590 Q660 670 720 620"/>
      <path d="M240 540 Q200 610 250 650"/>
    `),
  },
  {
    id: 'puppy',
    title: 'Puppy',
    category: 'Dogs & Puppies',
    difficulty: 'easy',
    accent: '#e8c59a',
    svg: page(`
      <ellipse cx="400" cy="480" rx="190" ry="180"/>
      <circle cx="400" cy="350" r="140"/>
      <ellipse cx="265" cy="350" rx="65" ry="130" transform="rotate(15 265 350)"/>
      <ellipse cx="535" cy="350" rx="65" ry="130" transform="rotate(-15 535 350)"/>
      ${eyes(400, 340)}
      <ellipse cx="400" cy="390" rx="55" ry="42"/>
      <ellipse cx="400" cy="380" rx="22" ry="16" fill="${INK}" stroke="none"/>
      <path d="M400 398 L400 425 M400 425 Q375 448 350 430 M400 425 Q425 448 450 430"/>
      <path d="M290 590 L290 670 M510 590 L510 670"/>
      <path d="M220 600 Q400 690 580 600"/>
    `),
  },
  {
    id: 'dog-bone',
    title: 'Puppy and Bone',
    category: 'Dogs & Puppies',
    difficulty: 'medium',
    accent: '#f3d5a6',
    svg: page(`
      <ellipse cx="330" cy="480" rx="160" ry="150"/>
      <circle cx="330" cy="360" r="115"/>
      <ellipse cx="230" cy="370" rx="50" ry="105"/>
      <ellipse cx="430" cy="370" rx="50" ry="105"/>
      ${eyes(330, 350, 34, 7)}
      <ellipse cx="330" cy="395" rx="38" ry="28"/>
      <path d="M330 410 L330 430 M330 430 Q310 450 290 435 M330 430 Q350 450 370 435"/>
      <path d="M250 600 Q330 660 410 600"/>
      <path d="M500 600 Q540 540 620 560 Q700 580 680 650 Q660 710 600 680 Q560 660 580 620 Q600 590 640 600 Q670 610 660 640"/>
      <path d="M530 470 Q600 430 680 470"/>
    `),
  },
  {
    id: 'doghouse',
    title: 'Dog House',
    category: 'Dogs & Puppies',
    difficulty: 'medium',
    accent: '#ffb28a',
    svg: page(`
      <path d="M200 650 L200 360 L400 210 L600 360 L600 650 Z"/>
      <path d="M290 650 L290 480 Q400 400 510 480 L510 650"/>
      <circle cx="400" cy="540" r="70"/>
      ${eyes(400, 530, 22, 6)}
      <ellipse cx="400" cy="565" rx="20" ry="14" fill="${INK}" stroke="none"/>
      <path d="M150 650 L650 650"/>
      <path d="M230 330 L400 215 L570 330"/>
      <circle cx="400" cy="310" r="22"/>
    `),
  },
  {
    id: 'unicorn-head',
    title: 'Unicorn',
    category: 'Unicorns',
    difficulty: 'easy',
    accent: '#e4c9ff',
    svg: page(`
      <path d="M300 650 Q280 460 350 330 Q390 250 470 250 Q550 250 570 330 Q590 420 520 500 Q470 560 460 650"/>
      <path d="M470 250 L500 120 L540 260"/>
      <path d="M500 190 L565 210"/>
      <circle cx="430" cy="370" r="10" fill="${INK}" stroke="none"/>
      <circle cx="505" cy="365" r="10" fill="${INK}" stroke="none"/>
      <path d="M470 420 Q490 435 510 420"/>
      <path d="M360 330 Q330 280 300 300 Q280 330 310 355"/>
      <path d="M520 500 Q590 470 620 520 Q650 580 590 610"/>
      <path d="M330 600 Q400 660 460 600"/>
      <path d="M240 670 Q400 730 560 670"/>
    `),
  },
  {
    id: 'unicorn-rainbow',
    title: 'Unicorn Rainbow',
    category: 'Unicorns',
    difficulty: 'medium',
    accent: '#ffc6e0',
    svg: page(`
      <path d="M110 520 Q110 250 400 250 Q690 250 690 520"/>
      <path d="M160 520 Q160 310 400 310 Q640 310 640 520"/>
      <path d="M210 520 Q210 370 400 370 Q590 370 590 520"/>
      <path d="M260 520 Q260 430 400 430 Q540 430 540 520"/>
      <circle cx="400" cy="610" r="110"/>
      <path d="M330 540 L320 430 L390 510"/>
      <path d="M470 540 L480 430 L410 510"/>
      ${eyes(400, 600, 30, 7)}
      <path d="M385 640 Q400 655 415 640"/>
      <path d="M120 610 Q90 660 130 690"/>
      <path d="M680 610 Q710 660 670 690"/>
    `),
  },
  {
    id: 'castle',
    title: 'Castle',
    category: 'Princesses & Castles',
    difficulty: 'medium',
    accent: '#ffb6d5',
    svg: page(`
      <path d="M180 650 L180 360 L250 360 L250 300 L320 300 L320 360 L480 360 L480 300 L550 300 L550 360 L620 360 L620 650 Z"/>
      <path d="M250 360 L250 240 L320 240 L320 360"/>
      <path d="M480 360 L480 240 L550 240 L550 360"/>
      <path d="M330 650 L330 520 Q400 460 470 520 L470 650"/>
      <path d="M330 520 Q400 470 470 520"/>
      <path d="M380 650 L380 590 Q400 570 420 590 L420 650"/>
      <path d="M150 650 L650 650"/>
      <path d="M250 240 L285 180 L320 240"/>
      <path d="M480 240 L515 180 L550 240"/>
      <circle cx="400" cy="300" r="22"/>
    `),
  },
  {
    id: 'crown',
    title: 'Royal Crown',
    category: 'Princesses & Castles',
    difficulty: 'easy',
    accent: '#ffe28a',
    svg: page(`
      <path d="M180 580 L150 300 L280 430 L400 230 L520 430 L650 300 L620 580 Z"/>
      <path d="M180 580 Q400 650 620 580"/>
      <circle cx="150" cy="280" r="28"/>
      <circle cx="400" cy="210" r="28"/>
      <circle cx="650" cy="280" r="28"/>
      <path d="M240 500 Q400 550 560 500"/>
      <circle cx="400" cy="430" r="34"/>
      <path d="M400 396 L400 464 M366 430 L434 430"/>
    `),
  },
  {
    id: 'princess',
    title: 'Princess',
    category: 'Princesses & Castles',
    difficulty: 'medium',
    accent: '#ffc6e4',
    svg: page(`
      <circle cx="400" cy="270" r="110"/>
      <path d="M300 250 Q400 140 500 250"/>
      <path d="M330 220 Q400 170 470 220"/>
      ${eyes(400, 270, 36, 7)}
      <path d="M385 310 Q400 325 415 310"/>
      <path d="M400 380 L310 650 L490 650 Z"/>
      <path d="M340 470 L400 520 L460 470"/>
      <path d="M400 520 L360 650 M400 520 L440 650"/>
      <path d="M300 650 Q400 700 500 650"/>
      <path d="M260 380 L220 330 L300 350"/>
      <path d="M540 380 L580 330 L500 350"/>
    `),
  },
  {
    id: 'stegosaurus',
    title: 'Stegosaurus',
    category: 'Dinosaurs',
    difficulty: 'easy',
    accent: '#bfe3a0',
    svg: page(`
      <path d="M180 560 Q180 380 360 360 Q540 340 650 470 Q700 540 650 610 L200 610 Q150 600 180 560"/>
      <path d="M280 360 L250 250 L330 320"/>
      <path d="M360 330 L350 200 L430 300"/>
      <path d="M450 335 L470 210 L520 335"/>
      <path d="M540 380 L590 280 L610 410"/>
      <path d="M180 500 Q120 470 100 510 Q90 550 150 560"/>
      <circle cx="620" cy="500" r="10" fill="${INK}" stroke="none"/>
      ${smile(620, 535, 30)}
      <path d="M260 610 L240 690 M560 610 L580 690"/>
      <path d="M300 610 L300 680 M500 610 L500 680"/>
    `),
  },
  {
    id: 't-rex',
    title: 'T-Rex',
    category: 'Dinosaurs',
    difficulty: 'medium',
    accent: '#c6e8b2',
    svg: page(`
      <path d="M300 600 Q260 430 350 330 Q430 240 530 300 Q610 350 600 450 Q590 520 520 540 Q470 550 460 600"/>
      <path d="M350 330 Q300 260 350 190 Q410 130 480 200 Q520 250 500 300"/>
      <path d="M350 190 Q300 210 310 260"/>
      <circle cx="465" cy="245" r="10" fill="${INK}" stroke="none"/>
      <path d="M470 300 Q520 290 560 320"/>
      <path d="M460 600 L440 700 L500 700 L510 610"/>
      <path d="M360 600 L330 700 L390 700 L400 610"/>
      <path d="M300 470 Q240 430 210 470"/>
      <path d="M520 540 Q590 570 620 530"/>
      <path d="M300 360 Q250 320 210 350"/>
    `),
  },
  {
    id: 'dino-egg',
    title: 'Dinosaur Egg',
    category: 'Dinosaurs',
    difficulty: 'easy',
    accent: '#d7edb5',
    svg: page(`
      <path d="M400 170 Q540 170 600 420 Q650 650 400 680 Q150 650 200 420 Q260 170 400 170"/>
      <path d="M240 430 Q320 380 400 430 Q480 380 560 430"/>
      <path d="M270 520 Q350 470 430 520 Q510 470 580 520"/>
      <circle cx="330" cy="330" r="45"/>
      <circle cx="470" cy="310" r="30"/>
      <circle cx="520" cy="600" r="34"/>
      <path d="M300 240 Q320 200 360 210"/>
      <path d="M180 680 L620 680"/>
      <path d="M230 720 Q400 760 570 720"/>
    `),
  },
  {
    id: 'octopus',
    title: 'Octopus',
    category: 'Underwater',
    difficulty: 'easy',
    accent: '#ffb6d5',
    svg: page(`
      <path d="M400 180 Q550 180 560 360 Q560 450 520 480 Q500 560 470 620 Q450 660 420 620 Q400 590 390 620 Q370 670 340 620 Q310 560 290 480 Q240 450 240 360 Q250 180 400 180"/>
      ${eyes(400, 330, 55, 10)}
      <path d="M375 385 Q400 410 425 385"/>
      <path d="M300 440 Q260 480 280 540 Q300 600 260 650"/>
      <path d="M340 460 Q320 540 350 600 Q370 650 330 690"/>
      <path d="M460 460 Q480 540 450 600 Q430 650 470 690"/>
      <path d="M500 440 Q540 480 520 540 Q500 600 540 650"/>
      <circle cx="250" cy="200" r="18"/>
      <circle cx="600" cy="250" r="24"/>
      <circle cx="170" cy="560" r="14"/>
    `),
  },
  {
    id: 'seahorse',
    title: 'Seahorse',
    category: 'Underwater',
    difficulty: 'medium',
    accent: '#ffd08a',
    svg: page(`
      <path d="M430 180 Q520 180 530 270 Q540 340 480 380 Q440 410 460 460 Q490 520 440 570 Q400 610 350 580 Q310 550 340 510 Q370 480 350 450 Q320 420 330 370 Q340 300 390 270 Q410 250 400 220"/>
      <path d="M430 180 L480 120 L500 210"/>
      <circle cx="460" cy="270" r="9" fill="${INK}" stroke="none"/>
      <path d="M470 310 Q510 300 530 330"/>
      <path d="M360 570 Q330 630 370 670 Q410 700 450 660"/>
      <path d="M340 450 Q280 470 290 520"/>
      <path d="M420 620 Q390 670 420 710"/>
      <circle cx="230" cy="260" r="16"/>
      <circle cx="620" cy="450" r="22"/>
      <circle cx="650" cy="250" r="12"/>
    `),
  },
  {
    id: 'whale',
    title: 'Whale',
    category: 'Underwater',
    difficulty: 'easy',
    accent: '#a9d8ff',
    svg: page(`
      <path d="M170 480 Q170 300 380 300 Q550 300 610 420 Q650 500 580 540 Q520 575 450 540 Q400 520 360 540 Q250 590 170 480"/>
      <path d="M610 420 Q690 380 720 430 Q740 480 690 500 Q660 510 620 490"/>
      <path d="M330 300 Q360 220 430 220 Q500 220 520 300"/>
      <circle cx="470" cy="400" r="10" fill="${INK}" stroke="none"/>
      <path d="M490 450 Q530 470 560 445"/>
      <path d="M250 360 Q300 320 360 340"/>
      <path d="M200 600 Q260 650 330 620"/>
      <path d="M600 600 Q660 640 710 610"/>
      <path d="M400 200 L380 150 M430 200 L440 140 M460 205 L490 160"/>
    `),
  },
  {
    id: 'butterfly',
    title: 'Butterfly',
    category: 'Butterflies & Flowers',
    difficulty: 'easy',
    accent: '#ffc6e0',
    svg: page(`
      <path d="M400 300 Q300 170 200 230 Q120 280 190 380 Q240 450 360 430"/>
      <path d="M400 300 Q500 170 600 230 Q680 280 610 380 Q560 450 440 430"/>
      <path d="M400 430 Q310 470 250 570 Q210 650 300 660 Q370 665 400 570"/>
      <path d="M400 430 Q490 470 550 570 Q590 650 500 660 Q430 665 400 570"/>
      <ellipse cx="400" cy="420" rx="35" ry="150"/>
      <path d="M380 280 Q340 220 300 210 M420 280 Q460 220 500 210"/>
      <circle cx="270" cy="330" r="42"/>
      <circle cx="530" cy="330" r="42"/>
      <circle cx="315" cy="560" r="28"/>
      <circle cx="485" cy="560" r="28"/>
    `),
  },
  {
    id: 'flower',
    title: 'Happy Flower',
    category: 'Butterflies & Flowers',
    difficulty: 'easy',
    accent: '#ffd6e7',
    svg: page(`
      <circle cx="400" cy="300" r="85"/>
      <ellipse cx="400" cy="155" rx="75" ry="115"/>
      <ellipse cx="400" cy="445" rx="75" ry="115"/>
      <ellipse cx="255" cy="300" rx="115" ry="75"/>
      <ellipse cx="545" cy="300" rx="115" ry="75"/>
      <ellipse cx="300" cy="200" rx="75" ry="100" transform="rotate(-45 300 200)"/>
      <ellipse cx="500" cy="200" rx="75" ry="100" transform="rotate(45 500 200)"/>
      <ellipse cx="300" cy="400" rx="75" ry="100" transform="rotate(45 300 400)"/>
      <ellipse cx="500" cy="400" rx="75" ry="100" transform="rotate(-45 500 400)"/>
      <circle cx="400" cy="300" r="85"/>
      ${eyes(400, 290, 28, 7)}
      ${smile(400, 325, 40)}
      <path d="M400 500 L400 720"/>
      <path d="M400 600 Q300 540 250 610 Q320 670 400 630"/>
      <path d="M400 640 Q500 580 550 650 Q480 710 400 670"/>
      <path d="M250 730 Q400 770 550 730"/>
    `),
  },
  {
    id: 'bee',
    title: 'Bumble Bee',
    category: 'Butterflies & Flowers',
    difficulty: 'medium',
    accent: '#ffe58a',
    svg: page(`
      <ellipse cx="400" cy="400" rx="190" ry="150"/>
      <path d="M300 260 Q250 180 180 200 Q150 250 230 310"/>
      <path d="M500 260 Q550 180 620 200 Q650 250 570 310"/>
      <path d="M250 400 Q400 470 550 400"/>
      <path d="M270 470 Q400 540 530 470"/>
      <circle cx="330" cy="360" r="12" fill="${INK}" stroke="none"/>
      <circle cx="470" cy="360" r="12" fill="${INK}" stroke="none"/>
      <path d="M375 420 Q400 445 425 420"/>
      <path d="M590 430 Q650 450 680 410"/>
      <circle cx="680" cy="390" r="12" fill="${INK}" stroke="none"/>
      <path d="M240 600 Q400 680 560 600"/>
      <path d="M320 680 Q400 720 480 680"/>
    `),
  },
  {
    id: 'fairy',
    title: 'Fairy',
    category: 'Fairies & Magic',
    difficulty: 'medium',
    accent: '#d9c6ff',
    svg: page(`
      <circle cx="400" cy="250" r="90"/>
      <path d="M330 210 Q400 120 470 210"/>
      ${eyes(400, 250, 30, 7)}
      <path d="M385 290 Q400 305 415 290"/>
      <path d="M400 340 L330 620 L470 620 Z"/>
      <path d="M330 620 Q400 680 470 620"/>
      <path d="M350 400 Q230 330 180 430 Q150 510 300 500"/>
      <path d="M450 400 Q570 330 620 430 Q650 510 500 500"/>
      <path d="M260 470 Q300 430 350 470"/>
      <path d="M540 470 Q500 430 450 470"/>
      <path d="M600 200 L640 160 M620 250 L680 240 M560 170 L570 110"/>
      <circle cx="660" cy="300" r="14"/>
    `),
  },
  {
    id: 'mushroom-house',
    title: 'Mushroom House',
    category: 'Fairies & Magic',
    difficulty: 'medium',
    accent: '#ffc6b0',
    svg: page(`
      <path d="M200 400 Q200 180 400 180 Q600 180 600 400 Z"/>
      <path d="M270 400 L270 650 L530 650 L530 400"/>
      <path d="M340 650 L340 520 Q400 460 460 520 L460 650"/>
      <circle cx="310" cy="290" r="36"/>
      <circle cx="430" cy="250" r="28"/>
      <circle cx="520" cy="315" r="34"/>
      <circle cx="400" cy="330" r="22"/>
      <path d="M270 470 Q400 520 530 470"/>
      <path d="M150 650 L650 650"/>
      <path d="M220 690 Q400 730 580 690"/>
      <path d="M600 600 Q650 550 690 600"/>
    `),
  },
  {
    id: 'rocket',
    title: 'Rocket',
    category: 'Space & Rockets',
    difficulty: 'easy',
    accent: '#a9d8ff',
    svg: page(`
      <path d="M400 140 Q520 260 520 460 L280 460 Q280 260 400 140"/>
      <circle cx="400" cy="330" r="65"/>
      <circle cx="400" cy="330" r="30"/>
      <path d="M280 460 L230 570 L320 530"/>
      <path d="M520 460 L570 570 L480 530"/>
      <path d="M340 460 L340 650 Q400 710 460 650 L460 460"/>
      <path d="M360 540 Q400 500 440 540 Q470 590 400 630 Q330 590 360 540"/>
      <path d="M180 220 L210 250 M620 180 L650 150 M180 620 L150 650 M620 620 L660 650"/>
      <circle cx="650" cy="300" r="12"/>
      <circle cx="140" cy="390" r="18"/>
    `),
  },
  {
    id: 'planet',
    title: 'Ringed Planet',
    category: 'Space & Rockets',
    difficulty: 'easy',
    accent: '#d9c6ff',
    svg: page(`
      <circle cx="400" cy="380" r="190"/>
      <ellipse cx="400" cy="380" rx="300" ry="80" transform="rotate(-18 400 380)"/>
      <path d="M300 270 Q360 220 430 250"/>
      <path d="M470 470 Q520 430 550 460"/>
      <circle cx="340" cy="330" r="38"/>
      <circle cx="460" cy="430" r="26"/>
      <circle cx="150" cy="180" r="16"/>
      <circle cx="650" cy="620" r="22"/>
      <path d="M600 180 L640 140 M620 220 L680 210 M180 600 L140 640"/>
      <path d="M110 500 L150 500 M130 480 L130 520"/>
    `),
  },
  {
    id: 'car',
    title: 'Happy Car',
    category: 'Vehicles',
    difficulty: 'easy',
    accent: '#ffb28a',
    svg: page(`
      <path d="M170 520 L170 430 Q170 390 220 390 L310 390 L370 300 L520 300 L580 390 L650 390 Q690 390 690 430 L690 520 Z"/>
      <path d="M330 390 L390 320 L500 320 L550 390 Z"/>
      <circle cx="280" cy="550" r="65"/>
      <circle cx="280" cy="550" r="28"/>
      <circle cx="590" cy="550" r="65"/>
      <circle cx="590" cy="550" r="28"/>
      <path d="M340 470 L500 470"/>
      <path d="M170 500 L120 500 M690 500 L740 500"/>
      <path d="M100 620 Q400 670 700 620"/>
      <circle cx="620" cy="450" r="14"/>
    `),
  },
  {
    id: 'train',
    title: 'Choo Choo Train',
    category: 'Vehicles',
    difficulty: 'medium',
    accent: '#a9e4d0',
    svg: page(`
      <path d="M160 600 L160 430 L300 430 L300 340 L450 340 L450 430 L620 430 L620 600 Z"/>
      <path d="M300 430 L300 600 M450 430 L450 600"/>
      <circle cx="230" cy="630" r="55"/>
      <circle cx="370" cy="630" r="55"/>
      <circle cx="540" cy="630" r="55"/>
      <path d="M340 340 L340 250 L410 250 L410 340"/>
      <path d="M360 250 Q380 200 410 230 Q430 250 410 270"/>
      <path d="M180 470 L260 470 M480 470 L600 470"/>
      <circle cx="210" cy="500" r="20"/>
      <circle cx="560" cy="500" r="20"/>
      <path d="M100 700 L700 700"/>
      <path d="M620 340 Q680 300 720 340"/>
    `),
  },
  {
    id: 'snowman',
    title: 'Snowman',
    category: 'Holidays & Seasons',
    difficulty: 'easy',
    accent: '#bfe4ff',
    svg: page(`
      <circle cx="400" cy="580" r="150"/>
      <circle cx="400" cy="380" r="110"/>
      <circle cx="400" cy="250" r="80"/>
      <path d="M320 200 L480 200 L460 150 L340 150 Z"/>
      <path d="M320 220 L480 220"/>
      <circle cx="370" cy="240" r="8" fill="${INK}" stroke="none"/>
      <circle cx="430" cy="240" r="8" fill="${INK}" stroke="none"/>
      <path d="M400 255 L450 270 L400 285 Z"/>
      <path d="M360 290 Q400 320 440 290"/>
      <circle cx="400" cy="370" r="10"/>
      <circle cx="400" cy="420" r="10"/>
      <circle cx="400" cy="470" r="10"/>
      <path d="M280 380 L170 320 M520 380 L630 320"/>
      <path d="M170 320 L150 270 M170 320 L210 280 M630 320 L650 270 M630 320 L590 280"/>
      <path d="M300 620 L260 700 M500 620 L540 700"/>
    `),
  },
  {
    id: 'pumpkin',
    title: 'Pumpkin',
    category: 'Holidays & Seasons',
    difficulty: 'easy',
    accent: '#ffcf8a',
    svg: page(`
      <ellipse cx="400" cy="480" rx="240" ry="190"/>
      <path d="M400 290 Q330 480 400 670"/>
      <path d="M400 290 Q470 480 400 670"/>
      <path d="M300 330 Q250 480 300 630"/>
      <path d="M500 330 Q550 480 500 630"/>
      <path d="M380 300 Q360 220 410 190 Q450 170 470 200"/>
      <path d="M330 440 L370 470 L330 500 Z"/>
      <path d="M470 440 L430 470 L470 500 Z"/>
      <path d="M350 540 Q400 580 450 540"/>
      <path d="M250 690 Q400 730 550 690"/>
      <path d="M180 240 L220 200 M620 240 L580 200"/>
    `),
  },
  {
    id: 'horse',
    title: 'Horse',
    category: 'Horses & Ponies',
    difficulty: 'easy',
    accent: '#ffd8b0',
    svg: page(`
      <ellipse cx="360" cy="450" rx="190" ry="110"/>
      <path d="M505 395 Q510 285 570 225 Q620 180 660 225 Q690 270 645 315 L600 355 Q575 405 560 455"/>
      <path d="M585 220 Q570 170 600 140 Q625 180 625 225"/>
      <path d="M640 255 Q675 265 690 295"/>
      <path d="M505 395 Q470 360 430 380"/>
      <path d="M230 430 Q170 390 150 440 Q170 490 235 485"/>
      <path d="M270 535 L255 690 Q255 710 280 710 L310 710"/>
      <path d="M340 545 L335 690 Q335 710 360 710 L390 710"/>
      <path d="M450 545 L455 690 Q455 710 480 710 L510 690"/>
      <path d="M520 510 L550 660 Q555 690 580 690 L600 660"/>
      <circle cx="620" cy="265" r="10" fill="${INK}" stroke="none"/>
      <path d="M650 300 Q670 310 680 330"/>
      <path d="M120 700 Q400 740 680 700"/>
    `),
  },
  {
    id: 'pony',
    title: 'Pony',
    category: 'Horses & Ponies',
    difficulty: 'easy',
    accent: '#ffc9d9',
    svg: page(`
      <ellipse cx="400" cy="525" rx="170" ry="135"/>
      <circle cx="400" cy="330" r="145"/>
      <path d="M280 250 Q245 165 315 120 Q370 85 430 120 Q485 160 505 235"/>
      <path d="M310 180 Q300 130 330 105"/>
      <path d="M490 180 Q500 130 470 105"/>
      <ellipse cx="400" cy="405" rx="85" ry="58"/>
      <circle cx="355" cy="330" r="10" fill="${INK}" stroke="none"/>
      <circle cx="445" cy="330" r="10" fill="${INK}" stroke="none"/>
      <path d="M375 405 Q400 425 425 405"/>
      <path d="M370 450 Q400 465 430 450"/>
      <path d="M290 600 L280 700 Q280 715 300 715 L330 715"/>
      <path d="M510 600 L520 700 Q520 715 500 715 L470 715"/>
      <path d="M230 480 Q180 440 170 500 Q190 540 245 520"/>
      <path d="M170 250 Q150 220 160 190"/>
      <circle cx="220" cy="290" r="14"/>
      <circle cx="580" cy="290" r="14"/>
    `),
  },
  {
    id: 'horse-foal',
    title: 'Horse and Foal',
    category: 'Horses & Ponies',
    difficulty: 'medium',
    accent: '#ffe0c2',
    svg: page(`
      <ellipse cx="300" cy="450" rx="150" ry="90"/>
      <path d="M420 400 Q430 310 480 260 Q520 220 550 255 Q575 295 535 330 L500 365 Q480 410 470 450"/>
      <path d="M480 260 Q470 215 495 190 Q515 225 515 260"/>
      <circle cx="535" cy="285" r="7" fill="${INK}" stroke="none"/>
      <path d="M220 440 Q170 410 155 450 Q175 490 225 485"/>
      <path d="M230 530 L220 660 M280 535 L280 660 M350 535 L355 660 M400 515 L420 640"/>
      <ellipse cx="590" cy="565" rx="95" ry="60"/>
      <path d="M650 535 Q665 475 700 450 Q725 430 745 455 Q760 485 730 510 L710 535"/>
      <path d="M700 450 Q695 420 715 405 Q730 430 730 455"/>
      <circle cx="730" cy="470" r="5" fill="${INK}" stroke="none"/>
      <path d="M545 555 L540 650 M590 560 L590 650 M635 550 L645 640"/>
      <path d="M510 545 Q480 520 470 550"/>
      <path d="M100 680 Q400 730 720 680"/>
      <path d="M350 180 Q370 150 400 160"/>
    `),
  },
  {
    id: 'pegasus',
    title: 'Pegasus',
    category: 'Horses & Ponies',
    difficulty: 'medium',
    accent: '#d9e8ff',
    svg: page(`
      <ellipse cx="370" cy="460" rx="170" ry="95"/>
      <path d="M500 410 Q510 300 570 245 Q615 205 650 245 Q675 285 635 320 L600 355 Q580 400 565 455"/>
      <path d="M585 240 Q570 190 600 160 Q625 200 625 240"/>
      <circle cx="620" cy="280" r="8" fill="${INK}" stroke="none"/>
      <path d="M650 315 Q675 325 685 345"/>
      <path d="M330 390 Q250 280 180 300 Q130 320 160 380 Q190 430 270 430 Q210 470 230 520 Q270 560 340 520"/>
      <path d="M260 390 Q300 350 340 390"/>
      <path d="M220 430 Q260 400 300 430"/>
      <path d="M280 535 L270 670 M350 545 L350 670 M450 540 L460 670 M510 505 L540 640"/>
      <path d="M220 440 Q170 410 155 450 Q175 490 225 485"/>
      <path d="M100 690 Q400 740 700 690"/>
      <path d="M180 200 L200 170 M150 240 L120 220"/>
    `),
  },
  {
    id: 'unicorn-family',
    title: 'Unicorn Family',
    category: 'Unicorns',
    difficulty: 'medium',
    accent: '#ffd6ee',
    svg: page(`
      <path d="M170 640 Q150 500 230 410 Q290 340 370 370 Q430 390 440 470 Q450 550 400 640"/>
      <path d="M230 410 L210 290 L300 380"/>
      <path d="M210 330 L170 310"/>
      <circle cx="280" cy="460" r="8" fill="${INK}" stroke="none"/>
      <path d="M320 500 Q350 515 380 500"/>
      <path d="M390 600 Q470 550 520 610"/>
      <path d="M520 630 Q510 480 580 400 Q630 340 700 370 Q760 395 760 470 Q760 550 710 630"/>
      <path d="M580 400 L565 280 L650 370"/>
      <path d="M565 320 L525 300"/>
      <circle cx="635" cy="450" r="8" fill="${INK}" stroke="none"/>
      <path d="M670 490 Q700 505 730 490"/>
      <path d="M300 640 L290 710 M380 640 L390 710 M560 630 L550 710 M650 630 L660 710"/>
      <path d="M100 710 Q400 760 720 710"/>
      <path d="M330 250 L350 210 M680 240 L710 210"/>
      <circle cx="250" cy="250" r="12"/>
      <circle cx="720" cy="310" r="10"/>
    `),
  },
]

export const COLORING_TEMPLATES = templates

export const COLORING_CATEGORIES: ColoringCategory[] = [
  'Animals',
  'Cats & Kittens',
  'Dogs & Puppies',
  'Unicorns',
  'Horses & Ponies',
  'Princesses & Castles',
  'Dinosaurs',
  'Underwater',
  'Butterflies & Flowers',
  'Fairies & Magic',
  'Space & Rockets',
  'Vehicles',
  'Holidays & Seasons',
]

const imageCache = new Map<string, Promise<HTMLImageElement>>()
const loadedCache = new Map<string, Promise<LoadedColoringTemplate>>()

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(svg)
  if (cached) return cached
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load coloring page'))
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
  imageCache.set(svg, promise)
  return promise
}

export class ColoringTemplateManager {
  getTemplate(id: string | undefined): ColoringTemplate | undefined {
    return COLORING_TEMPLATES.find((template) => template.id === id)
  }

  async load(template: ColoringTemplate): Promise<LoadedColoringTemplate> {
    const cached = loadedCache.get(template.id)
    if (cached) return cached
    const promise = (async () => {
      const image = await loadSvgImage(template.svg)
      const canvas = document.createElement('canvas')
      canvas.width = COLORING_RESOLUTION
      canvas.height = COLORING_RESOLUTION
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Canvas is not available')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      const lineData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const barrier = buildBarrier(lineData, 26, 1)
      return { template, image, lineData, barrier }
    })()
    loadedCache.set(template.id, promise)
    return promise
  }

  preload(ids: string[]) {
    for (const id of ids) {
      const template = this.getTemplate(id)
      if (template) void this.load(template).catch(() => undefined)
    }
  }
}

export const coloringTemplateManager = new ColoringTemplateManager()