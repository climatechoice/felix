import startLesson from './LessonTour';

import img1 from '../imgs/lesson/1.png';
import img2 from '../imgs/lesson/2.png';
import img3 from '../imgs/lesson/3.png';
import img4 from '../imgs/lesson/4.png';
import img5 from '../imgs/lesson/5.png';
import img6 from '../imgs/lesson/6.png';
import img7 from '../imgs/lesson/7.png';


/**
 * startLesson8()
 * Creates an 8-step lesson using user's images and provided text.
 */
export function startLesson8() {
  const steps = [
    {
      title: 'Food Demand',
      subtitle: 'How it all begins',
      description: `<p>It all begins with the demand for food. To produce the food we eat, agriculture needs land for crops and animals, and water to grow and feed them.</p>`,
      image: img1,
      graphId: 'x1'
    },
    // Population step removed as requested
    {
      title: 'Water',
      subtitle: 'Growing our food',
      description: `<p>Water is essential for producing food. It helps crops grow and is also used to produce feed for livestock. When water is available, crop yields improve and more food can be produced.</p>`,
      image: img2,
      graphId: 'x2'
    },
    {
      title: 'Land',
      subtitle: 'Growing our food',
      description: `<p>As the demand for food grows, more land is often needed. Forests and natural ecosystems may be converted into farmland to grow more crops and raise more animals.</p>`,
      image: img3,
      graphId: 'x3'
    },
    {
      title: 'Fertilizer',
      subtitle: 'Growing our food',
      description: `<p>When expanding farmland becomes difficult, farmers try to grow more on the same land. Fertilizers help crops grow faster and increase how much food that land can produce.</p>`,
      image: img4,
      graphId: 'x4'
    },
    {
      title: 'Biodiversity',
      subtitle: 'How our choices affect us and nature',
      description: `<p>Producing more food can also affect nature. Expanding farmland and using fertilizers can reduce biodiversity and change ecosystems that farming depends on.</p>`,
      image: img5,
      graphId: 'x5'
    },
    {
      title: 'Climate',
      subtitle: 'How our choices affect us and nature',
      description: `<p>Food production also releases greenhouse gases—from livestock, fertilizers, and land-use change. These emissions warm the climate, which over time can affect crops, water, and ecosystems.</p>`,
      image: img6,
      graphId: 'x6'
    },
    {
      title: 'Food Security',
      subtitle: 'How our choices affect us and nature',
      description: `<p>These changes can feed back into the food system. When food supply cannot keep up, undernourishment increases, shaping how much food people are able to consume.</p>`,
      image: img7,
      graphId: 'x7'
    }
  ];

  // Use lesson's internal rendering only (renders into lesson container)
  const lesson = startLesson(steps);

  return lesson;
}

export default startLesson8;
